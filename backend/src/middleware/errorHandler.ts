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
    const field = Object.keys((err as any).keyValue ?? {})[0];
    const message =
      field === 'email'
        ? 'En användare med denna e-post finns redan'
        : 'Du har redan en bokning för detta evenemang';
    res.status(409).json({
      status: 'error',
      message,
    });
    return;
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Valideringsfel',
    });
    return;
  }

  if (config.nodeEnv === 'development') {
    console.error(err);
  }

  res.status(500).json({
    status: 'error',
    message: 'Internt serverfel',
  });
}
