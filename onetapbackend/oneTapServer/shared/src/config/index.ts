export const ports = {
  gateway: Number(process.env.GATEWAY_PORT) || 3000,
  auth: Number(process.env.AUTH_PORT) || 3001,
  marketplace: Number(process.env.MARKETPLACE_PORT) || 3002,
  booking: Number(process.env.BOOKING_PORT) || 3003,
  investment: Number(process.env.INVESTMENT_PORT) || 3004,
  wallet: Number(process.env.WALLET_PORT) || 3005,
  chat: Number(process.env.CHAT_PORT) || 3006,
};

export const services = {
  auth: process.env.AUTH_SERVICE_URL || `http://localhost:${ports.auth}`,
  marketplace: process.env.MARKETPLACE_SERVICE_URL || `http://localhost:${ports.marketplace}`,
  booking: process.env.BOOKING_SERVICE_URL || `http://localhost:${ports.booking}`,
  investment: process.env.INVESTMENT_SERVICE_URL || `http://localhost:${ports.investment}`,
  wallet: process.env.WALLET_SERVICE_URL || `http://localhost:${ports.wallet}`,
  chat: process.env.CHAT_SERVICE_URL || `http://localhost:${ports.chat}`,
};

export const jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
export const nodeEnv = process.env.NODE_ENV || 'development';
export const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/oneTap';

export const betterAuth = {
  secret: process.env.BETTER_AUTH_SECRET || 'better-auth-secret',
  url: process.env.BETTER_AUTH_URL || services.auth,
};
