# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
source/
  app/source/       # React Native mobile app (iOS + Android)
  backend/source/   # NPM workspaces: 7 microservices + 1 shared package
  temp/db/          # Scratch DB tooling
```

---

## Frontend — `app/source/`

### Commands
Run all commands from `app/source/`.

```bash
npm start                   # Metro bundler
npm run android             # Run on Android emulator (dev env)
npm run ios                 # Run on iOS simulator (dev env)
npm run android:staging     # Release build, staging env
npm run android:prod        # Release build, production env
npm run lint                # ESLint
npm run format              # Prettier
npm test                    # Jest
npm test -- --testPathPattern=MyFile   # Single test file
```

iOS first-time setup:
```bash
bundle install
bundle exec pod install     # Re-run after any native dep change
```

### Environment
Env files: `.env.development`, `.env.staging`, `.env.production` (via `ENVFILE=` prefix in scripts).  
Accessed in code via `react-native-config` → `src/config/env.ts`.

Key vars: `API_URL`, `ENV`, `USE_MOCK_OTP`, `GOOGLE_WEB_CLIENT_ID`.  
On Android emulator the dev API defaults to `http://10.0.2.2:3001/api/v1`; on iOS it defaults to `http://localhost:3001/api/v1`.

### Path Aliases
`@/` resolves to `src/`. Configured in `babel.config.js` via `babel-plugin-module-resolver`.

```ts
import { Button } from '@/components/common/Button';
import { useSendOtpMutation } from '@/api/authApi';
```

### State Management Architecture

**Rule:** Server data → RTK Query (`src/api/`). Client-only data → Redux slice (`src/store/`).

`src/api/baseApi.ts` is the single RTK Query instance. All feature APIs inject endpoints into it:
```ts
export const authApi = baseApi.injectEndpoints({ endpoints: ... });
```

The store (`src/app/store.ts`) has a global `authErrorMiddleware` that intercepts any 401 RTK Query rejection, clears the Keychain token, and dispatches `logout()` — no per-endpoint handling needed.

**4 Redux slices** (all client-only):
- `authSlice` — user, token, isLoggedIn, hasOnboarded, isHydrated
- `locationSlice` — current GPS location
- `cartSlice` — cart items
- `walletSlice` — bidding balance, post credits

**Token storage:** `react-native-keychain` (`src/services/secureStorage.ts`) for the auth token. `react-native-mmkv` (`src/services/storage.ts`) for non-sensitive data (user object, onboarding flag).

### Navigation Structure

`RootNavigator` is the top-level decision tree:
1. Bootstrap not done (or store not hydrated) → `SplashScreen`
2. First launch → `OnboardingScreen`
3. Not logged in → `AuthNavigator`
4. Logged in → `MainNavigator`

`AuthNavigator` wraps everything in `SignupProvider`. The 4-step signup flow (`SignUpStep1`–`SignUpStep4`) accumulates data in `SignupContext` before making a single POST on the last step.

---

## Backend — `backend/source/`

### Commands
Run all commands from `backend/source/`.

```bash
npm run dev:all         # Start all 7 services concurrently
npm run dev:gateway     # Gateway only (port 3000)
npm run dev:auth        # Auth service only (port 3001)
npm run dev:marketplace # port 3002
npm run dev:booking     # port 3003
npm run dev:investment  # port 3004
npm run dev:wallet      # port 3005
npm run dev:chat        # port 3006
npm run build:all       # TypeScript compile all workspaces
```

Individual service dev uses `nodemon --exec ts-node -r tsconfig-paths/register`.

### Microservices & Request Flow

All mobile traffic hits the **Gateway** (port 3000), which proxies to the appropriate service:

- `POST/GET /api/auth/*` → auth-service (3001)
- `GET/POST /api/v1/marketplace/*` → marketplace-service (3002)
- `GET/POST /api/v1/booking/*` → booking-service (3003)
- `GET/POST /api/v1/investment/*` → investment-service (3004)
- `GET/POST /api/v1/wallet/*` → wallet-service (3005)
- `GET/POST /api/v1/chat/*` → chat-service (3006)

Gateway applies rate limiting (100 req / 15 min / IP) before proxying.

### Shared Package (`@onetap/shared`)

Imported by every service. Located at `backend/source/shared/`. Exports:
- `ports` / `services` — port numbers and service URLs (env-overridable)
- `mongoUri`, `jwtSecret`, `betterAuth` — common config
- `logger` — Winston logger
- `errorHandler` — Express error middleware (always the last `app.use`)
- `ApiError` — throw with `statusCode` + message; caught by `errorHandler`
- `ApiResponse` — standard success response shape
- `database` — MongoDB connection utility

### Authentication

Auth uses the `better-auth` library (not raw JWT). The `better-auth` instance is configured in `auth-service/src/lib/auth.ts` with:
- Email+password
- Google OAuth
- `bearer()` plugin for token extraction
- MongoDB adapter (shares the same Mongoose connection)

`authMiddleware.ts` validates requests by calling `auth.api.getSession()` (reads the bearer token from headers). On success it attaches `req.user` and `req.session`.

User location is stored as a nested GeoJSON `{ type: "Point", coordinates: [lng, lat] }` field inside the user document. The `databaseHooks` in `lib/auth.ts` transform flat `location_*` fields into this nested structure before DB writes.

### Environment (Backend)

Each service reads from its own `.env`. Key vars:
```
MONGO_URI=mongodb://localhost:27017/oneTap
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
Port overrides: `GATEWAY_PORT`, `AUTH_PORT`, `MARKETPLACE_PORT`, etc.  
Service URL overrides: `AUTH_SERVICE_URL`, `MARKETPLACE_SERVICE_URL`, etc.
