import { Router } from 'express';
import { exportMyData, anonymizeUserById } from '../controllers/gdprController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// Any authenticated user can export their own data
router.get('/export', authenticate, exportMyData);

// Anonymize (GDPR right to erasure) — self or admin
router.delete('/anonymize/:userId', authenticate, anonymizeUserById);

export default router;
