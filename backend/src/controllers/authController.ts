import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: string;
    };

    const user = await User.create({ name, email, password, role: role ?? 'participant' });
    const token = signToken({ userId: user.id as string, role: user.role });

    res.status(201).json({ status: 'success', token, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email, isAnonymized: false }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new UnauthorizedError('Felaktig e-post eller lösenord'));
    }

    const token = signToken({ userId: user.id as string, role: user.role });
    user.password = '';
    res.json({ status: 'success', token, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return next(new NotFoundError('Användaren'));
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}
