# OneTap Consumer App — User Flow (Authentication & Onboarding)

This document walks through what a user actually sees and does when they open the OneTap consumer app for the first time, written in plain language so anyone on the team — engineering, design, QA, or product — can pick it up and understand exactly how the flow works end to end.

---

## 1. App Launch — Splash Screen

The moment the user opens the app, they land on the **Splash Screen**. This screen does two things in the background while the logo is showing:

1. It checks whether the user already has a valid session (i.e. they've logged in before and their token is still good).
2. It loads any startup configuration the app needs.

**Two possible paths from here:**

- **Already logged in?** → The app skips everything below and takes the user straight into the main app (Home screen).
- **Not logged in / first time?** → The user is taken to the **Welcome Screen**.

---

## 2. Welcome Screen — Login or Register

On the Welcome Screen, the user sees two clear options:

- **Login** — for users who already have an account.
- **Register** — for new users.

Whichever they tap, both paths support **two methods**:

- **Manual** (using name, email, password)
- **Continue with Google** (one-tap social sign-in)

---

## 3. Registration Flow (New Users)

If the user picks **Register**, they choose between **Manual** or **Google**.

### 3a. Manual Registration

The user goes through a short multi-step form:

1. **Step 1 — Name:** Enter full name.
2. **Step 2 — Email:** Enter email address.
3. **Step 3 — Password:** Create a password.
4. **Step 4 — Location:** (handled later in the flow — see Section 6.)

Each step validates the input before moving forward. If the email is already taken, we tell the user right away and offer to send them to Login instead.

### 3b. Continue with Google

The user taps "Continue with Google", picks their Google account, and the app pulls their name and email automatically. They skip the manual name/email/password steps entirely. They still have to complete phone verification and location (Sections 5 and 6).

---

## 4. Login Flow (Returning Users)

If the user picks **Login** instead, they again see two options:

- **Login with email and password** (manual)
- **Continue with Google**

Same two methods, but this time the system is matching against an existing account rather than creating a new one. Wrong password? Show a clear error. Account doesn't exist? Offer to register instead.

---

## 5. Phone Number & OTP Verification

After registration or login (regardless of which method they used), the user is taken to the **Phone Number Screen**.

### 5a. Enter Phone Number

The user types in their mobile number. We send a 6-digit OTP to that number via SMS.

### 5b. OTP Screen — How It Works

On the OTP screen, the user enters the code we just sent. This is where the flow gets stricter, so read carefully — this is our anti-abuse logic:

**The 2-minute window rule:**

- The user gets a **2-minute window** to enter the OTP.
- Inside that 2-minute window, they're allowed **up to 3 attempts** to enter the correct OTP.
- A countdown timer is visible on the screen so they know how much time is left.

**What happens when the window ends or attempts are used up:**

- If the user used all 3 attempts and got them wrong → they have to wait until the 2-minute window finishes, then they can tap **Resend OTP**.
- If the 2 minutes expire before they enter anything → **Resend OTP** becomes available.
- When they tap Resend, a new OTP is sent and a **fresh 2-minute window starts** with another 3 attempts.

**The block rule:**

- A user can go through this resend cycle, but if they keep failing — wrong OTP across multiple windows — we eventually cut them off.
- After repeated failed cycles within a short time, the user is **blocked for 24 hours** from requesting any more OTPs on that phone number with the same account info.
- After 24 hours, they can try again from scratch.

> **Note for the team:** the exact threshold (how many failed windows trigger the 24-hour block) needs to be locked down with the backend team — current draft is "if the user keeps failing across multiple resend cycles within roughly 22 minutes, block for 1 day." Please confirm the exact numbers before we ship.

### 5c. Successful OTP

Once the user enters the right OTP, the phone number is marked as verified and they move forward to the next screen.

---

## 6. Location Permission Screen

Right after phone verification, we ask for **location access**.

- **If the user allows location** → we capture their **latitude and longitude** in the background and proceed.
- **If the user denies location** → they **cannot move forward**. We show a screen explaining why we need it (e.g. "We need your location to show services near you") and ask them to enable it. There is no "skip" option here — location is required to use the app.

This is intentional: the whole product is location-based, so without coordinates there's nothing useful we can show the user.

---

## 7. Final Backend Call — Completing the Account

Once we have:

- A verified phone number
- The user's location (lat/lng)
- Their basic profile info (name, email, and either password or Google identity)

…the app makes a call to the **backend login/register API**, sending everything together:

- Verified phone number
- Latitude and longitude
- User profile details

The backend creates the account (or links the session for an existing user), returns an auth token, and the app stores that token securely on the device.

The user is then dropped into the **Home Screen** and the onboarding is complete. From here on out, every time they open the app, the Splash Screen check (Section 1) will recognize them and skip straight to Home.

---

## Quick Visual Summary

```
Splash Screen
   │
   ├── Already logged in? ──► Home
   │
   └── Not logged in
          │
          ▼
   Welcome Screen ──► Login or Register
          │
          ├── Manual: Name → Email → Password
          └── Continue with Google
          │
          ▼
   Phone Number Screen ──► Enter number
          │
          ▼
   OTP Screen
   (3 attempts per 2-min window, resend, eventual 24h block on abuse)
          │
          ▼
   Location Screen
   (must allow — no skip)
          │
          ▼
   Backend API call (phone + location + profile)
          │
          ▼
   Home Screen ✅
```

---

## Open Questions for the Team

These need confirmation before we finalize the build:

1. **Exact OTP block threshold** — how many failed 2-min windows before the 24-hour block kicks in? The draft says "around 22 minutes of failures."
2. **Google sign-in + phone verification** — Google users still need to verify a phone number, correct? Confirming this isn't skipped.
3. **Location denial copy** — what do we show when a user blocks location at the OS level (not just denies in-app)? They may need to be sent to system settings.
4. **Token storage** — confirm we're using secure storage (Keychain on iOS, EncryptedSharedPreferences on Android) for the auth token.

---

*Share this with anyone joining the project — it should give them the full picture of how a brand-new user gets from "just opened the app" to "ready to use it."*
