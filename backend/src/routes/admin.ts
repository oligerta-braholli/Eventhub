import { Router } from 'express';
import { getAdminStats, getAdminUsers, updateUserRole } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;
