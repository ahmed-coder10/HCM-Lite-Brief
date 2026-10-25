import { Router } from 'express';
import { db } from '../db/store.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get Audit Logs (Admin only, append-only immutable trail)
router.get('/', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const logs = db.get('auditLogs');
  res.json(logs);
});

export default router;
