import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { deliveriesRouter } from './routes/deliveries';
import { subscriptionsRouter } from './routes/subscriptions';
import { paymentsRouter } from './routes/payments';
import { adminRouter } from './routes/admin';
import { notificationsRouter } from './routes/notifications';
import { webhookRouter } from './routes/webhooks';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Trust Railway's reverse proxy
app.set('trust proxy', 1);

// ── Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// ── Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Webhooks need raw body — mount BEFORE json parser
app.use('/api/webhooks', webhookRouter);

// ── Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ── Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

// ── Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 FlexNotify API running on port ${PORT}`);
});

export default app;
