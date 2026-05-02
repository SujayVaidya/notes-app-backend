import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
      uptime: Math.floor(process.uptime()),
      env: env.NODE_ENV,
    },
  });
});

export default router;
