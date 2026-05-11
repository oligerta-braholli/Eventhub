import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['participant', 'organizer'])
    .withMessage('Role must be participant or organizer'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

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
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const token = signToken({ userId: user.id as string, role: user.role });
    // Remove password from response
    user.password = '';
    res.json({ status: 'success', token, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return next(new NotFoundError('User'));
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}
