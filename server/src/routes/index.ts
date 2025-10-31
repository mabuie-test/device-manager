import { Express } from 'express';
import authRoutes from './authRoutes.js';
import gameRoutes from './gameRoutes.js';
import financeRoutes from './financeRoutes.js';
import adminRoutes from './adminRoutes.js';
import chatRoutes from './chatRoutes.js';

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);
}
