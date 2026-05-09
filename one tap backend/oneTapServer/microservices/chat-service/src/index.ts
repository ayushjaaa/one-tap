import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import { ports, logger, errorHandler, connectDatabase, mongoUri } from '@onetap/shared';

connectDatabase(mongoUri);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'Chat Service', status: 'UP' });
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.use(errorHandler);

const PORT = ports.chat;
server.listen(PORT, () => {
  logger.info(`Chat Service (with WebSockets) running on port ${PORT}`);
});
