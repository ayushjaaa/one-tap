import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ports, logger, errorHandler, connectDatabase, mongoUri } from '@onetap/shared';

connectDatabase(mongoUri);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'Wallet Service', status: 'UP' });
});

app.use(errorHandler);

const PORT = ports.wallet;
app.listen(PORT, () => {
  logger.info(`Wallet Service running on port ${PORT}`);
});
