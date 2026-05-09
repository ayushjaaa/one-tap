# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY microservices/gateway/package.json ./microservices/gateway/
COPY microservices/auth-service/package.json ./microservices/auth-service/
COPY microservices/marketplace-service/package.json ./microservices/marketplace-service/
COPY microservices/booking-service/package.json ./microservices/booking-service/
COPY microservices/investment-service/package.json ./microservices/investment-service/
COPY microservices/wallet-service/package.json ./microservices/wallet-service/
COPY microservices/chat-service/package.json ./microservices/chat-service/

# Install dependencies for the whole workspace
RUN npm install

# Stage 2: Builder
FROM base AS builder
ARG SERVICE_NAME

# Copy all source files
COPY . .

# Build the shared library first
RUN npm run build -w shared

# Build the specific microservice
RUN npm run build -w microservices/${SERVICE_NAME}

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Copy built shared and microservice dist files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/microservices/${SERVICE_NAME}/dist ./microservices/${SERVICE_NAME}/dist
COPY --from=builder /app/microservices/${SERVICE_NAME}/package.json ./microservices/${SERVICE_NAME}/package.json

# Copy node_modules (production only is harder in monorepos, but we can copy all for now or optimize later)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set start script
CMD node microservices/${SERVICE_NAME}/dist/index.js
