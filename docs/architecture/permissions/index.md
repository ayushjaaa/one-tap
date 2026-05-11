# Permissions System

**Status:** 🔵 In progress — design phase  
**Last Updated:** 2026-05-11

---

## Overview

Every protected action in OneTap365 asks one question: "does this user have permission X?"

The system uses a single unified concept called a **permission** for three distinct things:

| What it represents | Example | Old name (deprecated) |
|--------------------|---------|----------------------|
| An explicit identity label granted by an admin | `identity:admin` | "role" |
| A state derived from system conditions | `seller:individual` | "derived role" |
| A feature flag controlling access to a feature | `feature:beta_chat` | "feature flag" |

All three are permissions. Business logic never cares how a permission was acquired — it only asks "does this user have permission X?" via a single shared utility in `@onetap/shared`.

---

## Naming Convention

**Separator:** `:` between namespace and identifier.  
**Pattern:** `{namespace}:{identifier}` for identity/state; `{resource}:{action}` for capabilities.  
**Case:** lowercase. Use `_` within a segment for multi-word identifiers.

```
{namespace}   :   {identifier}
   seller     :   individual          ← state (who you are)
   feature    :   beta_chat           ← feature flag (what you can see)
   listing    :   approve             ← capability (what you can do)
```

---

## Namespace Inventory

| Namespace | Meaning | Source | Examples |
|-----------|---------|--------|---------|
| `identity` | Coarse identity labels assigned by admin | Explicitly granted | `identity:admin` · `identity:moderator` |
| `seller` | Seller state — what kind of seller the user is | Derived — **never stored directly** | `seller:individual` · `seller:wholesale` |
| `feature` | Feature flag — gates access to a feature or rollout | Explicit grant or rollout rule | `feature:beta_chat` · `feature:new_home` |
| `listing` | Actions on product listings | Derived from identity/seller state | `listing:create` · `listing:approve` · `listing:reject` · `listing:remove` |
| `kyc` | Admin actions on seller KYC records | Derived from `identity:admin` | `kyc:approve` · `kyc:reject` |
| `package` | Actions on posting packages | Derived from seller/admin state | `package:purchase` · `package:manage` |
| `category` | Actions on the category tree | Derived from `identity:admin` | `category:manage` |
| `media` | Media upload and management | Derived from seller state | `media:upload` |
| `chat` | Chat actions | Derived from user state | `chat:send` · `chat:moderate` |
| `user` | Admin actions on user accounts | Derived from `identity:admin` | `user:ban` · `user:view_pii` |
| `audit` | Access to audit logs | Derived from `identity:admin` | `audit:view` |
| `payment` | Payment and refund admin actions | Derived from `identity:admin` | `payment:refund` |

> **`kyc` vs `seller` namespace:** Admin actions on verification records live in `kyc:*`, not `seller:*`. This keeps `seller:*` purely descriptive of the user's own seller state. They never collide.

---

## The Three Sources

| Source | How it is acquired | How it is removed | Example |
|--------|-------------------|-------------------|---------|
| **Assignable** | Admin explicitly grants it | Admin explicitly revokes it | `identity:admin` |
| **Derived** | System sets it when state conditions are met | System removes it when conditions no longer hold | `seller:individual` |
| **Feature** | Explicit grant OR rollout rule (% rollout, user list) | Revoke grant or adjust rollout rule | `feature:beta_chat` |

A **derived permission is never stored on the user document directly.** It is computed at request time from authoritative fields in the user document: `isAadhaarVerified`, `isSellerActive`, `sellerType`, `kycAdminStatus`. Revoking `isSellerActive` instantly removes `seller:individual` with no extra write. This keeps revocation cheap and consistent.

---

## Permission Bundles

Assignable identities and derived states expand into sets of fine-grained capability permissions. These bundles are **configuration** — they live in a config object in `@onetap/shared/permissions/bundles.ts`, not in `if/else` statements scattered across the codebase.

```ts
// @onetap/shared/permissions/bundles.ts

export const PERMISSION_BUNDLES: Record<string, string[]> = {
  'identity:admin': [
    'listing:approve', 'listing:reject',
    'kyc:approve', 'kyc:reject',
    'package:manage', 'category:manage',
    'chat:moderate',
    'user:ban', 'user:view_pii',
    'audit:view',
    'payment:refund',
  ],
  'identity:moderator': [
    'listing:approve', 'listing:reject',
    'chat:moderate',
    'user:ban',
  ],
  'seller:individual': [
    'listing:create', 'listing:remove',
    'package:purchase',
    'media:upload',
    'chat:send',
  ],
  'seller:wholesale': [
    'listing:create', 'listing:remove',
    'package:purchase',
    'media:upload',
    'chat:send',
    // identical to individual for now — may diverge later
  ],
};
```

To add a new capability, update this config. No other code changes needed.

---

## Computing Permissions for a User

A user's effective permissions are the union of:
1. Permissions from their **assignable** identity labels (e.g., `identity:admin` expands via bundle)
2. Permissions from their **derived** state (computed from user document fields)
3. Any **feature** permissions explicitly granted or matched by rollout rule

```ts
// @onetap/shared/permissions/compute.ts

export function computePermissions(user: UserDocument): string[] {
  const permissions = new Set<string>();

  // 1. Assignable — from stored identity labels
  for (const label of user.identityLabels ?? []) {
    for (const cap of PERMISSION_BUNDLES[label] ?? []) {
      permissions.add(cap);
    }
    permissions.add(label); // the label itself is also a permission
  }

  // 2. Derived — from system state fields
  if (user.isSellerActive && user.sellerType === 'individual') {
    permissions.add('seller:individual');
    for (const cap of PERMISSION_BUNDLES['seller:individual']) {
      permissions.add(cap);
    }
  }
  if (user.isSellerActive && user.sellerType === 'wholesale') {
    permissions.add('seller:wholesale');
    for (const cap of PERMISSION_BUNDLES['seller:wholesale']) {
      permissions.add(cap);
    }
  }

  // 3. Feature flags — from explicit grants
  for (const flag of user.featureFlags ?? []) {
    permissions.add(`feature:${flag}`);
  }

  return Array.from(permissions);
}
```

---

## The Two Check Forms

All business logic uses exactly two check forms, both on a `PermissionContext` object populated after auth middleware runs:

```ts
// Capability check — protects an action or resource
user.can('listing:create')      // can this user create a listing?
user.can('kyc:approve')         // can this user approve a KYC request?

// State check — drives UI conditions or branching logic
user.has('seller:individual')   // is this user an individual seller?
user.has('feature:beta_chat')   // does this user have beta_chat enabled?
```

`can(p)` — resolves through the bundle map: does the user's effective permission set include `p`?  
`has(p)` — checks the raw permission list directly without bundle expansion.  
Both are pure lookups after `computePermissions()` has run.

```ts
// @onetap/shared/permissions/context.ts

export class PermissionContext {
  private readonly perms: ReadonlySet<string>;

  constructor(permissions: string[]) {
    this.perms = new Set(permissions);
  }

  can(permission: string): boolean {
    return this.perms.has(permission);
  }

  has(permission: string): boolean {
    return this.perms.has(permission);
  }
}
```

---

## Route Middleware Pattern

Each service uses an `authorize(permission)` middleware factory that calls `user.can()`. The gateway attaches a minimal user context header; each service reconstructs the `PermissionContext` from it.

```ts
// @onetap/shared/middlewares/authorize.ts

export const authorize = (permission: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.can(permission)) {
      throw new ApiError(403, 'Forbidden');
    }
    next();
  };

// Usage in listing-service
router.post('/listings', authMiddleware, authorize('listing:create'), createListingHandler);
router.patch('/listings/:id/approve', authMiddleware, authorize('listing:approve'), approveListingHandler);
```

---

## How Permissions Travel Between Services

The gateway decodes the session from the `Authorization` header (calls `auth-service` to validate). It then injects a compact signed claim into an internal `X-User-Context` header that downstream services trust.

```
Mobile App  ──bearer token──▶  Gateway
Gateway  ──validates session──▶  auth-service
auth-service  ──returns user doc──▶  Gateway
Gateway  ──X-User-Context: <signed JWT>──▶  downstream service
downstream service  ──reconstructs PermissionContext──▶  authorize() middleware
```

The `X-User-Context` JWT contains: `userId`, `identityLabels`, `sellerType`, `isSellerActive`, `featureFlags`, and an `iat` timestamp. The downstream service calls `computePermissions()` locally — no further auth-service call.

> **Open question:** Is gateway-injected header sufficient, or do some services need to re-fetch fresh permissions mid-request (e.g., after a seller is suspended mid-session)? This is a freshness vs latency tradeoff — see [Open Questions](#open-questions).

---

## User Document Fields That Drive Derived Permissions

These fields live in `auth-service`'s user collection and are the authoritative source for derived state:

| Field | Type | Drives |
|-------|------|--------|
| `identityLabels` | `string[]` | Assignable permissions (e.g. `['identity:admin']`) |
| `sellerType` | `'individual' \| 'wholesale' \| null` | `seller:individual` or `seller:wholesale` |
| `isSellerActive` | `boolean` | Whether seller permissions are currently active |
| `featureFlags` | `string[]` | Feature permission names (without `feature:` prefix) |
| `isBanned` | `boolean` | Blocks all permissions if true |

---

## First Admin Bootstrap

The first `identity:admin` user cannot be created through the normal API (that would be a privilege escalation hole). It is seeded at deploy time via a one-off script:

```ts
// scripts/seed-admin.ts (run once per environment)
await db.collection('users').updateOne(
  { email: process.env.SEED_ADMIN_EMAIL },
  { $addToSet: { identityLabels: 'identity:admin' } }
);
```

This script is idempotent and must be re-runnable. It is gated by an env var, not exposed via any API.

---

## Open Questions

These must be resolved before Doc #18 can be marked complete and implementation begins.

| # | Question | Current assumption | Blocker |
|---|----------|--------------------|---------|
| P-1 | Where are rollout rules for feature flags stored — `auth-service` user document (explicit grants only), or a separate rollout config in `admin-service`? | `auth-service` stores explicit grants; `admin-service` stores % rollout rules that are evaluated at login time | Affects how `featureFlags` array is populated |
| P-2 | Derived permission freshness: computed at login and cached in session, or re-computed per request? | Cached at login time (in `X-User-Context` JWT), refreshed on session renewal | A suspended seller may have `seller:individual` for up to 7 days (session TTL) unless session is invalidated |
| P-3 | How does seller suspension propagate immediately? | Suspension sets `isSellerActive = false` AND revokes all `better-auth` sessions for that user, forcing re-login | Requires better-auth session revocation API call from admin-service |
| P-4 | Full capability list across all services (one permission per protected action) | Partial list above — needs to be exhaustive | Must enumerate when writing API surface doc (#7) |
| P-5 | Is there a `resource:own` pattern (e.g., `listing:remove:own` vs `listing:remove:any`)? | No — ownership is checked in handler logic (`listing.sellerId === req.user.userId`), not permission system | Keep permission system flat |

---

## Related Documents

- [Architecture Index](../index.md) — system overview
- [Event System](../events/index.md) — permissions changes emit events via the outbox
