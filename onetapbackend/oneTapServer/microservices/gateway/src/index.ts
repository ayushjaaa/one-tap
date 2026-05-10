import 'dotenv/config';
import express from 'express';
import proxy from 'express-http-proxy';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ports, services, logger, errorHandler } from '@onetap/shared';

const app = express();

app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running', timestamp: new Date() });
});

const serviceMap: Record<string, string> = {
  auth: services.auth,
  marketplace: services.marketplace,
  booking: services.booking,
  investment: services.investment,
  wallet: services.wallet,
  chat: services.chat
};


app.use('/api/auth', proxy(services.auth, {
  preserveHostHdr: true,
  proxyReqPathResolver: (req) => `/api/auth${req.url}`
}));


app.use('/api/v1/:serviceName', (req, res, next) => {
  const { serviceName } = req.params;
  const targetService = serviceMap[serviceName];

  if (!targetService) {
    return next();
  }

  return proxy(targetService, {
    preserveHostHdr: true,
    proxyReqPathResolver: (req) => {

      return `/api/v1/${serviceName}${req.url}`;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy Error for ${serviceName}: ${(err as any).message}`);
      next(err);
    }
  })(req, res, next);
});


// 3. Fallback Legacy Routes
app.use('/auth', proxy(services.auth, { preserveHostHdr: true }));


app.use(express.json());


app.use(errorHandler);

const PORT = ports.gateway;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
