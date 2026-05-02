import { Request, Response, NextFunction } from 'express';
import { MESSAGES } from '../constants/messages';

interface AppError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = statusCode < 500 ? err.message : MESSAGES.SERVER.ERROR;

  if (statusCode >= 500) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { error: err.stack }),
  });
};
