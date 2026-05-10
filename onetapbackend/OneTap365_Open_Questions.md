# OneTap365 Consumer App — Open Questions & Clarifications

**Project ID:** Pr-2026-00012
**Source Document:** Client meeting notes, 17 Apr 2026, 4 PM
**Document Owner:** [Team Lead Name]
**Status:** AWAITING CLIENT RESPONSE
**Last Updated:** 2026-05-03

---

## How to Use This Document

This document contains every question that must be answered by the client before development can proceed without making risky assumptions. Each question is tagged with:

- **Priority:** P0 (blocker — cannot start), P1 (blocker for that feature), P2 (can start with assumption, confirm later)
- **Owner:** Who on the client side likely needs to answer (Business / Legal / Tech / Design / Operations)
- **Impact if unanswered:** What we'd have to assume, and what rework risk that creates

Please return this document with answers inline under each question, OR schedule a 90-minute call to walk through it.

---

## 0. CRITICAL — Regulatory & Legal (P0 BLOCKERS)

These questions must be answered before ANY development begins on the SIP and Property Bidding features. Building these without legal clarity exposes the client to SEBI / RBI / MCA regulatory action.

### 0.1 SIP Investment Feature
**Owner:** Legal / Business

1. The SIP feature collects monthly money from users for 4 years and shows expected returns. Under Indian law, this is a **collective investment scheme** and is regulated by **SEBI**. Is the client registered as:
   - A SEBI-registered Investment Advisor, OR
   - An AMFI-registered mutual fund distributor, OR
   - A SEBI-registered Portfolio Manager, OR
   - An NBFC-P2P licensed by RBI, OR
   - Operating under any other relevant license?
2. Who is the **custodian** of the SIP money? (A SEBI-registered custodian is mandatory.)
3. Where is the SIP money invested? (Mutual funds? Real estate? Fixed deposits? Internal pool?)
4. Who guarantees the 8–12% returns? Is this guaranteed or indicative? **Note: Guaranteed returns on non-fixed-income products are illegal under SEBI rules.**
5. Is there a Scheme Information Document (SID) and Key Information Memorandum (KIM) approved by SEBI?
6. What is the redemption / exit mechanism before 4 years? Penalty structure?
7. Who handles KYC for SIP? (CKYC, e-KYC via Aadhaar OTP, video KYC?)

### 0.2 Property Bidding & Investment
**Owner:** Legal / Business

8. Property bidding with promised returns is treated as a **Collective Investment Scheme (CIS)** under SEBI Act. Does the client have a CIS license?
9. Are users buying **fractional ownership** of property, or just "investing" without ownership rights?
10. Who legally owns the property? (SPV? Trust? Client company?)
11. How are returns generated and distributed? (Rental? Resale appreciation? Both?)
12. What is the exit mechanism for a winning bidder who wants to sell their stake?
13. Is the property title verified by an independent legal team before listing?
14. What happens if the property doesn't generate the promised return range?

### 0.3 Wallet & Money Handling
**Owner:** Legal / Tech

15. The ₹20,000 bidding wallet — is this a **Prepaid Payment Instrument (PPI)** under RBI regulation? PPI issuance requires an RBI license.
16. Will the client use a third-party wallet provider (Razorpay, Cashfree, PhonePe), or build their own? (Building own wallet without RBI license = illegal.)
17. Is the wallet money held in an **escrow account** with a scheduled bank?
18. What is the maximum wallet balance allowed? (RBI has caps on PPIs without full KYC.)

### 0.4 Aadhaar Verification
**Owner:** Legal / Tech

19. Aadhaar usage requires **UIDAI authorization** via a registered AUA/KUA. Does the client have this, or will we use a third-party (Karza, Signzy, IDfy, Digio)?
20. What data is stored after Aadhaar verification? (Storing Aadhaar number/photo without proper masking is a **₹1 crore penalty** under Aadhaar Act.)
21. Is Aadhaar mandatory for sellers only, or buyers too?

---

## 1. User Roles & Authentication

### 1.1 User Types
**Owner:** Business**

22. The doc mentions **Consumer**, **Vendor**, and **Admin** apps — but inside the Consumer App, a user can be a *buyer*, *seller*, *bidder*, and *SIP investor*. Are these all the same account with different permissions, or separate sub-accounts?
23. Can a Vendor (from Vendor App) also be a Consumer? Same login or separate?
24. Is there a **sub-admin / moderator** role for product approvals?
25. Can one phone number / Aadhaar register multiple accounts?

### 1.2 Login Methods
**Owner:** Business / Tech

The doc lists 5 login options confusingly. Please clarify:

26. **Primary login** — is it Google Sign-In OR Phone OTP? (Pick one as default.)
27. Is Google Sign-In + Phone OTP **both required** or **either/or**?
28. Is **manual login** = email/password? If yes, is email mandatory? Is email verification required?
29. Is Aadhaar verification mandatory at signup, or only when user wants to sell / bid / invest?
30. "Admin verification for consumers who want to sell" — what does the admin verify? (Aadhaar? Address proof? Business proof?) What is the SLA for approval?
31. What happens if a user fails admin verification? Can they re-apply?
32. Is there a **forgot password / account recovery** flow? Via what channel?
33. Is multi-device login allowed? Can a user be logged in on 2 phones simultaneously?
34. Session duration? Auto-logout policy?
35. Is biometric (fingerprint / Face ID) login supported?

### 1.3 Profile Fields
**Owner:** Business / Design

36. Mandatory vs optional fields for: Name, Phone, Email, Location, DOB, Gender, Profile Photo?
37. "Location" — is it (a) GPS-detected, (b) manually entered city, (c) full address with pincode, or (d) all three?
38. Can the user change their phone number later? Email? Name? (Affects KYC re-verification.)
39. Is there a profile completeness % shown to users?

---

## 2. Categories & Personalization

### 2.1 Category Structure
**Owner:** Business / Content

40. How many top-level categories? (Doc lists Properties, Electronics, Vehicles, Jobs, Services — final?)
41. How deep does nesting go? (Doc shows 3 levels: Services → Home Services → Cleaning. Is 3 the max?)
42. Will the client provide the **complete category tree** as a spreadsheet/JSON? When?
43. Can categories be added/removed by Admin after launch without app update?
44. Can a single product/service belong to multiple categories?
45. Are categories the same in **all cities/states**, or location-specific?

### 2.2 Personalization & Recommendations
**Owner:** Business / Tech

46. "Personalized content" — based on what? (Selected interests only? Browsing history? Purchase history? Location?)
47. What recommendation engine? (Build custom? Use a service? Manual curation by admin?)
48. "Trending products" — how is "trending" calculated? (Most viewed? Most bought? Manually flagged?)
49. Time window for trending? (Last 24h / 7d / 30d?)
50. Can the user **change their interests** later?
51. If a user selects no interests, what is shown? (Popular items? Random? Empty state?)

---

## 3. Book a Service

### 3.1 Service Discovery
**Owner:** Business / Design

52. Default sort order on service listing page? (Distance? Rating? Price? Newest?)
53. Filter options needed: confirm exact list. Doc says "Category, Location, Other preferences" — what are "other preferences"? (Price range? Availability? Rating? Vendor verified?)
54. Search — full-text search across what fields? (Service name? Description? Vendor name? Category?)
55. Search must support typos / fuzzy matching? Hindi/regional language search?
56. Service radius — show services within X km? Configurable by user?
57. What if no services match the user's location? (Show nearest? Show empty state? Notify when available?)

### 3.2 Service Detail Page
**Owner:** Design / Business

58. "Vendor's previous work / portfolio" — what format? (Image gallery? Video? PDF? External links?)
59. Are there **reviews and ratings** for vendors? (Doc mentions "rating of product" but not vendor.) Star rating? Written review? Photo upload in review?
60. Can users see **past bookings / completed orders** of the vendor?
61. Pricing display — fixed price? Starting from? Hourly? Negotiable? Quote-on-request?
62. Is there a **booking calendar** / time slot system, or just chat-and-arrange?
63. Service area shown on map?

### 3.3 Booking Flow
**Owner:** Business

64. Is there an **actual booking transaction** in the app, or does the user just chat/call the vendor and arrange offline?
65. If booking is in-app: payment timing — at booking? After service? Partial advance?
66. Cancellation policy? Refund policy?
67. Is there a **booking confirmation** sent to vendor? How? (Push notification? SMS? Email?)
68. Booking history visible to user?

### 3.4 Chat & Call
**Owner:** Tech / Business

69. **Chat:** real-time (Socket.IO / Firebase) or async (poll-based)?
70. Chat features: text only, or images/videos/voice notes/location sharing?
71. Are chats **moderated** for abuse / contact info sharing? Auto-block of phone numbers in chat?
72. Chat history retention period? Can users delete chats?
73. **Call:** direct phone call (reveals real number) OR **call masking** (via Exotel/Twilio/Knowlarity, hides real number)?
74. If call masking: who pays the call cost?
75. Is call recording required? (Legal: requires consent.)
76. Can vendor block/report a user? Vice versa?
77. Are chats end-to-end encrypted?

---

## 4. Post a Listing (Sell Product)

### 4.1 Posting Credits / Packages
**Owner:** Business

78. What are the **package tiers**? (E.g., 5 posts ₹X, 20 posts ₹Y, 100 posts ₹Z?)
79. Do credits **expire**? After how long?
80. Are there **free posts** for new users (e.g., first 3 free)?
81. Do credits differ by category? (E.g., posting a property costs more credits than electronics?)
82. Are credits **refundable** if a listing is rejected by admin?
83. What payment methods for buying credits? (UPI, card, wallet?)
84. Is there a **subscription model** (unlimited posts for ₹X/month) instead of/alongside credits?
85. What happens to remaining credits if user account is suspended?

### 4.2 Listing Creation
**Owner:** Business / Design

86. Minimum / maximum number of images per listing? Image size/format limits?
87. Is **video upload** allowed? Length limit?
88. Mandatory fields per category? (E.g., for Vehicles: brand, model, year, KMs driven, fuel type — confirm full list per category.)
89. Is there a **draft save** feature? Auto-save?
90. Title / description character limits?


### 4.3 Listing Approval & Moderation
**Owner:** Operations / Business

92. Are all listings **manually reviewed by admin** before going live? Or auto-published?
93. SLA for approval? (E.g., reviewed within 24 hours.)
94. What are the **rejection reasons**? (Banned items list? Inappropriate content? Wrong category?)
95. Banned categories? (E.g., weapons, drugs, adult content, live animals — please provide complete list.)
96. Can a rejected listing be **edited and resubmitted**? Does it cost another credit?
97. Listing **expiry**? (E.g., auto-expires after 30 days?) Can user renew?
98. Can user **edit a live listing** (price, description)? Does that re-trigger approval?
99. Can user **boost / promote** a listing for visibility (paid)?
100. Maximum number of **active listings** per user?

### 4.4 Listing Lifecycle
**Owner:** Business

101. How does a user mark a listing as **sold**? Does the system auto-detect from in-app purchase?
102. Are sold listings visible historically, or removed from listing pages?
103. Does the seller get **leads** (list of interested buyers)?

---

## 5. Buy Products

### 5.1 Discovery
**Owner:** Business / Design

104. Is product browsing **location-based** like services? (E.g., only show products from sellers in same city?)
105. Default sort order? (Newest? Price low-high? Distance? Relevance?)
106. Can users **save / wishlist** products?
107. Recently viewed list?

### 5.2 Product Page
**Owner:** Design / Business

108. "Rating of product" — how is a used/individual product rated? Is this seller rating or product rating?
109. Can buyer ask the seller a **question** before buying? Public Q&A or private chat?
110. Are there **reviews from previous buyers** of the same item? (Hard for unique items.)

### 5.3 Purchase Flow
**Owner:** Business / Tech / Operations

111. Doc says "Cash on Delivery only" and "Buyer pays no extra charges." But how does the product **get delivered**?
   - Buyer picks up in person?
   - Seller delivers themselves?
   - Third-party logistics (Delhivery, Shiprocket, Porter)?
   - If logistics: who pays delivery charges?

113. How does the system **confirm** the transaction completed? (Buyer marks received? OTP at handover?)
114. Is there a **return / refund** policy? In-app dispute resolution?
115. Does the seller get notified of every interest / view / purchase intent?
116. Is there an **escrow** for payment? (If buyer pays online, money held until delivery confirmed?)
117. Does the platform take any **commission** on a sale? (Doc says no extra charges to buyer — what about seller?)

### 5.4 Payment Methods
**Owner:** Business / Tech

118. Doc says **COD only** for product purchases — but the app also needs:
   - Wallet top-up (₹20,000) for bidding
   - Posting credits purchase
   - Monthly SIP debit
   Will online payments (UPI, card, netbanking) be enabled for these flows? Which payment gateway? (Razorpay / Cashfree / PhonePe / PayU?)
119. Is **UPI Autopay / e-NACH mandate** required for SIP auto-debit?
120. International payments needed? (For NRI users investing in property?)
121. GST handling — is the platform a marketplace (B2C2C)? Who issues GST invoices?

---

## 6. Property Bidding

### 6.1 Eligibility & Wallet
**Owner:** Business / Legal

122. ₹20,000 wallet — is this **per bid** or **one-time** for all bids?
123. Can a user place **multiple bids on multiple properties simultaneously** with one ₹20,000?
124. If multiple bids allowed: does each bid lock ₹20,000 separately?
125. KYC required before wallet top-up? (RBI rules: yes, even for ₹20K.)

### 6.2 Bid Mechanics
**Owner:** Business

126. Is bidding **English auction** (highest bid wins, visible to all), **sealed bid** (everyone submits once, highest wins), or **Dutch auction** (price drops over time)?
127. Bid duration per property? (24 hours? 7 days? Configurable per property?)
128. Minimum bid increment? (E.g., next bid must be ₹10,000 higher.)
129. Is there a **starting bid / reserve price**?
130. **Anti-sniping** — does bid duration extend if a bid is placed in the last X minutes?
131. Is the user shown **other users' bids** in real-time? Or only highest bid amount?
132. Can a user **withdraw a bid** once placed? Penalty?
133. What is the **investment range**? (Minimum and maximum bid amount per property — set by admin?)

### 6.3 Outcome
**Owner:** Business / Operations

134. Winner is determined how — single highest bid, or top N bidders all win fractional shares?
135. After winning: how does the user pay the **remaining amount** (bid amount - ₹20,000)? Timeline?
136. What if the winner **fails to pay** the remaining amount? (Wallet forfeited? Second-highest bidder gets it?)
137. Losing bidders — when is their ₹20,000 unlocked? Immediately after auction close?
138. Does the user get **physical documents** (share certificate, sale deed)? Digital? Both?
139. **Returns distribution** — how often? (Monthly? Quarterly? Annually? On exit?)
140. Where do returns get credited? (Bank account directly? Wallet? Re-invested?)

### 6.4 Property Listing
**Owner:** Business / Operations

141. Who lists properties — only admin, or vendors too?
142. What information is shown per property?
   - Photos, videos, drone footage?
   - Location with Google Maps embed?
   - Documents (title deed, NOC, RERA registration)?
   - Inspection reports?
143. Is property **RERA-registered**? RERA number displayed?
144. Builder / developer details?
145. Can users do a **physical site visit**? Booked through app?

---

## 7. SIP Investment

### 7.1 Plan Setup
**Owner:** Business / Legal

146. SIP "investment range (min & max)" — what's the actual range? (E.g., ₹500/month to ₹50,000/month?)
147. Can user **change SIP amount** mid-tenure? Increase only? Decrease allowed?
148. Why is the auto-debit window restricted to **5th–10th of month**? Can user pick any specific date in that range, or system picks?
149. Tenure is fixed at **4 years** — is this configurable? Can user pick 1/2/3/5/10 years?
150. Multiple parallel SIPs per user allowed?

### 7.2 Auto-Debit Mandate
**Owner:** Tech / Legal

151. Auto-debit method: **UPI Autopay** (max ₹15,000/month, ₹1 lakh with 2FA), **e-NACH** (any amount, takes 7+ days to set up), or **Standing Instruction on card**?
152. What happens during **mandate setup failure**? (Retry flow? Manual payment fallback?)
153. Mandate cancellation by user — flow?

### 7.3 Missed Payments
**Owner:** Business / Legal

154. Doc says "rules/penalties can apply (as per system logic)" — **please define exact rules**:
   - Grace period after due date?
   - Late fee amount?
   - How many consecutive misses before SIP is paused?
   - How many before SIP is terminated?
   - On termination: is invested amount returned, forfeited, or locked till maturity?
155. Retry attempts on bank failure (insufficient funds, mandate revoked)?
156. SMS / email / push notification cadence for reminders and failures?

### 7.4 Returns & Maturity
**Owner:** Business / Legal

157. How are returns calculated? (Fixed rate? Market-linked? NAV-based?)
158. Where can the user **track returns** in the app? (Dashboard with current value?)
159. Maturity payout — credited to bank account or wallet? Auto-renewal option?
160. **Premature withdrawal** allowed? Penalty structure?
161. Tax implications — does the platform issue Form 16A / capital gains statement?

---

## 8. Wallet System (Across Features)

162. Are there **multiple wallets** (bidding wallet ₹20K + general wallet for credits + SIP balance), or one unified wallet?
163. Can wallet money be used **across features**? (E.g., posting-credit purchase paid from bidding wallet?)
164. **Withdrawal flow:** to which bank account? Verification of bank account? IFSC, account number entry?
165. Withdrawal SLA? (Instant? T+1? T+3?)
166. Withdrawal charges? Minimum withdrawal amount?
167. Wallet transaction history — exportable as PDF/Excel for tax purposes?
168. **Wallet PIN / biometric** required for transactions?
169. Daily / monthly transaction limits?

---

## 9. Notifications

170. What channels: **Push notifications**, **SMS**, **email**, **WhatsApp**?
171. Mandatory notification events (please confirm full list):
    - New message from vendor / buyer
    - Listing approved / rejected
    - Bid outpaced (someone bid higher)
    - Bid won
    - SIP debit successful / failed
    - Wallet credit / debit
    - Order status changes
    - Promotional offers
172. Can user **customize notification preferences** per channel per event?
173. SMS provider? (MSG91, Twilio, Gupshup?) DLT-registered templates needed (TRAI rules).
174. Push notification provider? (Firebase Cloud Messaging?)
175. WhatsApp Business API needed? (Requires Meta-approved templates.)

---

## 10. Search, Filters, Sort

176. Is there a **global search bar** at the top of the app (across services, products, properties), or per-section search?
177. Search history saved? Recent searches shown?



---

## 11. Admin & Moderation (impacts Consumer App UX)

181. What can a user **report**? (Listings, users, vendors, messages?) Report reasons?
182. SLA on report resolution?
183. If a user is **banned**, what message do they see? Appeal flow?
184. Are there **community guidelines / terms** the user must accept? Where shown?
185. Age restriction? (18+? Minor accounts allowed with guardian?)

---

## 12. Localization & Accessibility

186. **Languages supported?** (English only? Hindi? Regional — Tamil, Telugu, Bengali, Marathi, Gujarati, etc.?)
187. Is the app **RTL-ready** for any language?
188. **Currency** — INR only? Any other?
189. Accessibility — screen reader support? Larger text mode? Color blindness considerations?
190. Dark mode required?

---

## 13. Technical & Non-Functional Requirements

### 13.1 Platforms
**Owner:** Business / Tech

191. Mobile platforms — **Android only, iOS only, or both**?
192. Minimum supported OS versions? (Android 8+? iOS 13+?)
193. Tablet support, or phone only?
194. Is there a **web version** for the consumer? (Even view-only?)
195. Native (Swift/Kotlin) or cross-platform (React Native / Flutter)?
   - Note: Existing folder structure suggests **React Native** — please confirm.

### 13.2 Scale & Performance
**Owner:** Business / Tech

196. Expected **users at launch**? **6 months out**? **12 months out**?
197. Expected **concurrent users** during peak (e.g., during a popular property auction close)?
198. Expected **listings volume**? Photos per listing × volume = storage estimate.
199. Geographic scope at launch — single city? State? Pan-India?
200. Target app size (MB)?
201. Acceptable load time per screen?

### 13.3 Hosting, DevOps, Security
**Owner:** Tech

202. Cloud provider preference? (AWS / GCP / Azure / DigitalOcean / on-prem?)
203. Data residency — must data stay in India? (DPDP Act 2023 implications for sensitive personal data.)
204. Backup & disaster recovery RTO/RPO targets?
205. Penetration testing required pre-launch? By whom?
206. **DPDP Act compliance** — privacy policy, consent management, data deletion request flow?
207. Data retention policy — how long is user data kept after account deletion?
208. PCI-DSS compliance (if storing card data — typically handled by payment gateway)?

### 13.4 Analytics
**Owner:** Business / Tech

209. Analytics platform? (Google Analytics / Mixpanel / Amplitude / Firebase / CleverTap?)
210. Crash reporting? (Sentry / Crashlytics?)
211. Session replay tools? (FullStory, Hotjar?)
212. Marketing attribution? (AppsFlyer, Branch?)
213. What KPIs does the business want to track? (DAU/MAU, conversion funnels, GMV, take rate, churn?)

### 13.5 Third-Party Services
**Owner:** Tech / Business

Please confirm/select for each:
214. **Maps & geolocation:** Google Maps / Mapbox / OpenStreetMap?
215. **Image storage / CDN:** AWS S3 + CloudFront / Cloudinary / Firebase Storage?
216. **Payment gateway:** ?
217. **SMS gateway:** ?
218. **Email service:** SendGrid / SES / Mailgun?
219. **Push notifications:** FCM / OneSignal?
220. **Chat infrastructure:** Build custom (Socket.IO) / Firebase / Sendbird / GetStream?
221. **Call masking:** Exotel / Knowlarity / Twilio?
222. **KYC provider:** Karza / Signzy / IDfy / Digio / HyperVerge?
223. **Aadhaar verification provider:** ?
224. **Bank account verification (penny-drop):** ?

---

## 14. Business Operations (off-app, but affects design)

225. **Customer support** — in-app chat with support? Phone helpline? Email? Hours of operation?
226. **Vendor support** vs **consumer support** — same team or separate?
227. **Onboarding** — is there an in-app tutorial / walkthrough for first-time users?
228. **Referral program** — refer-a-friend with rewards? If yes, reward structure?
229. **Loyalty / reward points**?
230. **Coupons / promo codes**? Who creates them? Where applied (checkout, wallet top-up, SIP)?
231. **Marketing tools** — does business need to send broadcast push notifications / in-app banners? Admin tool for that?

---

## 15. Content & Legal Pages

232. Who provides the content for: **Terms of Service**, **Privacy Policy**, **Refund Policy**, **Bidding Terms**, **SIP Scheme Document**, **About Us**, **FAQ**?
233. By when?
234. Multi-language versions of legal pages required?

---

## 16. Integrations with Vendor App and Admin Panel

235. Are the **Vendor App and Admin Panel scope** finalized? (We need to know shared API contracts.)
236. Will all three apps share **one backend / database**, or separate microservices? (Folder name `oneTapServer/microservices` suggests microservices — confirm boundaries.)
237. Real-time sync needed between apps? (E.g., when vendor accepts a booking, consumer sees it instantly.)
238. Single sign-on across apps?

---

## 17. Timeline, Budget, Team

239. **Target launch date?** Hard deadline or flexible?
240. **MVP vs Full scope** — which features are MUST-HAVE for v1, which are nice-to-have for v2?
241. **Team composition expected** — how many backend, frontend, mobile, QA, devops, design?
242. **Budget envelope** — does it allow for premium third-party services (e.g., Sendbird is expensive at scale vs. self-hosted Socket.IO)?
243. **Phased rollout** strategy — single city beta first, or pan-India launch?
244. Will there be a **separate testing environment** with seed data, accessible to client for review?

---

## 18. Out of Scope — Please Confirm

To avoid scope creep, we want to confirm what is **NOT** included. Please mark any of these as IN-SCOPE if expected:

245. ☐ In-app video calling (vendor demos, property tours)
246. ☐ Live streaming (live property auctions)
247. ☐ AR/VR property tours
248. ☐ AI-based price suggestions for listings
249. ☐ Chatbot for support
250. ☐ Insurance products (motor, health, property)
251. ☐ Loan / credit products
252. ☐ Crypto / digital assets
253. ☐ Job application / resume features (Jobs category — is it a listing only, or a full job portal with applications?)
254. ☐ Vehicle inspection booking / RC transfer assistance
255. ☐ Home loan / property registration help
256. ☐ Social features — follow other users, profile pages, activity feeds
257. ☐ Gamification — badges, leaderboards
258. ☐ Affiliate / influencer program

---

## 19. Specific Sections Needing Re-Discussion

The following sections of the original document are too vague to estimate or build from. We need a dedicated session on each:

| # | Topic | Why a Session Is Needed | Suggested Duration |
|---|-------|-------------------------|--------------------|
| A | SIP feature end-to-end | Regulatory + product flow + missed payment handling | 90 min, with legal counsel |
| B | Property bidding end-to-end | Regulatory + auction mechanics + payout flow | 90 min, with legal counsel |
| C | Wallet & payments | Multiple flows interact (COD, SIP debit, bid wallet, posting credits) | 60 min |
| D | Seller verification & moderation | Operational SLA + admin tooling | 45 min |
| E | Notifications matrix | Per event, per channel, per role | 45 min |
| F | Category tree | Need final spreadsheet from client | Async, by [date] |
| G | Branding, design system, UX | Logo, colors, typography, reference apps client likes | 60 min with design |

---

## 20. Suggested Next Steps

1. Client to **fill answers inline** in this document and return by **[DATE — suggest 7 working days]**.
2. Schedule **clarification call** for any answers needing discussion.
3. Engage **legal counsel** for sections 0.1, 0.2, 0.3, 0.4 — these are the highest-risk items. Without legal sign-off, we recommend NOT building SIP / Bidding in v1, and launching with marketplace + services first.
4. Once answers are received, the team will produce:
   - **Functional Spec Document** (per-feature specs with acceptance criteria)
   - **Technical Architecture Document** (system diagrams, API contracts, data model)
   - **Project Plan** (milestones, sprints, dependencies)
   - **Risk Register**

---

## Appendix A — Document Weaknesses Identified in Original Client Doc

For client awareness, the original document had these gaps that this Q&A aims to close:

1. **Contradicting login methods** — five options listed without hierarchy.
2. **Undefined seller onboarding flow** — "admin verification" mentioned without process.
3. **Undefined credit/package economics** — "number of post" referenced repeatedly with no pricing.
4. **Payment contradictions** — "COD only" cannot fund SIP debit or wallet top-up.
5. **Bidding mechanics absent** — no duration, increment, anti-sniping, dispute rules.
6. **Regulatory blind spots** — SIP and property bidding likely require SEBI license.
7. **Vague penalty rules** — "as per system logic" is not a spec.
8. **Missing non-functional requirements** — no scale, SLA, security, accessibility targets.
9. **No data model or API surface** — cannot estimate effort.
10. **No out-of-scope statement** — high scope-creep risk.
11. **Spelling/grammar issues** in source — please share authoritative final version after this Q&A.

---

**End of Document.** Please return with answers, or schedule clarification call. Sections 0.1–0.4 are blockers — we need answers there before any SIP / bidding work begins.
