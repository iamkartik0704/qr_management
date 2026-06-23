import { Router } from 'express';
import { generateTicket } from '../controller/qr.controller';
import { validateScan } from '../controller/qr.controller';

import {
  getStats,
  handleRevoke,
  handleRevokeBulk,
  getVolunteerStats,
  generateTicketsBulk,
} from '../controller/qr.controller';
import {
  createVolunteer,
  listVolunteers,
  deleteVolunteer,
} from '../controller/volunteer.controller';
import { requireAuth, requireAdmin } from '../../../middleware/auth.middleware';

const router = Router();

// Admin Only Routes
router.get('/admin/attendance', requireAuth, requireAdmin, getStats);
router.get('/admin/scan-stats', requireAuth, requireAdmin, getVolunteerStats);
router.patch('/admin/ticket/revoke', requireAuth, requireAdmin, handleRevoke);
router.patch('/admin/ticket/revoke-bulk', requireAuth, requireAdmin, handleRevokeBulk);

// Admin: volunteer management
router.get('/admin/volunteers', requireAuth, requireAdmin, listVolunteers);
router.post('/admin/volunteers', requireAuth, requireAdmin, createVolunteer);
router.delete('/admin/volunteers/:id', requireAuth, requireAdmin, deleteVolunteer);

// Endpoint: POST /api/qr/generate
router.post('/generate', requireAuth, requireAdmin, generateTicket);
router.post('/generate-bulk', requireAuth, requireAdmin, generateTicketsBulk);

// Volunteer Route: Requires login, but NO admin check
router.post('/validate', requireAuth, validateScan);

export default router;