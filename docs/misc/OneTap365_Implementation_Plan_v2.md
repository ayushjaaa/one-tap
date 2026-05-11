# OneTap365 Consumer App — Implementation Plan v2

**Project ID:** Pr-2026-00012
**Document Owner:** Project Manager
**Last Updated:** 2026-05-08
**Supersedes:** OneTap365_Consumer_App_Plan_v1.md (where contradictions exist, this v2 wins)
**Source of Truth for Flow:** Customer User Flow document (v2026-05-08, sent by client)

This document is the single source of truth for what we are building, who builds what, in what order, and what edge cases each feature must handle before it goes to production. Read it before writing any code.

---

## 0. Reading Guide

| If you are… | Read these sections |
|-------------|---------------------|
| Project Manager | All |
| Backend Lead | 1, 2, 3, 4, 5, 7, 8, 9, 12 |
| Backend Developer | 1, 2, 4, 5, 7, 8, 9 (your service) |
| Mobile Lead | 1, 2, 3, 6, 7, 9, 10 |
| Mobile Developer | 1, 2, 3, 6, 7, 9, 10 |
| Designer | 1, 2, 3 |
| QA | 1, 3, 7, 9, 11 |
| DevOps | 1, 4, 8, 9, 12 |

**Conventions used:**
- `[BUILT]` = code already exists, may need adjustment
- `[NEW]` = needs to be built from scratch
- `[CHANGE]` = exists but must be modified to match v2 flow
- `[KILL]` = code that exists but contradicts v2 — must be removed

---

## 1. What We Are Building (Phase 1)

A location-based, marketplace mobile app where:

1. Users sign up via **manual email+password** or **Google**, then verify a **phone OTP**, then **grant location** (mandatory, no skip).
2. Users browse products listed by sellers within **30 km** of their current location, sorted nearest-first.
3. To sell, a user becomes a **Verified Seller** by completing **Aadhaar OTP verification** (UIDAI via KYC vendor) — split into **Wholesale Seller** (with GST + business docs + 24–48h admin verify) or **Individual Seller** (instant).
4. Verified sellers buy a **Posting Package** (admin-controlled). Packages give a fixed number of **concurrent slots** (Pending + Live combined), not lifetime credits.
5. Each listing goes through **admin approval**. Listings are **immutable** — no edits in any state. Rejected listings cannot be resubmitted.
6. Buyers tap **"Buy Product"** to express interest. The seller sees an interested-buyers list, talks via **Socket.IO chat** or **direct phone call** (no masking in v1), then taps **"Sell to this Buyer"**. Listing flips to Sold; remains visible in history sections for 24h, then delists fully.
7. Payment is **Cash on Delivery only** — platform takes no cut, holds no money. Revenue is from packages.

**Out of Phase 1 (CONFIRMED 2026-05-08):**
- **Book a Service** — deferred to Phase 2
- **Property Bidding** — deferred to Phase 2 (regulatory: SEBI/CIS license needed)
- **SIP Investment** — deferred to Phase 2 (regulatory: SEBI/AMFI license needed)
- **Vendor App** — separate project
- **Admin Panel UI** — only admin REST APIs needed in Phase 1

> **Hard rule for devs:** Do NOT touch `microservices/investment-service/` or `microservices/booking-service/`. These folders stay in the repo for Phase 2 but are disabled in `gateway` and `docker-compose.yml`. Any PR that adds code to these paths is auto-rejected. The 4 Home cards (Buy / Service / Bid / SIP) are visible in the UI for layout consistency, but Service / Bid / SIP route to a "Coming in Phase 2" placeholder screen.

**Scale targets:**
- 7,000 monthly active users (month 1)
- 1,000 concurrent users at peak
- **Launch geography: India (pan-India from day 1)** — confirmed 2026-05-08
- Geo radius 30 km per user (listings shown within 30 km of user's GPS)
- Currency: INR only
- Timezone: IST (UTC+5:30) for all user-facing times; UTC in DB

**Implications of pan-India launch (vs single-city):**
- All SMS templates must support PAN-India DLT registration (no state-specific templates)
- Aadhaar verification covers all states; no special-case tax IDs (we already use Aadhaar, not state docs)
- **Hindi mandatory at launch** (CONFIRMED 2026-05-08). RN `i18n.ts` scaffold already in place. Every user-facing string must have an `en.json` + `hi.json` entry. DLT SMS templates must be registered separately for English and Hindi (each TRAI template ID is single-language). Push notification templates must also be bilingual. QA must test full happy path in both languages.
- Time-of-day analytics must bucket by IST, not user's local time
- Map / location-permission copy uses generic India phrasing, not city-specific
- Customer support hours: 9am–9pm IST (covers all of India)
- Razorpay/MSG91/KYC vendors all already pan-India; no changes needed
- Marketing handoff: client owns regional marketing; product is geography-agnostic

---

## 2. Critical Spec Reconciliation (v1 → v2)

The new user flow changes 19 things from v1. **Every team member must read this table once before starting any task.**

| # | Topic | Old Plan (v1) | New Flow (v2) | Action |
|---|-------|---------------|---------------|--------|
| 1 | OTP length | 6 digits | **6 digits** ✅ | RN currently has 4 → **change to 6 (Mobile)** |
| 2 | OTP attempts | 5 / 30-min lockout | **3 per 2-min window, ~6 min total fails → 24h block on phone** | Backend logic + RN copy update |
| 3 | Login flow | OTP-only OR Google | **Email+pwd OR Google → ALWAYS phone OTP** | Login is always 2-step |
| 4 | Password rules | 8+ chars | **8+ chars, 1 capital, 1 digit (1–9), 1 special char** | Tighten validation BE + RN |
| 5 | Listing edits | Some edits allowed | **NO edits in any state (Pending / Live / Rejected)** | Drop edit endpoint |
| 6 | Rejected listings | Edit + resubmit | **Permanent record. Cannot resubmit. Must create NEW listing = costs another slot** | UX + BE rules |
| 7 | Slot freeing | Refund credit | **Slot freed (not refunded as credit/money) when: rejected by admin OR sold OR seller manually removes**. Pending NOT freeable until admin acts | Rewrite slot accounting |
| 8 | Quota model | Lifetime credits used | **Concurrent slots: Pending + Live combined**, capped at package count | Rewrite `PostCredits` model |
| 9 | Seller types | Single role | **Wholesale (GST + docs + 24–48h verify) vs Individual (instant)** | Two onboarding flows |
| 10 | Order entity | `Order` with status | **No Order entity.** Buyer "Buy" tap = `Interest`. Seller "Sell to" = `Transaction`. Listing flips to Sold. | Drop Order model. Add Interest + Transaction |
| 11 | Call masking | Exotel | **Direct phone (real number revealed)** | Drop Exotel from scope/budget |
| 12 | Search radius | Configurable | **Hard-coded 30 km, sorted nearest first** | `$nearSphere` with maxDistance |
| 13 | Filters | Many | **Category + Price Range only** | Simpler filter UI |
| 14 | Notify other buyers | Optional | **Mandatory push when listing sold** | Notification template required |
| 15 | Sold delist timing | Removed | **24-hour grace window in history sections, then full delist** | Cron job + status field |
| 16 | Forgot password | Not in flow | **CONFIRMED IN v1 SCOPE (client decision 2026-05-08)** — RN screens already built, backend to be added | Keep all 3 RN screens; backend implements `/auth/forgot-password/request-otp` + `/auth/forgot-password/verify-otp` + `/auth/forgot-password/reset` |
| 17 | Better Auth | v1 said JWT+refresh | **Better Auth (sessions) already built** | Keep Better Auth. Drop refresh-token spec |
| 18 | Investment / Booking services | Folder exists | **Out of Phase 1** | **Disable in gateway. Keep code for Phase 2.** |
| 19 | Aadhaar OTP retry | Vague | **Mirror login OTP rules: 3/2min, ~6min → 24h** | Same logic as login OTP |

**Action to Backend Lead by EOD today:** confirm decisions on rows 16, 18 in writing before sprint planning.

---

## 3. Final Feature List (Phase 1)

### 3.1 Onboarding & Auth
- F1.1 Splash with token check
- F1.2 Welcome (Login / Register)
- F1.3 Manual register (Name → Email → Password) with strong password rules
- F1.4 Google register
- F1.5 Manual login (email + password)
- F1.6 Google login
- F1.7 Phone OTP entry + 6-digit OTP + 2-min window + 3 attempts + 24h block
- F1.8 Location capture (mandatory, no skip)
- F1.9 Final backend "complete account" call
- F1.10 Forgot password — CONFIRMED IN SCOPE (3 screens already built in RN; backend to be added)
   - F1.10.1 Phone entry (registered phone) → triggers OTP via DLT template
   - F1.10.2 OTP verify (same 6-digit / 2-min / 3-attempt / 24h-block rules as login OTP per §7.1)
   - F1.10.3 Reset password (new password, must satisfy F1.3 strength rules; old password invalidated; all existing sessions for that user revoked)

### 3.2 Home & Discovery
- F2.1 Home with 4 main options (Buy Product, Book Service, Bid Property, SIP) + Become a Seller banner
   - **NOTE:** Phase 1 ships only **Buy Product** working. Other 3 are visible but route to a "Coming Soon" screen (do not hide — UI consistency for client).
- F2.2 Product feed within 30km, nearest-first
- F2.3 Filters: Category (3-level nested) + Price Range
- F2.4 Product detail screen (carousel, status tag, seller link, Buy button)

### 3.3 Buying
- F3.1 Buy Product (Express Interest) — atomic, idempotent
- F3.2 Real-time chat with seller (Socket.IO)
- F3.3 Direct phone call (deep-link to dialer with seller's real number)
- F3.4 Buyer's purchase history
- F3.5 Push: "Seller chose another buyer for this product"

### 3.4 Become a Seller
- F4.1 Become Seller info screen
- F4.2 Aadhaar number entry (12 digits with formatting + privacy note)
- F4.3 Aadhaar OTP entry (6-digit, same rules as login OTP)
- F4.4 Seller type selection (Wholesale / Individual)
- F4.5 Wholesale onboarding (GST + business name + address + type + categories + docs upload) → 24-48h admin queue
- F4.6 Individual onboarding (display name + bio + photo) → instant activation
- F4.7 Verified Seller badge

### 3.5 Selling
- F5.1 Package list screen (admin-controlled, dynamic fetch)
- F5.2 Package purchase via Razorpay
- F5.3 List a Product form (Name + Desc + Images + Location + Price + 3-level Category)
- F5.4 Slot quota enforcement (Pending + Live ≤ package count)
- F5.5 Pending → Admin Approval → Live | Rejected
- F5.6 My Listings (Pending tab, Live tab, Rejected tab, Sold tab)
- F5.7 Manually remove a Live listing (frees slot)
- F5.8 Interested Buyers list per listing
- F5.9 Sell to this Buyer flow → listing → Sold + 24h history window + auto-delist
- F5.10 Seller's sales history
- F5.11 Push: listing approved / rejected

### 3.6 Cross-cutting
- F6.1 Push notifications (FCM)
- F6.2 SMS via DLT-registered templates (MSG91 or Twilio)
- F6.3 Image upload pipeline (S3/Cloudinary + CDN, multi-resolution, EXIF strip, NSFW async)
- F6.4 Admin APIs (seller approve/reject for wholesale, listing approve/reject)
- F6.5 In-app notification center (optional v1, recommended)

---

## 4. Microservice Architecture

### 4.1 Final Service Map

We're keeping microservices as decided. Below is the **final service set for Phase 1**, with renames/restructures from the existing scaffold.

| Service | Port | Status | Owns |
|---------|------|--------|------|
| `gateway` | 3000 | [BUILT] | Routing, rate limit, request ID, CORS, auth header forwarding |
| `auth-service` | 3001 | [CHANGE] | Better Auth (email+pwd, Google), OTP issuance/verify, sessions, profile, location |
| `kyc-service` | 3002 | [NEW] | Aadhaar verification via KYC vendor, seller verification state machine, wholesale doc upload + admin queue |
| `listing-service` | 3003 | [CHANGE rename from `marketplace-service`] | Categories, packages catalog, listings, slot accounting, search/feed (geo + filter), interest tracking, transactions |
| `payment-service` | 3004 | [NEW] | Razorpay order creation, webhook handler, idempotency, package activation |
| `chat-service` | 3005 | [CHANGE] | Socket.IO + Redis adapter, message persistence, presence |
| `notification-service` | 3006 | [NEW] | FCM push, SMS via MSG91, email via SES, template management |
| `media-service` | 3007 | [NEW] | Image upload presigned URLs, processing pipeline, NSFW check, EXIF strip |
| `admin-service` | 3008 | [NEW] | Admin endpoints (approve/reject seller, approve/reject listing, package CRUD, category CRUD, audit log) |

**[KILL]** `booking-service`, `investment-service`, `wallet-service` — disabled in `gateway` and `docker-compose.yml`. Keep folders but exclude from `dev:all` script and gateway service map. Wallet logic (post-credits / slots) moves into `listing-service` — kill the wallet-service folder, since v2 is COD-only with no wallet, and "post credits" is conceptually a property of the listing slot ledger, not money.

### 4.2 Cross-Service Communication

- **Sync (REST):** between gateway → service. Service-to-service must be limited.
- **Async (Redis Streams):** for fan-out events. Use Redis Streams (not Kafka — overkill for 7K MAU). Topics:
   - `user.registered`, `user.location.updated`
   - `listing.submitted`, `listing.approved`, `listing.rejected`, `listing.sold`
   - `interest.created`
   - `payment.success`, `package.activated`
   - `kyc.verified`, `seller.approved`
- Each service consumes only what it needs. `notification-service` consumes most events to fire push/SMS.

### 4.3 Database Strategy

**Decision: shared MongoDB, separate logical databases per service** (not separate clusters). Rationale: 7K MAU doesn't justify 8 separate Atlas clusters at ~$60/mo each. Migrate when needed.

- `onetap_auth`, `onetap_kyc`, `onetap_listings`, `onetap_payments`, `onetap_chat`, `onetap_notifications`, `onetap_media`, `onetap_admin`
- **No cross-database joins.** Use Redis Streams events to denormalize when needed.
- One shared **Redis** instance (ElastiCache or Upstash) for: sessions, rate-limit counters, search cache, Socket.IO adapter, Bull queues, Streams.

### 4.4 Service Boundary Rules (Junior Devs Read)

1. A service NEVER reads from another service's database. Use the service's REST API or consume an event.
2. A service NEVER calls more than 1 other service synchronously per request. If you find yourself doing 2+, you have the wrong boundary.
3. All services share `@onetap/shared` for: logger, error class, response wrapper, Mongo connection helper, auth middleware (Better Auth bearer validation).
4. Every service exposes `/health` returning `{ status, timestamp, dbConnected, dependencies }`.
5. Every service uses structured JSON logs. NEVER log: phone, email, Aadhaar, password, OTP, payment payload, chat content. Redact at logger level via a global `redact()` filter.

---

## 5. Data Model (Final, Per Service)

### 5.1 `auth-service` — `onetap_auth`

**`users`** ([CHANGE] from existing)
```
_id, name, email (unique), passwordHash (Better Auth managed),
phone (unique sparse, stored ONLY after OTP verified),
phoneVerifiedAt, googleId (unique sparse), profilePhotoUrl,
location: { address, city, state, pincode, geo: GeoJSON Point [lng, lat] },
role: 'user' (default), 'admin',
sellerType: null | 'individual' | 'wholesale',
isAadhaarVerified: bool, isSellerActive: bool,
deviceTokens: [{ token, platform, lastSeen, deviceId }],
interests: [categoryId],
createdAt, updatedAt, deletedAt (soft delete)
```

**`sessions`** (managed by Better Auth) — sliding 7-day, server-side.

**`otp_requests`** [NEW]
```
_id, phone (indexed), otpHash, expiresAt, attemptCount,
windowStartedAt, status: 'active' | 'consumed' | 'expired',
purpose: 'login' | 'register' | 'aadhaar' | 'forgot_password',
ipHash, deviceFingerprint, createdAt
```

**`otp_blocks`** [NEW]
```
_id, phone (unique), blockedAt, blockedUntil (indexed), reason,
failureWindows: number, createdAt
```

### 5.2 `kyc-service` — `onetap_kyc`

**`seller_verifications`** [NEW]
```
_id, userId (unique, indexed), aadhaarLast4 (string, NEVER full number),
kycVendor: 'karza' | 'signzy', kycRefId (vendor's transaction id),
verifiedAt, sellerType: 'individual' | 'wholesale',

individualSetup: { displayName, bio, profilePhotoUrl },

wholesaleSetup: {
  businessName, gstNumber, gstVerifiedAt, gstVendorRefId,
  businessAddress, businessType, categories: [categoryId],
  documentUrls: [{ type, url, uploadedAt }]
},

adminReview: {
  status: 'not_required' (individual) | 'pending' | 'approved' | 'rejected',
  reviewedBy, reviewedAt, rejectionReason
},
isActive: bool, createdAt, updatedAt
```

**Aadhaar handling rules (compliance critical):**
- The full Aadhaar number is NEVER stored. Only `aadhaarLast4` and the vendor's `kycRefId`.
- Aadhaar is sent to vendor via TLS, never persisted in our logs/DB/queue.
- Logger has a redaction list: `aadhaar`, `aadhaarNumber`, `otp`, `pin`, `password`, `cvv`.
- All Aadhaar API calls are over TLS 1.2+, vendor allowlist of IPs.
- 7-year retention of `kycRefId` per Aadhaar Act, even on user account delete.

### 5.3 `listing-service` — `onetap_listings`

**`categories`** [CHANGE existing]
```
_id, name, slug (unique), parentId (nullable),
level: 0 | 1 | 2, path: [topId, subId, leafId],
iconUrl, sortOrder, isActive, createdAt, updatedAt
```
- Hard rule: max level = 2 (3 levels total: 0 → 1 → 2)
- Admin endpoint to add/remove. App fetches full tree on app start, caches in MMKV with version number.

**`packages_catalog`** [NEW]
```
_id, name, postSlots, priceInPaise, validityDays,
benefits: [string],
isActive, sortOrder, createdAt, updatedAt
```
- Admin-controlled. All UI reads from this. No hardcoded packages anywhere.

**`user_packages`** [CHANGE — replaces `post_credits` from ER]
```
_id, userId (indexed), packageId, postSlots, validUntil,
purchasedAt, paymentRefId, isActive,
createdAt, updatedAt
```
- A user can have multiple active packages. Effective slots = sum of all active+unexpired packages.

**`listings`** [CHANGE existing]
```
_id, sellerId (indexed),
categoryId, categoryPath: [topId, subId, leafId],
title, description, images: [{ url, order, thumbnailUrl, originalUrl }],
priceInPaise, condition,
attributes: { brand?, model?, year?, ... },
location: { city, geo: GeoJSON Point },

status: 'pending' | 'live' | 'rejected' | 'reserved' | 'sold' | 'removed',
adminReview: { reviewedBy, reviewedAt, rejectionReason },

reservation: { buyerId, reservedAt, expiresAt } | null,

soldTo: userId, soldAt, transactionId,
delistedAt, // 24h after soldAt; cron sets this

stats: { views, interestCount },
createdAt, updatedAt
```
- 2dsphere index on `location.geo`
- Compound index on `(status, location.geo)` for feed
- Compound index on `(sellerId, status)` for My Listings
- Index on `(soldAt)` for delisting cron

**`interests`** [NEW]
```
_id, listingId (indexed), buyerId (indexed),
idempotencyKey (unique with listingId+buyerId), createdAt
```
- Unique compound index `(listingId, buyerId)` so the same buyer cannot interest twice
- `idempotencyKey` prevents network-retry double-fires

**`transactions`** [NEW — replaces Order]
```
_id, listingId (unique), sellerId, buyerId, priceInPaise,
soldAt, paymentMethod: 'cod', completedAt,
sellerRating, buyerRating, sellerReview, buyerReview,
createdAt, updatedAt
```

### 5.4 `payment-service` — `onetap_payments`

**`payment_orders`** [NEW]
```
_id, userId (indexed), purpose: 'package_purchase',
referenceId: packageId, amountInPaise, currency: 'INR',
gateway: 'razorpay', gatewayOrderId (unique),
gatewayPaymentId, status: 'created' | 'success' | 'failed' | 'refunded',
idempotencyKey (unique), createdAt, completedAt
```

**`webhook_events`** [NEW]
```
_id, eventId (unique — `x-razorpay-event-id`),
event, payload, signature, receivedAt, processedAt,
status: 'received' | 'processed' | 'failed', errorReason
```

### 5.5 `chat-service` — `onetap_chat`
- `chats`: as ER, plus `listingId` (mandatory — chat is always tied to a listing)
- `messages`: as ER

### 5.6 `notification-service` — `onetap_notifications`
- `notification_log`: every push/SMS sent, with delivery status
- `dlt_templates`: registered template metadata, status, contentTemplate, variables

### 5.7 `admin-service` — `onetap_admin`
- `admin_users`
- `admin_actions`: full audit log, immutable

---

## 6. Mobile App — Screen List

### 6.1 Already Built (with adjustments)

| Screen | Status | Adjustment Needed |
|--------|--------|-------------------|
| Splash | [BUILT] | Add real token-validation API call (currently just hydration check) |
| Onboarding (carousel) | [BUILT] | Confirm content with design |
| Welcome | [BUILT] | OK |
| Login (email + pwd) | [BUILT] | Add forced-OTP-after-login routing |
| Phone | [BUILT] | OK |
| OTP | [CHANGE] | **4 → 6 digits**. **3 attempts / 2-min window / 24h block UI**. Remove `MOCK_OTP = 1234` once backend ships |
| ForgotPassword (3 screens) | [BUILT] | In scope. Wire to real backend endpoints (drop mocks). Apply same OTP rules as login per §7.1. After successful reset, force-logout all other devices. |
| SignUp wizard (Name/Email/Pwd/Location) | [BUILT] | **Tighten password validation per F1.3** |

### 6.2 To Build [NEW]

| Screen | Priority | Sprint |
|--------|----------|--------|
| Home (4 cards + Become Seller banner) | P0 | 2 |
| "Coming Soon" placeholder for Service / Bid / SIP | P0 | 2 |
| Product Feed (30km, nearest-first, infinite scroll) | P0 | 3 |
| Filters bottom-sheet (Category 3-level + Price range) | P0 | 3 |
| Product Detail (carousel + status + seller card + Buy CTA) | P0 | 3 |
| Buyer Chat list | P0 | 4 |
| Chat conversation | P0 | 4 |
| Buy Product confirm + post-buy choices (Chat / Call) | P0 | 3 |
| Buyer Purchase History | P1 | 4 |
| Become a Seller intro | P0 | 2 |
| Aadhaar number entry | P0 | 2 |
| Aadhaar OTP screen | P0 | 2 |
| Seller Type Selection (Wholesale / Individual) | P0 | 3 |
| Wholesale onboarding form + doc upload | P0 | 3 |
| Wholesale pending-review screen | P0 | 3 |
| Individual onboarding form | P0 | 3 |
| Package Selection screen (dynamic from API) | P0 | 3 |
| Razorpay payment screen | P0 | 3 |
| Package Success / Failure screens | P0 | 3 |
| List a Product form (Title + Desc + Images + Category 3-level + Price) | P0 | 3 |
| Image picker (camera + gallery, multi, reorder) | P0 | 3 |
| My Listings (4 tabs: Pending / Live / Rejected / Sold) | P0 | 4 |
| Listing Detail (seller view) with Interested Buyers list | P0 | 4 |
| Sell to this Buyer confirmation modal | P0 | 4 |
| Seller Sales History | P1 | 4 |
| Notification Center (in-app) | P1 | 4 |
| Profile / Settings | P0 | 4 |

### 6.3 Mobile Stack Confirmation

Already chosen and working:
- React Native 0.85, React 19
- Redux Toolkit + RTK Query
- React Navigation v7
- React Native Keychain (token), MMKV (cache)
- React Hook Form + Zod
- React Native Linear Gradient, Lucide icons, Reanimated 4

To add:
- **Image picker:** `react-native-image-picker` + `react-native-image-resizer` for client-side compression
- **Camera:** same
- **Push:** `@react-native-firebase/messaging`
- **OTP autoread (Android):** `react-native-otp-verify` already installed
- **Razorpay:** `react-native-razorpay`
- **Socket.IO client:** `socket.io-client`
- **Maps (optional v1):** skip — listings show city, not pin
- **Crash reporting:** `@sentry/react-native`
- **Analytics:** `@react-native-firebase/analytics` + Mixpanel (later)

---

## 7. Per-Feature Spec — Acceptance Criteria + Edge Cases

> This section is the **production checklist**. Every feature has acceptance criteria, edge cases, and rate limits. All must be tested before shipping.

### 7.1 Phone OTP (Login + Register)

**Acceptance:**
- 6-digit numeric, sent within 5s of request via MSG91 DLT-approved template
- Window = 2 min; 3 attempts in window; on attempt 3 fail → "Wrong OTP. Wait for resend"
- Resend disabled until window expires; on tap → new OTP, fresh window
- After ~6 min of failures (i.e., 2 full failed windows) → 24h block on phone
- iOS: manual entry; Android: auto-read via SMS Retriever (DLT template must include 11-char app hash)
- 30-second cooldown between resend taps regardless of window state

**Edge cases:**
- User changes phone number mid-block → new phone is fresh; same account can have one active phone
- SMS provider down → BE returns `503` with `retryAfter`. RN shows "SMS provider issue, try again in X seconds"
- DLT template not approved → block deploy. CI check that all templates exist in `dlt_templates` collection
- User on 2G/no signal → SMS may take 30s+. Don't auto-fail; let timer run
- DDoS / brute force → see §9.1 rate-limit matrix
- User's phone number in OTP block period attempts to register again → reject with "Too many failed attempts"
- User crashes app between OTP send and verify → on relaunch, RN polls `/auth/otp/status?phone=` to know if a window is still alive
- Same phone number used by multiple Google accounts → reject second account with "Phone already in use"

### 7.2 Aadhaar Verification

**Acceptance:**
- 12-digit Aadhaar with format-as-you-type (XXXX XXXX XXXX)
- Privacy note shown above field
- After submit → vendor (Karza/Signzy) sends OTP to UIDAI-linked phone
- OTP screen mirrors login OTP rules
- Success → user `isAadhaarVerified = true`, proceeds to Seller Type selection
- Same Aadhaar tries to verify on another account → "Aadhaar already in use" — reject

**Edge cases:**
- KYC vendor returns 5xx → retry with exponential backoff up to 3 times. Surface "Verification provider unavailable. Try again later."
- User doesn't have UIDAI-linked phone (rare) → "Update your linked phone with UIDAI first"
- User cancels mid-OTP → OTP request is already burned; new one needed
- Aadhaar number format invalid (Verhoeff checksum) → reject before vendor call
- Timeouts > 30s on vendor API → cancel + retry once
- Logs MUST NOT contain Aadhaar number. Compliance test in CI: grep for `\d{12}` in last 7 days of logs → must return zero

### 7.3 Wholesale Seller Onboarding

**Acceptance:**
- After Aadhaar verify, user picks Wholesale → form requires: businessName, gstNumber (15 chars), businessAddress, businessType, categories (multi-select), 2+ documents
- GST verified via vendor API (Karza GST endpoint) before submission accepted
- On submit → status `admin_pending`, banner "Your application is under review. We'll notify you within 48 hours"
- Admin queue endpoint available
- On approve → push + SMS, `isSellerActive = true`, can buy package
- On reject → push with reason, can re-apply after 24h

**Edge cases:**
- GST number format invalid → reject before vendor call
- GST belongs to another verified wholesale account → reject "GST already registered"
- Document upload fails → keep form data in RN MMKV, retry upload
- File > 5MB → reject
- File not PDF/JPG/PNG → reject
- Admin doesn't act within 48h → escalation push to admin lead (cron job)

### 7.4 Individual Seller Onboarding

**Acceptance:**
- After Aadhaar verify, user picks Individual → form: displayName, bio (optional), profile photo (optional)
- Submit → instant activation, `isSellerActive = true`

**Edge cases:**
- Display name profanity → block via banned-word list (basic v1) + flag for review
- Photo upload fails → allow proceeding without photo, retry from profile

### 7.5 Package Purchase

**Acceptance:**
- Package list fetched from `GET /listings/packages` (admin-controlled)
- User taps package → backend creates Razorpay order with `idempotencyKey`
- RN opens Razorpay SDK → on success, RN sends `{razorpayOrderId, razorpayPaymentId, razorpaySignature}` to BE
- BE verifies signature, calls Razorpay GET `/payments/{id}` to confirm, then activates package
- **Webhook** also fires; BE handler is idempotent on `event_id` (unique index)
- Receipt with GST sent to user's email after success
- User can stack packages (slots add up)

**Edge cases:**
- Network drops between SDK success and BE notify → on app reopen, RN polls `GET /payments/orders/:id` until status is final. Webhook reconciles even if RN never polls
- Webhook fires before RN notifies → race-safe via DB unique index on `gatewayPaymentId`
- Payment success but signature verification fails → mark `failed`, alert ops (potential fraud)
- User tries to buy package while another is in `created` state → reuse the existing order if < 5 min old, else cancel old + create new
- Payment timeout (Razorpay 5xx) → status `created`, surface "Payment status unclear. Check My Packages." Reconcile job runs every 5 min
- Refunds — out of v1; manual via Razorpay dashboard if needed

### 7.6 List a Product

**Acceptance:**
- Form requires: title (5–100), description (20–2000), 1–8 images (each ≤5MB), price (≥₹1), category (must be level-2 leaf)
- Slot check: count of user's listings where `status IN ('pending', 'live', 'reserved')` < total package slots
- On submit → atomic: create listing in `pending` AND increment seller's used-slot counter (or rely on count query — see §9.4)
- Each image: client compresses to 1080px max width, ≤300 KB; uploaded via presigned URL; backend re-encodes through Sharp for safety, strips EXIF, generates 4 sizes
- After submit → push notification on admin decision

**Edge cases:**
- Slot full → block submit with "You've reached your post limit. Buy a bigger package or wait for one to clear"
- User has 5 packages — pick effective slot count = sum of postSlots from all active packages
- Image upload fails mid-flight → resumable: RN retains form, retries each image; no partial listing created
- User cancels while uploading → cleanup orphaned uploads after 1h via cron
- Title/description contain phone numbers / UPI handles → auto-flag for admin (regex)
- Image OCR detects phone number → auto-flag (async, after upload, before going to Pending)
- Category tree updated on backend after RN cached old version → RN refetches and reconciles. If selected leaf no longer exists, force user to repick
- Two users submit simultaneously when only 1 slot left → atomic count query (see §9.4)
- Listing immutable: PATCH endpoint must not exist. Only DELETE (manual remove) for Live listings

### 7.7 Admin Approval — Listings

**Acceptance:**
- Admin sees pending queue ordered by submission time
- Admin approves → status `live`, push + SMS to seller, listing visible to buyers
- Admin rejects → status `rejected`, push + SMS to seller with reason. Slot stays consumed until seller manually removes the rejected listing? **NO — per v2 flow, slot freed on rejection**. Backend immediately frees slot.
   - **Wait — re-read v2 flow.** "How a Slot Gets Freed Up: A pending product is rejected by the admin (slot freed). A live product is manually removed by the seller." OK, slot freed on rejection ✅
- Sold listing also frees slot (per v2 flow)

**Edge cases:**
- Admin queue grows > 100 items → SLA breach alert
- Two admins act on same listing at same time → optimistic concurrency on `version` field
- Rejected listing stays visible to seller in their "Rejected" tab forever (audit record)
- Banned-keyword auto-reject? Out of v1. Manual review only

### 7.8 Product Feed (Discovery)

**Acceptance:**
- `GET /listings/feed?lat=&lng=&category=&minPrice=&maxPrice=&page=&limit=20`
- Returns listings within 30km, status `live`, not the user's own, sorted by distance asc
- Excludes listings the user has already viewed in last 24h (best-effort, not strict)
- < 1s p95 response time
- Cached per user for 60s in Redis

**Edge cases:**
- User in remote location with 0 results in 30km → "No listings near you yet. Check back later" empty state. Do NOT silently expand radius
- Filter combination yields 0 results → empty state with "Clear filters" CTA
- Mongo geo query at 30km on category-level filter → benchmark; if > 200ms add Redis cache or graduate to OpenSearch (Phase 2)
- User's location not yet captured → block feed access, route to location screen
- Pagination consistency: cursor-based, not offset-based (so new listings don't shift pages)

### 7.9 Buy Product (Express Interest)

**Acceptance:**
- Atomic write: `findOneAndUpdate(interests, {listingId, buyerId}, {$setOnInsert: {...}}, {upsert: true})` keyed on unique compound index
- Idempotency key from RN; same key in 5 min returns cached response (no extra notification)
- Push to seller: "User X is interested in your listing Y"
- RN navigates to Chat with listing context card
- "Call" deep-links to dialer with seller's actual phone number revealed at this moment

**Edge cases:**
- Listing status flipped to `reserved` or `sold` between feed render and tap → reject with "This product is no longer available"
- Same buyer double-taps Buy → idempotency key dedupes silently
- Buyer is same user as seller → block at backend ("You can't buy your own listing")
- Buyer hasn't completed onboarding (no location) → redirect to location screen
- 50+ buyers tap simultaneously → all succeed in `interests` collection; only the seller's "Sell to" can pick one
- Privacy concern logged: revealing real phone numbers. Flag to client with privacy policy clause

### 7.10 Sell to this Buyer

**Acceptance:**
- Atomic: `findOneAndUpdate({_id: listingId, sellerId, status: 'live'}, {$set: {status: 'sold', soldTo: buyerId, soldAt: now, transactionId: new ObjectId(), delistedAt: now + 24h}})`
- Creates a `transaction` document
- Pushes "Seller chose another buyer" to all other interested buyers
- Pushes "Congrats, you got the deal" to chosen buyer
- Frees a slot for seller (since now status = sold, count of slots-in-use drops)
- After 24h, cron sets listing as fully delisted (still shows in seller and buyer history)

**Edge cases:**
- Two browser tabs / devices for the seller — one taps "Sell to A", other taps "Sell to B" simultaneously → atomic CAS ensures only one wins
- Buyer deleted account in between → mark transaction with `buyerDeleted: true`, still complete the sale
- Listing status was `pending` (rejected/expired) when seller tries to mark sold → atomic check fails, return "Cannot sell — listing not live"
- Cron job for 24h delisting fails → run-on-read fallback: feed query also filters `delistedAt > now OR delistedAt IS NULL`

### 7.11 Chat (Real-time)

**Acceptance:**
- Socket.IO with Redis adapter + sticky sessions at LB
- Chat created on first message tied to a listing
- Messages persist in Mongo
- Unread counts per user
- Typing indicators, read receipts (v1 nice-to-have)

**Edge cases:**
- Receiver offline → push notification fired (don't double-send if active session detected)
- Spam: same buyer messaging 50 listings in 1 hour → soft-limit at 30, then rate limit
- Profanity / abuse → flag for review, mute on reports (v1: report button → admin queue, no auto-action)
- Connection drops → client buffers, retries; server dedupes by message clientId
- Listing sold → chat remains accessible for both parties (post-sale coordination)
- Seller blocks buyer → buyer can no longer message seller. v1 nice-to-have

### 7.12 Notifications

**Acceptance:**
- All transactional events fire push via FCM
- DLT-approved SMS sent for: OTP, listing approved, listing rejected, package purchased
- Email for: account created, package GST receipt
- Per-user channel preference UI (v1.5)

**Edge cases:**
- FCM returns `NOT_REGISTERED` → delete that device token
- DLT template not approved by TRAI → SMS will silently fail at MSG91 → fail loudly in dev, fall back to log + push only in prod
- User has push disabled at OS level → only SMS / email reach them
- Token rotation: client calls `/me/device-token` on every cold start
- Notification storm (e.g., listing approved triggers 1 push, but cron retried 3 times) → idempotency key on `(eventType, eventRef)` to dedupe

---

## 8. Production Edge-Case Matrix (from Medium research — applied)

These are baked into the per-feature specs above; restated here as a checklist.

| # | Risk | Mitigation | Owner |
|---|------|------------|-------|
| 1 | OTP brute force | Layered rate limit per phone (5/24h), per IP (20/hr), per device fingerprint (10/hr); 30s resend cooldown; 24h block on 2 failed windows | Auth Service |
| 2 | DLT template rejection | Register all 8 templates in week 1; CI check that template IDs exist before deploy; templates take 3–7 days | DevOps + PM |
| 3 | Razorpay duplicate webhooks | `webhook_events` table with unique index on `eventId`; constant-time HMAC verify; raw body before JSON parser | Payment Service |
| 4 | Race in slot accounting | `findOneAndUpdate` atomic decrement using `$expr` query against count; or count-on-write under txn | Listing Service |
| 5 | Mongo geo at scale | 2dsphere index; benchmark at 100K listings; add OpenSearch when category+geo+sort combo hits 200ms p95 | Listing Service |
| 6 | Image upload abuse | Presigned URL with 5MB limit; Sharp re-encode; EXIF strip; async NSFW; per-user 50 imgs/hr cap | Media Service |
| 7 | Aadhaar Act non-compliance | No raw number in DB/logs; logger redaction filter; CI check; HSM-backed encryption for kyc vendor refs (Phase 1: AES-256 with KMS-managed key) | KYC Service |
| 8 | FCM token staleness | `onTokenRefresh` handler; cleanup tokens unused 60+ days; delete on `NOT_REGISTERED` response | Notification Service |
| 9 | Socket.IO scaling | Redis adapter; sticky sessions at LB; keep < 20K connections per node; alert on Redis pub/sub lag | Chat Service |
| 10 | Multi-device session abuse | One row per device in Better Auth `sessions`; cap at 5 active sessions; refresh-token rotation with reuse detection | Auth Service |
| 11 | Buy idempotency | Compound unique index `(listingId, buyerId)` + `idempotencyKey` from RN | Listing Service |
| 12 | Search cache poisoning | Cache key includes filter combo + 1km geo bucket; 60s TTL; rate-limit per user | Listing Service |
| 13 | One Aadhaar = many accounts | Aadhaar dedup at verify-time; phone dedup at OTP-time; device fingerprint flagged if 3+ accounts | KYC + Auth |
| 14 | Two buyers race on Sold | Atomic CAS on listing status; reservation TTL 30 min if needed (v1.5) | Listing Service |
| 15 | Investment / Booking dead code | Disabled in gateway + docker-compose; flag with `[PHASE_2_DISABLED]` README | DevOps |

---

## 9. Cross-Cutting Production Requirements

### 9.1 Rate Limit Matrix

| Endpoint | Per User | Per IP | Per Phone | Notes |
|----------|----------|--------|-----------|-------|
| `/auth/register` | — | 10/hr | 5/24h | After 3 fails → CAPTCHA |
| `/auth/login` | 10/hr | 30/hr | — | After 5 fails → CAPTCHA |
| `/auth/otp/send` | — | 20/hr | 5/24h | Hard cap at 5/day, OLX standard |
| `/auth/otp/verify` | — | 60/hr | 3/window | Per OTP rules in §7.1 |
| `/listings` POST | 50/day | 100/hr | — | Plus slot check |
| `/listings/feed` GET | 600/hr | 1000/hr | — | Cached 60s |
| `/listings/:id/interest` POST | 100/day | — | — | Idempotency key dedupes |
| `/chat/messages` POST | 1000/day | — | — | Plus per-listing soft limit |
| `/payments/orders` POST | 20/day | — | — | Prevent payment spam |
| `/seller/aadhaar/initiate` | 5/day | — | — | KYC vendor charges per call |
| `/media/upload-url` POST | 200/day | — | — | 50 images/hr soft cap |
| `/admin/*` | — | — | — | Admin IP allowlist |

Implemented via `express-rate-limit` + Redis store.

### 9.2 Logging & Observability

- **Logger:** Winston (already in shared) with redaction filter for: phone, email, otp, password, aadhaar, gst, panNumber, payment payloads, chat content
- **Request ID:** every request gets a UUID at gateway; propagated to all downstream services via `X-Request-Id` header; included in every log line
- **Sentry:** all services. Tag releases with git SHA. Use `beforeSend` to scrub PII
- **Metrics:** Prometheus-format metrics endpoint per service. Track: request count by route, p50/p95/p99 latency, error count by status code, active sockets (chat), Razorpay webhook lag, OTP send/verify rates
- **Alerts (PagerDuty / Slack):** p95 > 1s for 5 min, error rate > 2% for 2 min, Razorpay webhook backlog > 100, Aadhaar vendor 5xx > 5/min, FCM error rate > 5%

### 9.3 Security Checklist

- [ ] HTTPS only, TLS 1.2+ at LB
- [ ] HSTS header
- [ ] Helmet enabled in every service (already is)
- [ ] CORS allowlist by environment (currently `*` — fix for prod)
- [ ] All secrets in AWS Secrets Manager / Doppler — never .env in repo
- [ ] No PII in logs (CI grep test)
- [ ] No Aadhaar in logs (CI grep test)
- [ ] DPDP Act 2023 — privacy policy page, consent management for analytics, "delete my data" endpoint
- [ ] Pen test before public launch (vendor like SecureLayer7 / Astra)
- [ ] Mobile: certificate pinning v1.5, Frida/jailbreak detection v1.5
- [ ] Mobile: secure storage (Keychain / EncryptedSharedPreferences) — already done via react-native-keychain

### 9.4 Slot Counter — Atomic Implementation

This is the trickiest correctness invariant in the system. Spelled out:

```ts
// In listing-service, on POST /listings:

const session = await mongoose.startSession();
session.startTransaction();
try {
  const userPackages = await UserPackage.find({
    userId, isActive: true, validUntil: { $gt: now }
  }).session(session);
  const totalSlots = userPackages.reduce((s, p) => s + p.postSlots, 0);

  const usedSlots = await Listing.countDocuments({
    sellerId: userId,
    status: { $in: ['pending', 'live', 'reserved'] },
  }).session(session);

  if (usedSlots >= totalSlots) {
    throw new ApiError(403, 'Post slot limit reached');
  }

  await Listing.create([{
    sellerId: userId, status: 'pending', /* ...rest */
  }], { session });

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

Requires Mongo replica set (Atlas M10+ has it by default). Without txn → race when 2 listings submitted within milliseconds at last slot.

---

## 10. Tasks by Role

### 10.1 Backend Lead (1 person)
- Approve service map + boundaries (week 1, day 1)
- Decide rows 16, 18 of §2 in writing (today)
- Set up Atlas M10+ (replica set), Redis (Upstash or ElastiCache), S3 buckets
- Spec all admin endpoints + share with admin-panel team
- Daily code review of all service PRs
- Own the slot accounting + payment idempotency code reviews personally
- Write `@onetap/shared` Bearer auth middleware that all services use

### 10.2 Backend Developers (2 people split)

**Backend Dev A** (Auth + KYC + Notification)
- W1: Phone OTP flow end-to-end (MSG91 + DLT + Redis rate limit + 24h blocks)
- W1: Forgot password (3 endpoints: request-otp, verify-otp, reset). Reuse login OTP rate-limit + block logic. Reset must revoke all other Better Auth sessions for that user.
- W2: Aadhaar verification (Karza/Signzy integration) + redaction logger
- W2: Wholesale onboarding endpoints + admin queue
- W3: FCM push integration + notification templates
- W3: SMS DLT integration; email via SES

**Backend Dev B** (Listing + Payment + Media + Admin)
- W1: Categories CRUD + seed (3-level), Packages CRUD + seed
- W2: Listings — create (atomic slot check), list-mine, feed (geo + filter), detail
- W2: Razorpay integration: create order, webhook, idempotency, package activation
- W3: Interests + Sell-to-buyer atomic + transaction record + 24h delist cron
- W3: Image upload presigned URL + Sharp pipeline (or Cloudinary)
- W4: Admin endpoints (approve/reject seller, approve/reject listing, package CRUD)

### 10.3 Mobile Lead (1 person)
- Approve adjusted RN auth flow (4 → 6 OTP, password validation tightened)
- Set up Sentry, FCM, Razorpay, Socket.IO, image-picker libraries
- Daily code review
- Own state-management decisions + RTK Query patterns

### 10.4 Mobile Developers (2 people split)

**Mobile Dev A** (Auth/Onboarding/Become-Seller)
- W1: OTP screen 4→6 + 3-attempt + 24h block UX + tightened password validation
- W1: Real OTP API wired (drop MOCK_OTP)
- W1: Forgot password — wire 3 existing screens to real backend; reuse the OtpScreen component with the same 6-digit/3-attempt/24h-block UX. Show success toast + auto-route to Login on reset.
- W2: Become Seller intro + Aadhaar entry + Aadhaar OTP screens
- W2: Seller Type selection
- W3: Wholesale form + doc upload
- W3: Individual onboarding form
- W4: Profile / Settings screen + push token registration on cold start

**Mobile Dev B** (Buy + Sell)
- W2: Home (4 cards + Become Seller banner) + Coming Soon screens
- W2: Package selection + Razorpay SDK integration
- W3: Product Feed (30km, infinite scroll) + Filters bottom-sheet (Category 3-level, Price range)
- W3: Product Detail + Buy CTA + Chat/Call routing
- W3: List a Product form + image picker + reorder
- W4: My Listings (4 tabs)
- W4: Listing Detail (seller view) with Interested Buyers + Sell to this Buyer
- W4: Chat list + Chat conversation (Socket.IO client)
- W4: Sales / Purchase History

### 10.5 Designer
- W1: Final design system (colors, typography, spacing, components) — much already exists in RN code
- W1: All Phase 1 screens — high-fidelity in Figma
- W1: Empty / loading / error states for every screen
- W2: Animations + micro-interactions guide
- W2: Design tokens JSON for mobile dev consumption
- W3: Iconography (categories, statuses, badges)

### 10.6 QA (1 person, ramping with project)
- W1: Test plan from §7 acceptance criteria → JIRA test cases
- W2: Manual test: auth flow + Aadhaar flow on real Android (low-end + high-end) + iOS (1 device)
- W3: Manual test: package purchase + listing creation + feed + product detail
- W4: Manual test: chat + buy + sell + history
- W4: Race-condition tests (2 buyers simultaneously, 2 sellers tabs simultaneously)
- W4: Performance: home <2s, search <1s on 4G
- W4: Regression suite for every release
- W5: Pre-launch UAT support

### 10.7 DevOps (1 person)
- W1: Atlas M10 (replica set), Redis (Upstash), S3 buckets (uploads, processed, cold), CloudFront CDN
- W1: GitHub Actions CI/CD: lint → test → build → deploy. One workflow per service
- W1: Dev / Staging / Prod environments
- W2: Sentry, structured-log aggregation (CloudWatch or Datadog)
- W2: Secrets via AWS Secrets Manager
- W3: PagerDuty / Slack alerts (per §9.2)
- W3: Razorpay webhook backlog monitor + reconciliation cron
- W4: 24h delist cron + image-orphan cleanup cron + KYC vendor failure retry
- W4: Pre-launch DR drill

### 10.8 Project Manager
- Daily 15-min standup
- Weekly demo Friday EOD
- Track DLT registration (must complete W1)
- Track Razorpay onboarding (must complete W1–W2)
- Track KYC vendor signup (must complete W1)
- Maintain risk register (next section)
- Unblock [TBD] items weekly
- Maintain this document — when scope shifts, update §3 first, then announce

---

## 11. Sprint Plan (8-week Realistic Target)

> The v1 plan said 4 weeks. **That is not realistic** for this scope (Aadhaar + Razorpay + listings + chat + moderation, plus the buggy migration from existing scaffold). Below is an honest 8-week plan. If client demands faster, see §13 "What to cut."

### Week 1 — Foundations + Vendor Onboarding
- **All:** read this doc end-to-end
- **DevOps:** Atlas, Redis, S3, dev/staging envs, CI/CD per service
- **PM:** Razorpay paperwork started, KYC vendor signed, MSG91 + 8 DLT templates submitted
- **Backend Lead:** finalize service rename, kill investment/booking/wallet from gateway, write shared auth middleware
- **Backend A:** Phone OTP backend (MSG91 mock acceptable until DLT live), 24h blocks, rate limits
- **Backend B:** Categories seed (3-level), Packages CRUD + seed
- **Mobile A:** OTP 4→6, password tighten, login auto-routes to OTP step
- **Mobile B:** Home screen with 4 cards (3 disabled) + Become Seller banner
- **Designer:** lock design system, deliver auth + home screens
- **QA:** test plan v1
- **EOW deliverable:** A new user can register/login, get OTP (mock), grant location, land on home — all on staging

### Week 2 — Seller Onboarding + Packages
- **Backend A:** Aadhaar verification end-to-end with KYC vendor sandbox; Wholesale endpoints + admin queue; logger redaction
- **Backend B:** Razorpay order create + webhook + signature verify + package activation; idempotency
- **Mobile A:** Become Seller intro, Aadhaar number entry, Aadhaar OTP screen, Seller Type selection
- **Mobile B:** Package selection screen (dynamic), Razorpay SDK integration, success/failure screens
- **Designer:** all seller-onboarding screens + package screens
- **QA:** test Aadhaar happy + OTP failure paths
- **EOW deliverable:** A user can become an Individual Seller end-to-end and buy a package on staging

### Week 3 — Listings + Discovery + Buy
- **Backend B:** Listings CRUD (with atomic slot check), Feed (geo+filter), Product detail, Interest API (idempotent)
- **Backend B:** Image upload presigned URL + Sharp pipeline + EXIF strip
- **Backend A:** SMS DLT integration live (templates approved by now); FCM push
- **Mobile B:** List a Product form + image picker, Product Feed + Filters, Product Detail, Buy + Chat/Call routing
- **Mobile A:** Wholesale form + doc upload, Individual onboarding form
- **Designer:** product screens + filter sheets
- **QA:** end-to-end seller list-product, buyer browse, buyer interest
- **EOW deliverable:** Seller can list, buyer can browse + tap Buy + reach Chat screen on staging

### Week 4 — Chat + Sell-to + History + Admin
- **Backend B:** Sell to this Buyer atomic + transaction + 24h delist cron; Admin endpoints (approve/reject seller, listing)
- **Chat service:** Socket.IO + Redis adapter, message persistence, presence
- **Backend A:** Notification matrix complete (all 8+ events firing)
- **Mobile B:** My Listings (4 tabs), Interested Buyers list, Sell to this Buyer modal, Chat list + conversation, Histories
- **Mobile A:** Profile screen, push token registration, in-app notification center
- **QA:** full happy path E2E, race-condition tests, real-device performance
- **EOW deliverable:** Full Phase 1 happy path works end-to-end on staging

### Week 5 — Hardening + Edge Cases
- **All hands:** burn down §7 edge cases that didn't make it
- **Backend Lead:** review all atomic operations (slot, sold, payment), prove correctness
- **DevOps:** alerts wired, dashboards built, on-call rotation defined
- **QA:** regression sweep, load test (1K concurrent users), pen test prep
- **Mobile:** Sentry, analytics, crash-free rate target ≥ 99.5%

### Week 6 — Pre-launch QA + Compliance
- **External pen test** (vendor)
- **DPDP compliance audit:** privacy policy live, consent flows, delete-my-data endpoint
- **Aadhaar compliance self-audit** (CI logs grep + manual review)
- **Performance final pass:** home <2s, feed <1s, OTP send <5s — measured on real 4G
- **QA UAT pass with client**

### Week 7 — Closed Beta
- **Internal team + 50 invited users** in target city
- **Daily bug triage**
- **Watch metrics:** OTP delivery, payment success, listing approval SLA, search latency, crash rate

### Week 8 — Public Launch (City 1)
- **Soft launch** with marketing dampened
- **First 7 days on-call rotation 24/7**
- **Monitor:** acquisition funnel, time-to-first-listing, fraud signals, infra cost

---

## 12. What to Cut if Timeline Slips (Drop in This Order)

1. **In-app notification center** (F6.5) — push alone is enough for v1
2. **Wholesale onboarding** — launch with Individual only; flag Wholesale as "Coming Soon" in Seller Type screen (saves W2 + W3 1 week)
3. **Seller / Buyer ratings + reviews** — out, defer to v1.1
4. **Image NSFW async** — manual moderation only in v1
5. **Image OCR for phone numbers** — manual moderation only in v1
6. **Admin approval SLA escalation cron** — manual chasing in v1
7. **Notification preferences UI** — fixed defaults in v1

**Forgot password is now LOCKED IN** (client decision 2026-05-08) and will NOT be cut.

**DO NOT cut:**
- Aadhaar verification (legal requirement)
- Slot atomic accounting (data corruption risk)
- Payment idempotency (duplicate charges = customer support hell)
- 24h OTP block (brute force)
- DLT templates (TRAI fines)
- Logger redaction (Aadhaar Act ₹1 Cr penalty)

---

## 13. Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|------|-----------|--------|-----------|-------|
| 1 | DLT templates not approved by W3 | M | H | Submit ALL 8 in W1; have SMS gateway fallback (Twilio) ready | PM |
| 2 | Razorpay onboarding > 10 days | H | H | Start day 1; if blocked, demo on Razorpay test mode | PM |
| 3 | KYC vendor sandbox unstable | M | H | Sign with 2 vendors (Karza primary, Signzy backup) | Backend Lead |
| 4 | Aadhaar Act audit failure | L | Critical | Logger redaction CI test, encrypted vendor refs, no raw number anywhere | Backend Lead + QA |
| 5 | Slot accounting bug → over-listing | M | M | Mongo txn + correctness review by Backend Lead personally | Backend Lead |
| 6 | Payment double-charge | L | High | Idempotency key + webhook unique index + reconciliation cron | Backend B |
| 7 | Spam listings flood at launch | M | H | Mandatory admin review + rate limit + image OCR (post-launch) | Ops + PM |
| 8 | Socket.IO scaling issue at 1K concurrent | M | M | Redis adapter from day 1; monitor; capacity plan | Backend Lead + DevOps |
| 9 | 4-week pressure → corner-cutting | H | H | This 8-week plan must be the agreement; if rushed, see §12 | PM |
| 10 | Privacy backlash on revealing seller phone numbers | M | M | Surface in privacy policy explicitly; consider call-masking for v1.5 | PM + Legal |
| 11 | Image storage cost balloon | M | M | Aggressive compression + S3 lifecycle (Glacier after 90d) | DevOps |
| 12 | One-Aadhaar-many-accounts abuse | M | M | Aadhaar dedup at verify; device fingerprint flagging | Backend Lead |
| 13 | Investment / Booking dead code accidentally shipped | L | M | Disable in gateway + docker-compose; CI test that ports 3003-3004 not exposed | DevOps |
| 14 | Single-region outage | L | H | Multi-AZ on Atlas + S3; multi-AZ Redis; health checks at LB | DevOps |
| 15 | Real phone numbers in chat → off-platform deals + no platform protection | M | M | Add ToS clause; v1.5 add chat-side phone-number regex flagging | PM |

---

## 14. Definition of Ready (Per Ticket)

A ticket is ready to start when:
- [ ] Acceptance criteria written (copy from §7)
- [ ] Edge cases listed (copy from §7)
- [ ] API contract agreed (if cross-service)
- [ ] Designs available (if UI)
- [ ] Dependencies identified (e.g., DLT must be live before OTP backend can be production-tested)

## 15. Definition of Done (Per Ticket)

- [ ] Acceptance criteria met
- [ ] All edge cases either tested or documented as "deferred to vX"
- [ ] Integration test against real DB (no mocks for DB layer)
- [ ] Manual test on real device (mobile) or via Postman (backend)
- [ ] Code review approved (lead for atomic/payment/auth code; peer for rest)
- [ ] No new lint warnings
- [ ] No PII in logs (grep CI passes)
- [ ] No Aadhaar in logs (regex CI passes)
- [ ] Deployed to staging
- [ ] Documented if it changes a contract (API, schema, env var, event topic)

---

## 16. Open Items (Need Client/Lead Decision Now)

| # | Decision | Asks | By |
|---|----------|------|-----|
| 1 | ~~Forgot password — keep or drop in v1?~~ **RESOLVED 2026-05-08: KEEP in v1.** | — | DONE |
| 2 | Investment + Booking + Wallet folders — confirm disable from gateway | Backend Lead | EOD today |
| 3 | Better Auth (sessions) — confirm keep over JWT+refresh | Backend Lead | EOD today |
| 4 | KYC vendor — Karza vs Signzy — final pick | Tech Lead | W1 day 2 |
| 5 | Email mandatory for sellers? | Client | W1 day 3 |
| 6 | Final package pricing tiers | Client | W1 day 5 |
| 7 | ~~Banned-categories list~~ **RESOLVED 2026-05-08:** weapons, drugs/narcotics, adult/pornographic content, live animals. Plus standard add-ons: counterfeit goods, stolen goods, recalled products, human remains/body parts, hazardous materials, prescription drugs, tobacco/e-cigarettes, lottery tickets, services-as-product. Implementation: hard-coded enum in admin-service category seed; categories collection has `isBanned: bool` flag; admin-service rejects any listing whose `categoryPath` contains a banned category at any level. | — | DONE |
| 8 | GST on packages — 18%? | Client (CA) | W2 |
| 9 | Admin approval SLA target (24h?) | Client (Ops) | W1 |
| 10 | ~~Geographic launch city~~ **RESOLVED 2026-05-08: pan-India launch** (not single city). | — | DONE |
| 11 | Privacy policy on revealing seller phone numbers | Client + Legal | W2 |
| 12 | ~~Languages at launch~~ **RESOLVED 2026-05-08: English + Hindi** at launch. RN already has `i18n.ts` scaffold. Hindi adds ~25% to QA scope (every screen must be tested in both languages). Translation pipeline: Mobile Lead owns the en.json/hi.json files; client provides Hindi translations or we use a translator. Right-to-left not needed (Hindi is LTR). | — | DONE |

---

## 17. Where to Find Things

| What | Where |
|------|-------|
| This document | `/one tap backend/OneTap365_Implementation_Plan_v2.md` |
| Old v1 plan (superseded where conflicting) | `/one tap backend/OneTap365_Consumer_App_Plan_v1.md` |
| Customer user flow | from client (2026-05-08) — append to this folder |
| Open questions to client | `/one tap backend/OneTap365_Open_Questions.md` |
| Backend code | `/one tap backend/oneTapServer/` |
| Mobile code | `/react native/oneTapReactNative/` |
| API documentation (live, must update for new endpoints) | `/one tap backend/oneTapServer/API_DOCUMENTATION.md` |
| ER diagram (must update) | `/one tap backend/oneTapServer/er.mmd` |
| Figma | `[TBD — designer to share]` |
| JIRA | `[TBD — PM to share]` |

---

**End of v2 Plan.** Update this document when scope changes. Re-read at the start of each sprint.
