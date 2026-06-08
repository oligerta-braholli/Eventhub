import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
