# OneTap365 Consumer App — Team Planning Document (v1)

**Project ID:** Pr-2026-00012
**Scope:** Consumer App ONLY, Phase 1 (this month)
**In Scope This Phase:** Auth & Registration · Become-a-Seller (Aadhaar) · Sell Product (Packages) · Buy Product · Recommendations · Trending
**Out of Scope This Phase:** Book a Service · Property Bidding · SIP Investment · Vendor App · Admin Panel UI (only Admin APIs needed for seller approval & listing approval)
**Audience:** Every developer, designer, QA, and PM on the project — including junior devs joining mid-project
**Last Updated:** 2026-05-03

---

## 0. How to Read This Document

If you're new to the project, read sections in order:

1. **Section 1** — what we're building, in plain English
2. **Section 2** — the user (who we're building it for)
3. **Section 3** — feature-by-feature spec with acceptance criteria
4. **Section 4** — data model (what tables/collections exist)
5. **Section 5** — API list (what endpoints exist)
6. **Section 6** — tech stack & folder structure
7. **Section 7** — your tasks based on your role
8. **Section 8** — open questions still pending from client (don't block — use the assumption noted)
9. **Section 9** — definitions, glossary, and conventions

**Convention used throughout:**
- `[CONFIRMED]` = client has confirmed this
- `[ASSUMPTION]` = team's working assumption; flagged for client confirmation but DO NOT WAIT — build with this
- `[TBD]` = needs decision before that specific task starts

---

## 1. What We Are Building (Plain English)

OneTap365 is a marketplace mobile app where users can:

1. **Sign up** using Google or Phone OTP.
2. **Browse and buy** products (electronics, vehicles, machines, etc.) listed by other users.
3. **Become a verified seller** by completing Aadhaar verification + admin approval.
4. **Buy a "Posting Package"** (e.g., 5 posts / 20 posts / 50 posts) to list their own products.
5. **Post product listings** that go through admin approval before becoming public.
6. **Discover products** through personalized recommendations and a trending section.
7. **Contact sellers** via in-app chat or call.
8. **Pay Cash on Delivery** for products. Online payments are used only for buying packages.

That's the full Phase 1 scope. Everything else (services, bidding, SIP) comes later.

---

## 2. The User

We have ONE user account type with three states:

| State | What they can do | How they get there |
|-------|------------------|-------------------|
| **Buyer** (default) | Browse, search, view, contact sellers, buy via COD | Sign up |
| **Verified Seller** | Everything Buyer can + post listings (after buying package) | Submit Aadhaar → admin approves |
| **Verified Seller with Active Package** | Same as above + actually post listings | Buy a Posting Package |

There is NO separate seller account. Same login, same profile — just elevated permissions after Aadhaar + admin approval.

---

## 3. Feature Specifications

Each feature below contains: **Description · User Flow · Screens · Acceptance Criteria · Edge Cases · Open Questions for that feature.**

---

### 3.1 Authentication & Registration

#### 3.1.1 Description
First-time user signs up with Google or Phone OTP. Returning user logs in with the same method. Profile completion is required before they can use the app.

#### 3.1.2 User Flow

```
[Splash Screen]
       │
       ▼
[Welcome / Login Screen]
       │
   ┌───┴───┐
   ▼       ▼
[Google] [Phone OTP]
   │       │
   │       ▼
   │   [Enter OTP]
   │       │
   └───┬───┘
       ▼
   Is profile complete?
       │
   ┌───┴───┐
   No      Yes
   ▼       ▼
[Profile  [Home]
 Setup]
   │
   ▼
[Select Categories of Interest]
   │
   ▼
[Home]
```

#### 3.1.3 Screens
1. Splash
2. Welcome/Login (Google button + "Continue with Phone" button)
3. Phone Number Entry (with country code, India default +91)
4. OTP Entry (6 digits, 30s resend timer, auto-read on Android)
5. Profile Setup (Name, Email-optional, Location, Profile Photo-optional)
6. Category Selection (multi-select, nested 3 levels)
7. Home

#### 3.1.4 Acceptance Criteria
- [ ] User can sign up with Google in ≤ 3 taps
- [ ] User can sign up with Phone OTP in ≤ 5 taps
- [ ] OTP auto-reads on Android (SMS Retriever API), manual entry on iOS
- [ ] OTP retry available after 30 seconds; max 3 OTP requests per number per 10 minutes
- [ ] Profile fields validated: Name (2–50 chars), Phone (10 digits, +91), Email (valid format if provided)
- [ ] Location captured via GPS with permission prompt; user can override manually
- [ ] User must select at least 1 top-level category before reaching Home
- [ ] Session persists across app restarts (JWT stored in encrypted secure storage — Keychain / Keystore)
- [ ] Logout clears all local data
- [ ] Backend rejects duplicate phone numbers (one phone = one account)

#### 3.1.5 Edge Cases
- Invalid OTP → show error, allow retry up to 5 times, then 30-min lockout on that phone number
- No internet during signup → cache profile data, retry on connection
- User denies location permission → fall back to manual city entry
- Google account email already linked to phone-OTP account → merge accounts under the phone number
- App killed mid-signup → resume from last completed step on relaunch

#### 3.1.6 Open Questions (for this feature only)
- Email mandatory? — **[ASSUMPTION]** optional for buyers, mandatory for sellers
- Multi-device login allowed? — **[ASSUMPTION]** yes, one active session per device, max 3 devices
- Session timeout? — **[ASSUMPTION]** 30 days, refresh token rotates

---

### 3.2 Become a Seller (Aadhaar Verification + Admin Approval)

#### 3.2.1 Description
A buyer wants to start selling. They submit Aadhaar details, which are verified via a third-party KYC provider (Karza / Signzy / Digio — **[TBD]** which one). Once Aadhaar is verified, the request goes to Admin for manual approval. Once admin approves, the user becomes a Verified Seller.

#### 3.2.2 User Flow

```
[Home / Profile]
       │
       ▼
[Become a Seller] button
       │
       ▼
[Info Screen — what you need to provide]
       │
       ▼
[Enter Aadhaar Number]
       │
       ▼
[Receive OTP on Aadhaar-linked phone]
       │
       ▼
[Verify OTP with UIDAI (via KYC provider)]
       │
       ├─ Failure → show reason, allow retry
       │
       ▼
[Aadhaar Verified — submit to admin]
       │
       ▼
[Pending Approval Screen]
       │
       ▼ (poll or push notification)
       │
   ┌───┴────┐
   ▼        ▼
[Approved] [Rejected with reason]
   │           │
   ▼           ▼
[Seller    [Re-apply
 Dashboard] flow]
```

#### 3.2.3 Screens
1. Become Seller — Info Screen (what's needed, why)
2. Aadhaar Number Entry
3. Aadhaar OTP Entry
4. Verification Status — In Progress
5. Pending Admin Approval
6. Approval Confirmed
7. Rejection — with reason and re-apply option

#### 3.2.4 Acceptance Criteria
- [ ] Aadhaar number masked in UI after entry (show only last 4 digits)
- [ ] Aadhaar number NEVER stored in our database in raw form — only the **KYC reference ID** from provider is stored
- [ ] Verification status transitions: `not_started → aadhaar_pending → aadhaar_verified → admin_pending → approved | rejected`
- [ ] User receives push notification when admin approves/rejects
- [ ] On approval, user's role changes to `verified_seller`
- [ ] Rejected users can re-apply after 24 hours
- [ ] Admin sees: name, masked Aadhaar (last 4), verification timestamp, KYC provider reference, photo from Aadhaar (if returned by provider)

#### 3.2.5 Edge Cases
- Aadhaar OTP fails 3 times → block re-attempt for 1 hour
- Aadhaar verified but admin doesn't act in 48 hours → escalate (notification to admin team lead)
- User deletes account while pending → KYC reference must be retained for 7 years (Aadhaar Act compliance)
- Same Aadhaar tries to register on a second account → block, show "Aadhaar already in use"

#### 3.2.6 Compliance Notes (READ THIS — JUNIOR DEVS)
- We are NOT directly authorized by UIDAI. We MUST go through a registered AUA/KUA provider (Karza, Signzy, Digio, IDfy, HyperVerge — **[TBD]**).
- We do NOT store: raw Aadhaar number, Aadhaar XML, eKYC photo (unless masked), biometric data.
- We DO store: KYC provider's reference/transaction ID, masked Aadhaar (last 4 digits), name as returned by KYC, verification timestamp.
- Logs that contain Aadhaar must be redacted before writing to disk or sending to monitoring tools.
- **Penalty for non-compliance: ₹1 crore under Aadhaar Act.** Take this seriously.

#### 3.2.7 Open Questions
- KYC provider — **[TBD]** ask client to choose between Karza / Signzy / Digio / IDfy. Pricing varies (₹3–₹15 per verification).
- Admin approval SLA — **[ASSUMPTION]** 24 hours; client to confirm.
- Address proof needed in addition to Aadhaar? — **[ASSUMPTION]** no, Aadhaar address is sufficient.

---

### 3.3 Posting Packages (Buy Credits to List Products)

#### 3.3.1 Description
A verified seller cannot post products directly. They must first buy a **Posting Package** that gives them N posts. Each listing they create deducts 1 from their package balance.

#### 3.3.2 Package Structure (PROPOSED — confirm with client)

| Package Name | Posts | Price | Validity |
|--------------|-------|-------|----------|
| Starter | 5 | ₹99 | 30 days |
| Growth | 20 | ₹299 | 60 days |
| Pro | 50 | ₹599 | 90 days |
| Business | 200 | ₹1,999 | 180 days |

> All values **[ASSUMPTION]** — client must finalize pricing.

#### 3.3.3 User Flow

```
[Try to post a listing]
       │
       ▼
   Has active package with credits?
       │
   ┌───┴────┐
   No       Yes
   ▼        ▼
[Buy     [Continue to
 Package  Listing Form]
 Screen]
   │
   ▼
[Select Package]
   │
   ▼
[Payment via Razorpay/Cashfree (TBD)]
   │
   ├─ Failure → show error, retain selection
   │
   ▼
[Payment Success]
   │
   ▼
[Package Active — credits added]
   │
   ▼
[Continue to Listing Form]
```

#### 3.3.4 Screens
1. Buy Package — Plan Cards
2. Plan Detail / Comparison
3. Payment Method Selection
4. Payment Gateway (in-app browser / SDK)
5. Payment Success
6. Payment Failure (with retry)
7. My Packages (history + active credits view)

#### 3.3.5 Acceptance Criteria
- [ ] User sees their current credit balance and validity on the "My Packages" screen
- [ ] When credits = 0 OR validity expired, the "Post Listing" button is disabled with a CTA to "Buy Package"
- [ ] Each successful listing creation deducts exactly 1 credit, atomic operation (no double-deduction on retry)
- [ ] If a listing is rejected by admin, the credit is **refunded** to the user automatically
- [ ] Payment receipt (with GST invoice) sent to user's email after package purchase
- [ ] User can buy a new package even if existing one is active — credits stack, validity extends
- [ ] Payment failure does not deduct from any wallet/credit balance

#### 3.3.6 Edge Cases
- Payment success but our backend doesn't get callback → reconcile via webhook + scheduled job (every 5 min, check pending payments against gateway)
- User buys package, internet drops before confirmation screen → show pending state on next app open, reconcile with gateway
- Package expired with unused credits → credits become unusable (not refunded). Show clear messaging before purchase.
- Refund of credit (after listing rejection) → only refund if package still valid; else log but don't restore

#### 3.3.7 Open Questions
- Final pricing & package tiers — **[TBD]** client to confirm
- GST handling — **[TBD]** does platform have GSTIN? Are packages 18% GST?
- Refund policy on package purchase — **[ASSUMPTION]** non-refundable once activated; client to confirm.

---

### 3.4 Post a Product Listing

#### 3.4.1 Description
A verified seller with active package credits creates a product listing. The listing is reviewed by an admin before going live.

#### 3.4.2 User Flow

```
[Tap "Sell" / "Post Listing"]
       │
       ▼
   Verified seller? — No → [Become Seller flow]
       │ Yes
       ▼
   Has credits? — No → [Buy Package flow]
       │ Yes
       ▼
[Select Category] (nested)
       │
       ▼
[Fill Listing Details — dynamic by category]
       │
       ▼
[Upload Photos] (1–8 images)
       │
       ▼
[Set Price + Negotiable flag]
       │
       ▼
[Preview]
       │
       ▼
[Submit] — credit deducted, status = pending_review
       │
       ▼
[Pending Approval screen]
       │
       ▼ (push notification)
       │
   ┌───┴────┐
   ▼        ▼
[Approved — [Rejected —
 listing      with reason
 live]        credit refunded]
```

#### 3.4.3 Screens
1. Category Picker (nested)
2. Listing Form (dynamic fields per category)
3. Image Upload (camera / gallery, reorder, delete)
4. Price & Options (negotiable toggle, condition: new/used)
5. Preview
6. Submission Confirmation
7. My Listings (with status badges: pending / live / rejected / sold / expired)

#### 3.4.4 Field Schema by Category

**Common fields (all categories):**
- Title (5–100 chars, required)
- Description (20–2000 chars, required)
- Photos (1–8, required, max 5 MB each, jpg/png/webp)
- Price (required, ≥ ₹1)
- Negotiable (boolean, default true)
- Condition (new / like new / used, required for non-property)
- Location (auto from profile, editable)

**Electronics — additional:**
- Brand, Model, Year of purchase, Warranty status

**Vehicles — additional:**
- Make, Model, Year, KMs driven, Fuel type, Transmission, Owner number (1st/2nd/3rd)

**Machines — additional:**
- Type, Brand, Year, Working condition

**Others (catch-all) — common fields only.**

> Full per-category schema to be finalized in design review. Junior devs: **build the form as a config-driven component** so we can add fields per category without changing code.

#### 3.4.5 Acceptance Criteria
- [ ] Form validates per-category required fields before submission
- [ ] Image uploads happen in background, with progress indicator
- [ ] Image compression on device before upload (max 1080px wide, ~300 KB)
- [ ] Submitting a listing deducts 1 credit atomically
- [ ] Listing status transitions: `pending_review → live | rejected → (if rejected) re-edit allowed → pending_review`
- [ ] Listing has a 30-day default expiry; user can renew (1 credit) before/after expiry
- [ ] Seller can mark a listing as "Sold" manually
- [ ] Seller can edit a live listing — title/description/price edits don't re-trigger review; photo/category changes do
- [ ] Maximum 50 active listings per seller (configurable)

#### 3.4.6 Edge Cases
- Submission fails after credit deduction → rollback credit
- User loses internet mid-form → autosave draft locally every 30 seconds
- Admin rejects with reason → user sees reason, can edit and resubmit (no extra credit)
- Banned keyword in title/description → auto-flag for admin review
- Duplicate listing (same user, same photos within 7 days) → warn user, allow override

#### 3.4.7 Open Questions
- Banned categories list (weapons, drugs, adult, etc.) — **[TBD]** legal team
- Banned keywords list — **[TBD]** ops team to provide
- Edit triggers re-review threshold — **[ASSUMPTION]** as above; client to confirm

---

### 3.5 Buy Products (Browse + Search + Detail + Contact + COD)

#### 3.5.1 Description
Any user (verified seller or not) can browse listings, search, filter, view details, contact sellers, and complete a COD purchase intent.

#### 3.5.2 User Flow

```
[Home]
       │
   ┌───┼───┐
   ▼   ▼   ▼
[Recommended] [Trending] [Categories]
       │
       ▼
[Search bar / filter / sort]
       │
       ▼
[Listing Grid / List]
       │
       ▼
[Tap Listing → Product Detail]
       │
   ┌───┼───┬────┐
   ▼   ▼   ▼    ▼
[Chat][Call][Save][Buy COD]
              │
              ▼
        [Confirm Buy with COD]
              │
              ▼
        [Order Created — pending seller acceptance]
              │
              ▼
        [Seller accepts → Coordinate offline]
              │
              ▼
        [Order marked Completed by either party]
```

#### 3.5.3 Screens
1. Home (Recommended + Trending + Category strips)
2. Search & Filter
3. Listing Grid
4. Product Detail (image carousel, description, price, seller card, action buttons)
5. Chat
6. Order Confirmation
7. My Orders (buyer)
8. My Orders (seller, incoming)

#### 3.5.4 Acceptance Criteria
- [ ] Home loads in < 2 seconds on 4G
- [ ] Recommended section shows products matching user's interest categories + location, max 20 items
- [ ] Trending section shows top 20 products based on (views + interest expressions) over last 7 days
- [ ] Search supports: keyword, category filter, price range, location radius, condition, sort (newest/price low-high/price high-low)
- [ ] Search returns results in < 1 second
- [ ] Product detail shows seller name, profile photo, verified badge, member since
- [ ] Chat opens directly from product detail with that product attached as a "context card"
- [ ] Call uses **call masking** (Exotel/Knowlarity — **[TBD]**) so neither party sees the other's real number
- [ ] COD order creation: buyer submits intent → seller gets push notification → seller accepts/declines → both can chat to coordinate handover
- [ ] Order status: `pending_seller → accepted → completed | cancelled`
- [ ] No payment flows in COD — money exchange is offline between buyer and seller
- [ ] Buyer and seller can each rate the transaction after completion

#### 3.5.5 Edge Cases
- Seller doesn't respond in 48 hours → order auto-cancelled
- Listing marked sold during chat → notify other interested buyers, lock further chat
- Buyer reports a scam → immediate review, possible seller suspension
- Repeated cancellations by a seller → flag for admin

#### 3.5.6 Open Questions
- Delivery logistics for non-pickup transactions — **[ASSUMPTION]** v1 is **pickup / coordinate offline only**; logistics integration is v2.
- Platform commission on sale — **[ASSUMPTION]** none in v1 (pure marketplace, revenue from packages only).
- Buyer-side cancellation policy — **[ASSUMPTION]** can cancel before seller accepts; after acceptance, both must agree.

---

### 3.6 Recommendations & Trending

#### 3.6.1 Recommendations
**Algorithm v1 (simple, no ML):**

```
score(listing, user) =
    (3 if listing.category ∈ user.interests else 0)
  + (2 if listing.location.city == user.location.city else 0)
  + (1 if listing.location.distance_km < 50 else 0)
  + (0.1 × log(views_last_7d + 1))
  - (0.5 × age_in_days / 30)
```

Top 20 by score, refreshed every 6 hours per user. Cache per user in Redis.

#### 3.6.2 Trending
**Algorithm v1:**

```
trending_score(listing) =
    (1.0 × views_last_7d)
  + (3.0 × chat_initiations_last_7d)
  + (5.0 × buy_intents_last_7d)
  - (0.2 × age_in_days)
```

Top 20 globally, refreshed every 1 hour. Cache globally in Redis.

#### 3.6.3 Acceptance Criteria
- [ ] Recommendations served from cache; cache miss falls back to "Newest in your categories"
- [ ] Trending served from cache; cache miss falls back to "Most viewed last 7 days"
- [ ] Both lists exclude listings the user has already viewed in the last 24 hours (to encourage discovery)
- [ ] Both lists exclude the user's own listings
- [ ] Empty state if user has no interests selected: show "Set up your interests" CTA

#### 3.6.4 Open Questions
- Final algorithm tuning — **[ASSUMPTION]** ship v1 above, iterate based on engagement data
- ML-based recommendations — **[OUT OF SCOPE]** v2

---

## 4. Data Model (Backend)

> Database: **MongoDB** (assumption — confirm with backend lead, since folder shows `oneTapServer/microservices`). Adjust to Postgres if team chooses relational.

### 4.1 Collections / Tables

#### `users`
```
_id, phone (unique, indexed), email (optional, unique sparse), googleId (optional),
name, profilePhotoUrl, dob (optional), gender (optional),
location: { city, state, pincode, geoPoint: {lat, lng} },
interests: [categoryId],  // multi-level, store leaf categories
role: enum('buyer', 'verified_seller'),
sellerVerification: {
    status: enum('not_started', 'aadhaar_pending', 'aadhaar_verified', 'admin_pending', 'approved', 'rejected'),
    aadhaarLast4: string,
    kycProviderRef: string,
    kycProviderName: string,
    submittedAt: timestamp,
    reviewedAt: timestamp,
    reviewedBy: adminUserId,
    rejectionReason: string
},
deviceTokens: [{ token, platform, lastSeen }],
createdAt, updatedAt, deletedAt
```

#### `categories`
```
_id, name, slug, parentId (nullable for top-level), level (0/1/2),
iconUrl, sortOrder, isActive
```

#### `packages_catalog`
```
_id, name, postCount, priceInPaise, validityDays, isActive, sortOrder
```

#### `user_packages`
```
_id, userId, packageId, postsTotal, postsRemaining,
purchasedAt, expiresAt, paymentId, status: enum('active','expired','exhausted')
```

#### `payments`
```
_id, userId, amountInPaise, currency, gateway, gatewayOrderId, gatewayPaymentId,
purpose: enum('package_purchase'),
referenceId,  // user_packages._id
status: enum('initiated','success','failed','refunded'),
gatewayPayload (raw),
createdAt, completedAt
```

#### `listings`
```
_id, sellerId, categoryId, categoryPath: [topId, subId, leafId],
title, description, photos: [{url, order}],
priceInPaise, isNegotiable, condition,
attributes: {brand, model, year, ...}, // dynamic per category
location: { city, geoPoint },
status: enum('pending_review','live','rejected','sold','expired'),
rejectionReason, reviewedAt, reviewedBy,
expiresAt,
viewsCount, chatInitiationsCount, buyIntentsCount, // denormalized counters
createdAt, updatedAt
```

#### `chats`
```
_id, participants: [userId, userId], listingId,
lastMessageAt, lastMessagePreview, unreadCount: { userId: count }
```

#### `messages`
```
_id, chatId, senderId, body, mediaUrl (optional),
createdAt, readBy: [{userId, readAt}]
```

#### `orders`
```
_id, listingId, buyerId, sellerId, agreedPriceInPaise,
status: enum('pending_seller','accepted','completed','cancelled'),
acceptedAt, completedAt, cancelledAt, cancellationReason,
buyerRating, sellerRating
```

#### `recommendations_cache` (Redis)
```
key: rec:user:{userId}, value: [listingId, ...], ttl: 6h
key: trending:global, value: [listingId, ...], ttl: 1h
```

#### `admin_actions` (audit log)
```
_id, adminId, action, entityType, entityId, before, after, reason, createdAt
```

---

## 5. API Surface (Backend)

> All endpoints prefixed `/api/v1`. JWT in `Authorization: Bearer <token>` header. Pagination: `?page=1&limit=20`.

### 5.1 Auth
- `POST /auth/google` — body: `{idToken}` → `{user, accessToken, refreshToken}`
- `POST /auth/phone/request-otp` — body: `{phone}` → `{otpRequestId}`
- `POST /auth/phone/verify-otp` — body: `{otpRequestId, otp}` → `{user, accessToken, refreshToken}`
- `POST /auth/refresh` — body: `{refreshToken}` → `{accessToken, refreshToken}`
- `POST /auth/logout` — clears server-side token

### 5.2 Profile
- `GET /me` → user object
- `PATCH /me` — update profile fields
- `POST /me/interests` — body: `{categoryIds: []}`
- `POST /me/device-token` — register FCM token
- `DELETE /me` — soft delete account

### 5.3 Categories
- `GET /categories` — full tree

### 5.4 Seller Verification
- `POST /seller/aadhaar/initiate` — body: `{aadhaarNumber}` → `{kycRequestId}`
- `POST /seller/aadhaar/verify-otp` — body: `{kycRequestId, otp}` → `{status}`
- `GET /seller/verification-status` → current status

### 5.5 Packages
- `GET /packages` — list catalog
- `POST /packages/purchase` — body: `{packageId}` → `{paymentOrder}`
- `POST /packages/payment/callback` — webhook from gateway
- `GET /me/packages` — user's package balance + history

### 5.6 Listings
- `GET /listings` — query: `?category=&q=&minPrice=&maxPrice=&city=&radius=&sort=&page=&limit=`
- `GET /listings/recommended` → personalized list
- `GET /listings/trending` → global trending
- `GET /listings/:id` — detail
- `POST /listings` — create (seller only, deducts credit)
- `PATCH /listings/:id` — edit
- `POST /listings/:id/mark-sold` — mark sold
- `POST /listings/:id/renew` — renew (deducts credit)
- `DELETE /listings/:id` — delete (soft)
- `POST /listings/:id/view` — increment view counter (debounced per user)

### 5.7 Chat
- `GET /chats` — list user's chats
- `POST /chats` — body: `{listingId}` → creates or returns existing chat
- `GET /chats/:id/messages` — paginated
- `POST /chats/:id/messages` — body: `{body, mediaUrl?}`
- WebSocket `/ws/chat` — real-time message delivery

### 5.8 Call
- `POST /call/request` — body: `{listingId}` → returns masked phone number to dial

### 5.9 Orders
- `POST /orders` — body: `{listingId}` → creates pending order
- `POST /orders/:id/accept` — seller action
- `POST /orders/:id/complete` — either party
- `POST /orders/:id/cancel` — body: `{reason}`
- `POST /orders/:id/rate` — body: `{rating, comment?}`
- `GET /me/orders/buying` and `GET /me/orders/selling`

### 5.10 Admin (consumed by Admin Panel — out of scope for THIS app, but APIs needed)
- `GET /admin/sellers/pending-approval`
- `POST /admin/sellers/:id/approve` and `.../reject`
- `GET /admin/listings/pending-review`
- `POST /admin/listings/:id/approve` and `.../reject`

---

## 6. Tech Stack & Folder Structure

### 6.1 Stack [ASSUMPTION — confirm with leads]

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (folder structure suggests this) |
| Backend | Node.js + Express/Fastify, microservices |
| Database | MongoDB (or Postgres — to confirm) |
| Cache | Redis |
| Object Storage | AWS S3 (images) |
| CDN | CloudFront |
| Auth | JWT (access 1h, refresh 30d) |
| Push Notifications | Firebase Cloud Messaging |
| SMS / OTP | MSG91 or Twilio (DLT-registered for India) |
| Payment Gateway | Razorpay (recommended) |
| KYC / Aadhaar | Karza / Signzy (TBD) |
| Call Masking | Exotel (recommended) |
| Real-time Chat | Socket.IO over WebSocket |
| Hosting | AWS (ECS/EKS) or DigitalOcean |
| Monitoring | Sentry (errors) + CloudWatch / Datadog (metrics) |
| Analytics | Firebase Analytics + Mixpanel |

### 6.2 Repository Layout (current)

```
one tap backend/
├── oneTapServer/
│   ├── microservices/   ← each service lives here (auth, listings, payments, chat...)
│   ├── shared/           ← shared types, utils, middleware
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
└── (mobile app lives in sibling folder: ../react native/)
```

### 6.3 Suggested Microservice Boundaries
- `auth-service` — login, OTP, JWT
- `user-service` — profile, interests, KYC
- `catalog-service` — categories, packages catalog
- `listing-service` — CRUD listings, search, recommendations, trending
- `payment-service` — package purchase, gateway integration
- `chat-service` — chat + WebSocket
- `notification-service` — push, SMS
- `admin-service` — admin endpoints
- `media-service` — image upload, processing, CDN

Each service: own MongoDB database, communicates via REST + message queue (RabbitMQ / Kafka — **[TBD]**) for async events (e.g., `listing.created` → notification-service).

---

## 7. Tasks by Role

### 7.1 Backend Developer
1. Set up shared auth middleware (JWT validation)
2. Build `auth-service` with Google + Phone OTP flows
3. Build `user-service` with profile and KYC integration
4. Build `catalog-service` with seed data (categories + packages)
5. Build `listing-service` with CRUD + search (use MongoDB text index or ElasticSearch)
6. Build `payment-service` with Razorpay integration + webhooks
7. Build `recommendation` and `trending` job runners (cron, write to Redis)
8. Build `chat-service` with Socket.IO
9. Build admin endpoints
10. Write integration tests against real DB (no mocks for DB layer)

### 7.2 Mobile Developer (React Native)
1. Set up navigation (React Navigation): Auth Stack + App Stack
2. Build login screens (Google + Phone OTP)
3. Build profile setup + category picker
4. Build Home (recommended + trending + categories strips)
5. Build product listing grid + filters
6. Build product detail screen
7. Build chat UI + Socket.IO client
8. Build "Become a Seller" flow with Aadhaar
9. Build "Buy Package" flow with Razorpay SDK
10. Build "Post Listing" form (config-driven by category)
11. Build "My Listings", "My Orders", "My Packages" screens
12. Implement push notification handling (FCM)
13. Implement deep links (e.g., `onetap365://listing/123`)

### 7.3 Designer
1. Finalize design system: colors, typography, spacing, components
2. Design all screens listed in §3 — high-fidelity in Figma
3. Define empty states, loading states, error states for every screen
4. Provide design tokens as JSON for mobile dev consumption
5. Animations / micro-interactions guide

### 7.4 QA
1. Write test plan covering acceptance criteria in §3
2. Build manual test cases for every user flow
3. Set up test devices: 2× Android (one low-end, one high-end), 2× iOS
4. Build automation suite for critical path: signup → become seller → buy package → post listing → another user buys
5. Performance testing: home screen < 2s, search < 1s
6. Regression suite for every release

### 7.5 DevOps
1. Set up dev / staging / prod environments
2. CI/CD via GitHub Actions: lint → test → build → deploy
3. Container registry + ECS/EKS cluster
4. MongoDB hosted (Atlas) with backup
5. Redis hosted (ElastiCache)
6. Monitoring + alerting (Sentry, CloudWatch)
7. Secrets management (AWS Secrets Manager)
8. Domain + SSL setup

### 7.6 Project Manager
1. Break down §3 features into JIRA epics + stories
2. Track dependencies (e.g., KYC vendor selection blocks Become Seller dev start)
3. Maintain risk register (top risks below)
4. Daily standup, weekly demo, fortnightly retro
5. Track [TBD] items and unblock weekly

---

## 8. Open Items (Not Blocking — Build with Assumption)

These are pulled from [OneTap365_Open_Questions.md](OneTap365_Open_Questions.md) — only items relevant to **THIS phase**:

| # | Topic | Current Assumption | Owner to Confirm | By |
|---|-------|--------------------|--------------------|----|
| 1 | KYC vendor for Aadhaar | Karza | Tech Lead | Week 1 |
| 2 | Payment gateway | Razorpay | Tech Lead | Week 1 |
| 3 | Call masking provider | Exotel | Tech Lead | Week 2 |
| 4 | Package pricing tiers | Per §3.3.2 table | Client | Week 1 |
| 5 | Email mandatory for sellers? | Yes | Client | Week 1 |
| 6 | Banned categories list | Standard list (weapons, drugs, adult, live animals, services-as-product) | Client + Legal | Week 2 |
| 7 | GST on packages | 18% | Client (CA) | Week 2 |
| 8 | Admin approval SLA | 24h sellers, 24h listings | Client (Ops) | Week 2 |
| 9 | Refund policy on packages | Non-refundable once activated | Client | Week 1 |
| 10 | Listing expiry default | 30 days | Client | Week 2 |
| 11 | Max active listings per seller | 50 | Client | Week 2 |
| 12 | Languages at launch | English + Hindi | Client | Week 2 |
| 13 | Geographic launch scope | Single city (TBD which) | Client | Week 1 |
| 14 | Database choice | MongoDB | Backend Lead | Day 1 |
| 15 | Real-time chat infra | Socket.IO self-hosted | Backend Lead | Day 1 |

**Out of Phase 1:** Services booking, Property Bidding, SIP, Vendor App, Admin UI (only APIs in Phase 1).

---

## 9. Glossary & Conventions

### 9.1 Terms

| Term | Definition |
|------|-----------|
| **Buyer** | Any logged-in user (default state) |
| **Verified Seller** | User whose Aadhaar is verified AND admin has approved |
| **Posting Package** | Bundle of listing credits sold for money |
| **Credit** | One unit consumed when posting one listing |
| **Listing** | A product posted by a seller |
| **Order** | A buyer's intent to purchase a listing via COD |
| **KYC** | Know Your Customer — Aadhaar verification process |
| **AUA / KUA** | Authentication / KYC User Agency — UIDAI-authorized entity |
| **PPI** | Prepaid Payment Instrument (RBI-regulated) |
| **DLT** | Distributed Ledger Technology — TRAI registry for SMS templates |
| **COD** | Cash on Delivery |

### 9.2 Coding Conventions
- All money stored as **integer paise** (`priceInPaise: 9900` for ₹99). Never floats.
- All timestamps in **UTC**; convert to IST in UI layer only.
- All API responses wrapped: `{success: bool, data?: any, error?: {code, message}}`
- Error codes: documented enum, not free-form strings.
- Logs: structured JSON, NEVER log PII (phone, Aadhaar, payment) in plaintext.
- Tests: integration tests against real DB; unit tests only for pure logic.

### 9.3 Git Conventions
- Branch: `feature/<ticket-id>-<short-name>`, `fix/<ticket-id>-<short-name>`
- Commit: `<type>(<scope>): <subject>` — types: feat, fix, refactor, test, docs, chore
- PR: must link ticket, must have reviewer from the same area, CI must pass

### 9.4 Definition of Done (per ticket)
- [ ] Acceptance criteria met
- [ ] Unit/integration tests written and passing
- [ ] Manual test on a real device (mobile) or via Postman (backend)
- [ ] Code reviewed and approved
- [ ] No new lint warnings
- [ ] No PII in logs
- [ ] Deployed to staging
- [ ] Documented if it changes a contract (API, schema, env var)

---

## 10. Top Risks (Phase 1)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Aadhaar/KYC vendor delays integration | M | H | Pick vendor in Week 1, sandbox by Week 2 |
| Razorpay onboarding takes 7–10 business days | H | H | Start KYC paperwork on Day 1 |
| Categories spec arrives late | H | M | Build dynamic form engine; categories = config |
| Spam listings flood at launch | M | H | Mandatory admin review, rate limit per user |
| Image storage costs balloon | M | M | Compress aggressively, set S3 lifecycle to Glacier after 90 days |
| WhatsApp/SMS DLT registration delay | M | M | Apply for DLT templates Day 1 (takes 1–2 weeks) |
| Push notification tokens go stale | L | M | Refresh on app open, retry queue on send failure |

---

## 11. Sprint Plan (4-week target — confirm with PM)

### Week 1 — Foundations
- Repo + CI/CD + envs ready
- Auth service (Google + Phone OTP) backend + mobile screens
- Categories seeded
- Design system finalized
- KYC vendor + payment gateway selected, paperwork started

### Week 2 — Seller & Packages
- Aadhaar + admin approval flow end-to-end
- Packages catalog + Razorpay purchase flow
- Profile + interests + location

### Week 3 — Listings & Discovery
- Post listing (with credits deduction + admin approval)
- Browse, search, filter
- Product detail
- Recommendations + trending (v1 algorithms)

### Week 4 — Engagement & Polish
- Chat (Socket.IO)
- Call masking
- Orders (COD intent flow)
- Notifications
- QA pass + bug fixes
- Staging release for client UAT

---

## 12. Where to Find Things

| What | Where |
|------|-------|
| This document | `/OneTap365_Consumer_App_Plan_v1.md` |
| Open questions to client | [OneTap365_Open_Questions.md](OneTap365_Open_Questions.md) |
| Backend code | `/oneTapServer/` |
| Mobile code | `../react native/` |
| API docs (live) | `[TBD — Swagger URL after backend stub]` |
| Figma | `[TBD — designer to share]` |
| JIRA | `[TBD — PM to share]` |
| Slack / Teams channel | `[TBD]` |

---

## 13. Who to Ask

| Question About | Ask |
|---------------|-----|
| Business / scope | Project Manager |
| Backend architecture / DB | Backend Lead |
| Mobile architecture | Mobile Lead |
| Design / UX | Design Lead |
| Aadhaar / payment / regulatory | Tech Lead + PM (escalate to client legal) |
| Deployment / envs | DevOps Lead |
| QA / bugs | QA Lead |

---

**End of Document v1.** This will be updated as [TBD] items are resolved. Every team member should re-read this at the start of each sprint.
