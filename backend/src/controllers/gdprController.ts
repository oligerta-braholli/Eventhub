import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { anonymizeUser, exportUserData } from '../utils/gdpr';
import { ForbiddenError } from '../utils/errors';

export async function exportMyData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await exportUserData(req.user!.userId);
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

export async function anonymizeUserById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Admin can anonymize anyone; a user can anonymize themselves
    const targetId = req.params.userId;
    if (req.user!.role !== 'admin' && req.user!.userId !== targetId) {
      return next(new ForbiddenError('Access denied'));
    }
    await anonymizeUser(targetId);
    res.json({ status: 'success', message: 'User data anonymized per GDPR request' });
  } catch (err) {
    next(err);
  }
}
