import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    res.status(409).json({
      status: 'error',
      message: 'A record with that value already exists',
    });
    return;
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
    });
    return;
  }

  // Never leak stack traces to clients
  if (config.nodeEnv === 'development') {
    console.error(err);
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
