import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new UnauthorizedError('Autentisering krävs'));
  }
  if (!authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Felaktigt autentiseringsformat'));
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Ogiltig eller utgången token'));
  }
}
