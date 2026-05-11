# Event System — Transactional Outbox & MongoDB Event Bus

**Status:** 🔵 In progress — design phase  
**Last Updated:** 2026-05-11

---

## Overview

The event system has two goals that reinforce each other:

1. **Reliability** — state changes must not silently lose their side effects if a service crashes between a DB write and notifying other services.
2. **Observability** — every meaningful action produces a permanent, queryable record usable for audit trails, analytics, activity feeds, and debugging.

These goals are met by three layers:

```
Service business logic
        │
        │  one MongoDB transaction
        ▼
┌──────────────────────────────────────────┐
│  Primary collection write                │  e.g., listing document created
│  + Outbox collection write               │  event document: { eventType, payload, status: 'pending' }
└──────────────────────────────────────────┘
        │
        │  Outbox Relay (per-service, watches via Change Streams)
        ▼
  domain_events collection  ──────────────────────────┐
        │                                             │
        │  Each consumer service watches via          │
        │  Change Streams + tracks own offset         │
        ▼                                             ▼
Notification-service                      Audit-consumer
Chat-service                              (writes to audit_logs)
Admin-service
```

**Transport layer is MongoDB only.** No Redis required for the event bus. Redis is deferred until a concrete forcing function arises (e.g. Socket.IO horizontal scaling). The event store is hidden behind an `IEventStore` interface so the transport can be swapped — see [Database Portability](#database-portability).

---

## Layer 1 — Transactional Outbox

### The Problem

Without an outbox:
1. Service writes to its primary collection
2. Service tries to notify other services

If the service crashes at step 2, the DB change happened but downstream services never know. Notifications, audit logs, and analytics break silently.

### The Solution

Every state-changing operation writes to **two collections in the same MongoDB session transaction**:

1. The primary collection (e.g., `listings`, `interests`, `packages`)
2. An `outbox` collection in the same service database

Both writes succeed or both roll back. The event document is created if and only if the DB change committed.

### Outbox Document Schema

```ts
interface OutboxDocument {
  _id: ObjectId;
  eventId: string;           // UUID v4 — globally unique, used for dedup
  eventType: string;         // e.g., 'listing.submitted'
  aggregateType: string;     // e.g., 'listing'
  aggregateId: string;       // the primary document's _id
  payload: Record<string, unknown>;  // non-PII subset of the state change
  status: 'pending' | 'processed' | 'failed';
  retryCount: number;
  createdAt: Date;
  processedAt?: Date;
  lastError?: string;
}
```

MongoDB indexes on `outbox`:
- `{ status: 1, createdAt: 1 }` — relay polling / Change Stream filter
- TTL index on `processedAt` (30-day expiry) — auto-clean processed documents

### Write Pattern (per service)

```ts
// listing-service example
async function createListing(data: CreateListingDto, session: ClientSession) {
  const listing = await Listing.create([data], { session });

  await Outbox.create([{
    eventId: uuid(),
    eventType: 'listing.submitted',
    aggregateType: 'listing',
    aggregateId: listing[0]._id.toString(),
    payload: {
      listingId: listing[0]._id,
      sellerId: data.sellerId,
      categoryId: data.categoryId,
      title: data.title,
      price: data.price,
      // never include: phone, email, aadhaar, chat content
    },
    status: 'pending',
    retryCount: 0,
    createdAt: new Date(),
  }], { session });
}

// Always called within a transaction:
const session = await mongoose.startSession();
await session.withTransaction(() => createListing(data, session));
```

---

## Layer 2 — Outbox Relay

A lightweight process running alongside each service. Its only job: read `pending` outbox documents and write them to the shared `domain_events` collection.

### Relay Behavior

```
Watch outbox collection via Change Streams (insert events):
  1. On new { status: 'pending' } document:
     a. Write to domain_events collection
     b. On success: update outbox doc { status: 'processed', processedAt: now }
     c. On failure: increment retryCount; if retryCount >= 5, set status: 'failed'

Fallback polling (if Change Stream connection drops):
  Every 2s: find({ status: 'pending' }) sorted by createdAt ASC, limit 50
```

Change Streams require a replica set — already required for transactions (Atlas M10+). Polling is the fallback only.

### One Relay Per Service

Each service runs its own relay against its own `outbox` collection in its own logical database. Not shared across services — sharing would couple them.

---

## Layer 3 — MongoDB Event Bus

### `domain_events` Collection

All relays write into a single shared `domain_events` collection (in a dedicated `onetap_events` database). This is the event bus.

```ts
interface DomainEvent {
  _id: ObjectId;
  eventId: string;           // UUID v4 — matches outbox document eventId
  eventType: string;         // e.g., 'listing.submitted'
  aggregateType: string;     // e.g., 'listing'
  aggregateId: string;       // primary document _id
  correlationId: string;     // from gateway X-Request-Id — traces the full request chain
  causationId?: string;      // eventId of the event that caused this one
  issuedAt: string;          // ISO 8601
  issuedBy: string;          // userId or 'system'
  payload: Record<string, unknown>;
}
```

MongoDB indexes on `domain_events`:
- `{ eventType: 1, _id: 1 }` — consumer filtering by type
- `{ aggregateType: 1, aggregateId: 1 }` — fetch all events for a given entity
- Unique index on `eventId` — prevents duplicate writes if relay retries
- TTL index on `issuedAt` (7-day expiry) — events older than 7 days are removed

### Event Naming Convention

```
{aggregateType}.{verb}

Examples:
  listing.submitted
  listing.approved
  user.registered
  payment.success
  kyc.seller_approved
```

Lowercase, dot-separated, past-tense verb.

### Consumer Offset Tracking

Each subscribing service maintains its own read position in a `consumer_offsets` collection in its own database. This is equivalent to a Redis Streams consumer group — each service has independent progress.

```ts
interface ConsumerOffset {
  consumerId: string;        // service name, e.g., 'notification-service'
  lastEventId: ObjectId;     // _id of the last domain_event successfully processed
  updatedAt: Date;
}
```

On startup, a consumer reads its `lastEventId`, then watches `domain_events` via Change Streams starting from that position. On restart it resumes exactly where it left off.

### Idempotency Requirement

All consumers must be idempotent on `eventId`. Change Streams guarantee at-least-once delivery. A consumer that processes the same `eventId` twice must produce the same result.

Pattern: unique index on `eventId` in the consumer's target collection, or an explicit `processed_events` dedup set.

---

## Database Portability

The event store is hidden behind an `IEventStore` interface. All relay and consumer code calls this interface — never MongoDB APIs directly. This is what makes swapping to PostgreSQL (or any other DB) a single-file change.

```ts
// @onetap/shared/events/IEventStore.ts

export interface IEventStore {
  // Producer side (called inside the business transaction)
  appendToOutbox(event: OutboxEventInput, txn: unknown): Promise<void>;

  // Relay side
  pollPendingOutbox(limit: number): Promise<OutboxDocument[]>;
  watchOutbox(handler: (event: OutboxDocument) => Promise<void>): Promise<void>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, error: string): Promise<void>;

  // Event bus side
  publishDomainEvent(event: DomainEvent): Promise<void>;
  getConsumerOffset(consumerId: string): Promise<string | null>;
  setConsumerOffset(consumerId: string, lastEventId: string): Promise<void>;
  watchDomainEvents(
    consumerId: string,
    eventTypes: string[],
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void>;
}
```

Current implementation: `MongoEventStore` — uses MongoDB collections and Change Streams.

**If PostgreSQL is needed later:**
- Write `PostgresEventStore` implementing the same interface
- `appendToOutbox` uses a `pg` transaction (`BEGIN / COMMIT` on the same client)
- `watchOutbox` uses `LISTEN / NOTIFY` or WAL-based CDC (`pg_logical`)
- `domain_events` becomes a table with a `jsonb payload` column
- `consumer_offsets` becomes a table with a sequence ID column
- Swap the constructor in each service's bootstrap file — zero business logic changes

| Concern | `MongoEventStore` | `PostgresEventStore` |
|---------|------------------|---------------------|
| Transaction handle | `ClientSession` | `pg.PoolClient` |
| Outbox push | Change Streams `watch()` | `LISTEN / NOTIFY` |
| Offset tracking | `_id: ObjectId` cursor | sequence integer cursor |
| Payload storage | BSON document | `jsonb` column |
| Dedup index | Unique index on `eventId` | `UNIQUE` constraint on `event_id` |

---

## Event Catalog

Every meaningful state change emits a typed event. Expand this catalog as new features are designed.

### Auth Events (`auth-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `user.registered` | New user sign-up complete | `userId`, `registrationMethod` |
| `user.phone_verified` | Phone OTP verified | `userId` |
| `user.location_updated` | Location captured or updated | `userId`, `city`, `state`, `coordinates` |
| `user.logged_in` | Successful login | `userId`, `method` |
| `user.logged_out` | Session ended | `userId` |
| `user.password_reset` | Password reset completed | `userId` |
| `user.banned` | Admin bans a user | `userId`, `reason`, `adminId` |

### KYC Events (`kyc-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `kyc.aadhaar_verified` | Aadhaar OTP verified | `userId`, `kycRefId` *(no Aadhaar number)* |
| `kyc.seller_applied` | User submits seller application | `userId`, `sellerType` |
| `kyc.seller_approved` | Admin approves seller | `userId`, `sellerType`, `adminId` |
| `kyc.seller_rejected` | Admin rejects seller | `userId`, `sellerType`, `reason`, `adminId` |

### Listing Events (`listing-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `listing.submitted` | Seller creates a listing | `listingId`, `sellerId`, `categoryId`, `title`, `price` |
| `listing.approved` | Admin approves listing | `listingId`, `adminId` |
| `listing.rejected` | Admin rejects listing | `listingId`, `reason`, `adminId` |
| `listing.sold` | Seller marks listing sold | `listingId`, `sellerId`, `buyerId` |
| `listing.removed` | Seller manually removes Live listing | `listingId`, `sellerId` |
| `listing.delisted` | 24h delist cron fires after sold | `listingId` |
| `listing.expired` | 30-day expiry cron fires | `listingId` |

### Buying Events (`listing-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `interest.created` | Buyer expresses interest | `interestId`, `listingId`, `buyerId`, `sellerId` |
| `transaction.completed` | Seller marks Sell to this Buyer | `transactionId`, `listingId`, `buyerId`, `sellerId` |

### Package & Payment Events

| Event Type | Service | Trigger | Key Payload Fields |
|------------|---------|---------|-------------------|
| `package.purchased` | `payment-service` | Payment webhook confirmed | `userId`, `packageId`, `slotCount`, `gatewayPaymentId` |
| `package.activated` | `listing-service` | Slot quota updated after purchase | `userId`, `packageId`, `slotsAdded` |
| `package.expired` | `listing-service` | Package expiry cron | `userId`, `packageId` |
| `payment.initiated` | `payment-service` | Order created | `orderId`, `userId`, `amount` |
| `payment.success` | `payment-service` | Webhook `payment.captured` received | `gatewayPaymentId`, `userId`, `amount` |
| `payment.failed` | `payment-service` | Webhook `payment.failed` received | `gatewayPaymentId`, `userId`, `failureReason` |
| `payment.refunded` | `payment-service` | Admin initiates refund | `gatewayPaymentId`, `userId`, `adminId` |

### Chat Events (`chat-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `chat.created` | New chat room opened for a listing | `chatId`, `listingId`, `buyerId`, `sellerId` |
| `message.sent` | Message sent *(high volume — audit-logged at summary level only)* | `chatId`, `senderId` *(no message body)* |

### Admin Events (`admin-service`)

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `admin.listing_reviewed` | Admin approves or rejects listing | `listingId`, `action`, `adminId` |
| `admin.seller_reviewed` | Admin approves or rejects seller | `userId`, `action`, `adminId` |

---

## Audit Log

### Two Logging Layers

| Layer | Audience | Storage | Retention | Scope |
|-------|----------|---------|-----------|-------|
| **Operational logs** (Winston → stdout) | Engineers / DevOps | CloudWatch / Datadog | 30–90 days | All events, errors, latency. Never PII. |
| **Audit log** (`audit_logs` collection) | Admins · users · compliance | MongoDB | 7 years minimum (Aadhaar Act) | User-facing actions, state changes, admin decisions |

The audit log is a **projection of the event stream**. A dedicated `audit-consumer` (owned by `admin-service`) watches `domain_events` and writes structured records. Originating services are never responsible for writing audit entries.

### Audit Log Document Schema

```ts
interface AuditLogDocument {
  _id: ObjectId;
  eventId: string;           // dedup key — matches domain_events eventId
  eventType: string;
  actorId: string;           // userId or 'system'
  actorType: 'user' | 'admin' | 'system';
  targetType: string;        // e.g., 'listing', 'user'
  targetId: string;
  description: string;       // human-readable, templated
  metadata: Record<string, unknown>;  // non-PII subset of event payload
  ipHash?: string;           // SHA-256 of IP — never raw IP
  deviceId?: string;
  createdAt: Date;
  // NO updatedAt — append-only
}
```

MongoDB indexes on `audit_logs`:
- `{ actorId: 1, createdAt: -1 }`
- `{ targetType: 1, targetId: 1, createdAt: -1 }`
- `{ eventType: 1, createdAt: -1 }`
- Unique on `eventId`

### PII Rules

PII is **never** written to `audit_logs`: no phone, email, Aadhaar fragments, payment details, or chat message bodies. IP addresses are SHA-256 hashed. `message.sent` events are not audit-logged at message level — only `chat.created` is logged.

### Admin Actions — Extended Audit

Admin actions additionally write to `admin_actions` in `admin-service` with before/after snapshots:

```ts
interface AdminActionDocument {
  _id: ObjectId;
  eventId: string;
  action: string;
  adminId: string;
  targetType: string;
  targetId: string;
  reason?: string;           // required for rejections
  stateBefore: Record<string, unknown>;
  stateAfter: Record<string, unknown>;
  createdAt: Date;
}
```

Audit log and admin actions are both append-only — **no updates, no deletes, ever.** DPDP Act "delete my data" requests anonymize fields (`[DELETED:{hash}]`), they do not remove rows.

---

## Data Retention

| Collection | Retention | Mechanism |
|------------|-----------|-----------|
| `outbox` (processed) | 30 days | TTL index on `processedAt` |
| `outbox` (failed) | Until manually resolved | Ops script after alert |
| `domain_events` | 7 days | TTL index on `issuedAt` |
| `audit_logs` | 7 years | Manual archival to cold storage after year 1 |
| `admin_actions` | 7 years | Same archival policy |

---

## Open Questions

| # | Question | Current assumption |
|---|----------|--------------------|
| E-1 | Change Stream reconnection strategy if Atlas connection drops? | Exponential backoff + fall back to polling; resume from last saved offset |
| E-2 | `domain_events` TTL of 7 days — is that enough for slow consumers to catch up? | Yes for known services; increase to 30 days if analytics consumers are added |
| E-3 | Dead letter handling for `status: 'failed'` outbox docs? | Sentry alert when `retryCount >= 5`; ops resolves manually |
| E-4 | DPDP anonymization approach for 7-year audit log — legal sign-off needed? | Replace identifying fields with `[DELETED:{hash}]`, null out metadata |
| E-5 | `causationId` — required on all events or optional? | Optional — set only when one event directly causes another |

---

## Related Documents

- [Architecture Index](../index.md) — system overview
- [Permissions System](../permissions/index.md) — permission changes (`kyc.seller_approved`, `user.banned`) travel through this event system
