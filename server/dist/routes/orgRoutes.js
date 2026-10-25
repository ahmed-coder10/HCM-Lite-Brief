import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';
const router = Router();
// Get settings
router.get('/settings', authenticateToken, (req, res) => {
    res.json(db.get('settings'));
});
// Update settings (Admin only)
router.put('/settings', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const { officeStart, graceMinutes, halfDayMinHours, weekendDays, officeLat, officeLng, officeRadiusMeters } = req.body;
    db.update((data) => {
        if (officeStart)
            data.settings.officeStart = officeStart;
        if (graceMinutes !== undefined)
            data.settings.graceMinutes = Number(graceMinutes);
        if (halfDayMinHours !== undefined)
            data.settings.halfDayMinHours = Number(halfDayMinHours);
        if (weekendDays)
            data.settings.weekendDays = weekendDays;
        if (officeLat !== undefined)
            data.settings.officeLat = Number(officeLat);
        if (officeLng !== undefined)
            data.settings.officeLng = Number(officeLng);
        if (officeRadiusMeters !== undefined)
            data.settings.officeRadiusMeters = Number(officeRadiusMeters);
    });
    recordAudit({
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'SETTINGS_UPDATED',
        entity: 'ORG_SETTINGS',
        details: 'Admin updated organization policies and geofence parameters.',
    });
    res.json({ success: true, settings: db.get('settings') });
});
// Departments
router.get('/departments', authenticateToken, (req, res) => {
    res.json(db.get('departments'));
});
router.post('/departments', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required.' });
    }
    const newDept = { id: crypto.randomUUID(), name, code: code.toUpperCase() };
    db.update((data) => data.departments.push(newDept));
    recordAudit({
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'DEPARTMENT_CREATED',
        entity: 'DEPARTMENT',
        entityId: newDept.id,
        details: `Created department ${name} (${code})`,
    });
    res.json(newDept);
});
// Designations
router.get('/designations', authenticateToken, (req, res) => {
    res.json(db.get('designations'));
});
router.post('/designations', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const { title, departmentId } = req.body;
    if (!title || !departmentId) {
        return res.status(400).json({ error: 'Title and departmentId are required.' });
    }
    const newDesg = { id: crypto.randomUUID(), title, departmentId };
    db.update((data) => data.designations.push(newDesg));
    res.json(newDesg);
});
// Leave Types
router.get('/leave-types', authenticateToken, (req, res) => {
    res.json(db.get('leaveTypes'));
});
// Public Holidays
router.get('/holidays', authenticateToken, (req, res) => {
    res.json(db.get('publicHolidays'));
});
router.post('/holidays', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const { name, date } = req.body;
    if (!name || !date) {
        return res.status(400).json({ error: 'Holiday name and date are required.' });
    }
    const holiday = { id: crypto.randomUUID(), name, date };
    db.update((data) => data.publicHolidays.push(holiday));
    res.json(holiday);
});
// Create HR user login (Admin only)
router.post('/create-hr-login', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        const cleanEmail = email.toLowerCase().trim();
        if (db.get('users').some((u) => u.email === cleanEmail)) {
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }
        const hash = await bcrypt.hash(password, 10);
        const hrUser = {
            id: crypto.randomUUID(),
            name,
            email: cleanEmail,
            passwordHash: hash,
            role: 'HR',
            status: 'ACTIVE',
            forcePasswordChange: true,
            createdAt: new Date().toISOString(),
        };
        db.update((data) => data.users.push(hrUser));
        recordAudit({
            actorId: req.user.id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: 'HR_USER_CREATED',
            entity: 'USER',
            entityId: hrUser.id,
            details: `Admin created HR account for ${name} (${cleanEmail}).`,
        });
        res.json({
            success: true,
            message: 'HR account created successfully with temporary password.',
            user: { id: hrUser.id, name: hrUser.name, email: hrUser.email, role: hrUser.role },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create HR account.' });
    }
});
// List System Users (Admin only)
router.get('/users', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const users = db.get('users').map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
    }));
    res.json(users);
});
export default router;
