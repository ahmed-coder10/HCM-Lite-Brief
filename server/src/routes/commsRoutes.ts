import { Router } from 'express';
import crypto from 'crypto';
import { db, Announcement, Notification } from '../db/store.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// Announcements
router.get('/announcements', authenticateToken, (req, res) => {
  res.json(db.get('announcements'));
});

router.post('/announcements', authenticateToken, requireRole(['ADMIN', 'HR']), (req: AuthenticatedRequest, res) => {
  const { title, content, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const announcement: Announcement = {
    id: crypto.randomUUID(),
    title,
    content,
    priority: priority || 'NORMAL',
    authorName: req.user!.name,
    authorRole: req.user!.role,
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.announcements.unshift(announcement);
    // Broadcast notification to all active users
    for (const u of data.users) {
      data.notifications.push({
        id: crypto.randomUUID(),
        userId: u.id,
        title: `Announcement: ${title}`,
        message: content.slice(0, 100),
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  recordAudit({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'ANNOUNCEMENT_POSTED',
    entity: 'ANNOUNCEMENT',
    entityId: announcement.id,
    details: `${req.user!.name} posted announcement: ${title}`,
  });

  res.json(announcement);
});

// User Notifications
router.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notifications = db.get('notifications').filter((n) => n.userId === userId);
  res.json(notifications);
});

router.put('/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  db.update((data) => {
    const n = data.notifications.find((notif) => notif.id === id && notif.userId === userId);
    if (n) n.read = true;
  });

  res.json({ success: true });
});

router.put('/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  db.update((data) => {
    for (const n of data.notifications) {
      if (n.userId === userId) {
        n.read = true;
      }
    }
  });

  res.json({ success: true });
});

export default router;
