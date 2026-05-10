import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ports, logger, errorHandler, connectDatabase, mongoUri } from '@onetap/shared';

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDatabase(mongoUri);

    // 2. Dynamically import auth dependencies AFTER connection
    const { toNodeHandler } = await import("better-auth/node");
    const { auth } = await import("./lib/auth");
    const authRoutes = (await import('./routes/auth.routes')).default;

    const app = express();

    app.use(helmet());
    app.use(cors());

    // Better Auth handler
    app.all("/api/auth/*", toNodeHandler(auth));

    app.use(express.json());

    // Application Routes
    app.use('/api/v1/auth', authRoutes);

    app.get('/health', (req, res) => {
      res.json({ service: 'Auth Service', status: 'UP', timestamp: new Date() });
    });

    app.use(errorHandler);

    const PORT = ports.auth;
    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
};

startServer();
