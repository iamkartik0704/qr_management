import { Router } from 'express';
import { generateTicket } from '../controller/qr.controller';
import { validateScan } from '../controller/qr.controller';

import { getStats, handleRevoke } from '../controller/qr.controller';
import { requireAuth, requireAdmin } from '../../../middleware/auth.middleware';

const router = Router();

// Admin Only Routes
router.get('/admin/attendance', requireAuth, requireAdmin, getStats);
router.patch('/admin/ticket/revoke', requireAuth, requireAdmin, handleRevoke);

// Endpoint: POST /api/qr/generate
router.post('/generate', requireAuth, requireAdmin, generateTicket);

// Volunteer Route: Requires login, but NO admin check
router.post('/validate', requireAuth, validateScan);

export default router;