import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import venueRoutes from './routes/venues';
import bookingRoutes from './routes/bookings';
import reviewRoutes from './routes/reviews';
import waitlistRoutes from './routes/waitlist';
import gdprRoutes from './routes/gdpr';
import adminRoutes from './routes/admin';

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow the configured frontend origin
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// HTTP logging — use a format that never logs request bodies (avoids logging passwords)
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Not found' }));

// Global error handler
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`EventHub API running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
