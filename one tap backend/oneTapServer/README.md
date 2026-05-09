# OneTap Microservices Architecture

A professional microservices setup using Express.js and NPM Workspaces.

## Architecture Overview

- **Gateway**: Entry point for all client requests. Handles routing and potentially auth/rate-limiting.
- **Auth Service**: Manages user authentication and authorization.
- **Marketplace Service**: Manages property listings and marketplace data.
- **Booking Service**: Handles reservations and booking logic.
- **Investment Service**: Manages investment portfolios and opportunities.
- **Wallet Service**: Handles financial transactions and user balances.
- **Chat Service**: Real-time communication using Socket.io.
- **Shared**: Common configurations, middlewares, and utilities.

## Port Assignments

| Service | Port |
|---------|------|
| Gateway | 3000 |
| Auth | 3001 |
| Marketplace | 3002 |
| Booking | 3003 |
| Investment | 3004 |
| Wallet | 3005 |
| Chat | 3006 |

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run all services:
   - Development (with nodemon): `npm run dev:all`
   - Production: `npm run start:all`

4. Run individual services:
   - `npm run dev:auth`
   - `npm run dev:gateway`
   - (and so on for marketplace, booking, investment, wallet, chat)

## Folder Structure

```
/microservices
  /gateway
  /auth-service
  /marketplace-service
  /booking-service
  /investment-service
  /wallet-service
  /chat-service

/shared
  /config
  /middlewares
  /utils
```

## Best Practices Implemented

- **NPM Workspaces**: Centralized dependency management.
- **Shared Package**: DRY principle for common logic (logger, error handling).
- **Environment Driven**: Clean separation of configuration.
- **Health Checks**: Standard `/health` endpoints for monitoring.
- **Security**: Helmet and CORS integrated by default.
- **Logging**: Structured logging with Winston.
