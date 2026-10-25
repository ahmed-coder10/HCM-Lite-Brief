import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/store.js';
import { authenticateToken, generateAccessToken } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';
const router = Router();
// Check system setup status
router.get('/status', (req, res) => {
    const settings = db.get('settings');
    const userCount = db.get('users').length;
    res.json({
        setupCompleted: settings.setupCompleted && userCount > 0,
        companyName: settings.companyName,
    });
});
// First-run company & admin account setup
router.post('/setup', async (req, res) => {
    try {
        const settings = db.get('settings');
        const existingUsers = db.get('users');
        if (settings.setupCompleted && existingUsers.length > 0) {
            return res.status(409).json({ error: 'First-run setup has already been completed.' });
        }
        const { companyName, adminName, adminEmail, adminPassword, officeStart, officeRadiusMeters } = req.body;
        if (!companyName || !adminEmail || !adminPassword) {
            return res.status(400).json({ error: 'Company name, admin email, and admin password are required.' });
        }
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const adminUser = {
            id: crypto.randomUUID(),
            name: adminName || 'System Administrator',
            email: adminEmail.toLowerCase().trim(),
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            forcePasswordChange: false,
            createdAt: new Date().toISOString(),
        };
        // Initialize Default Leave Types (Annual 14, Sick 8, Casual 10, Unpaid unlimited)
        const defaultLeaveTypes = [
            { id: crypto.randomUUID(), name: 'Annual Leave', quotaDays: 14, isPaid: true, color: '#3DDC97' },
            { id: crypto.randomUUID(), name: 'Sick Leave', quotaDays: 8, isPaid: true, color: '#FFB86B' },
            { id: crypto.randomUUID(), name: 'Casual Leave', quotaDays: 10, isPaid: true, color: '#22D3EE' },
            { id: crypto.randomUUID(), name: 'Unpaid Leave', quotaDays: 9999, isPaid: false, color: '#9AA3B8' },
        ];
        // Default Departments
        const engineeringDept = { id: crypto.randomUUID(), name: 'Engineering', code: 'ENG' };
        const hrDept = { id: crypto.randomUUID(), name: 'Human Resources', code: 'HR' };
        const financeDept = { id: crypto.randomUUID(), name: 'Finance & Operations', code: 'FIN' };
        // Default Designations
        const defaultDesignations = [
            { id: crypto.randomUUID(), title: 'Senior Software Engineer', departmentId: engineeringDept.id },
            { id: crypto.randomUUID(), title: 'HR Generalist', departmentId: hrDept.id },
            { id: crypto.randomUUID(), title: 'Operations Lead', departmentId: financeDept.id },
        ];
        db.update((data) => {
            data.settings = {
                ...data.settings,
                companyName,
                officeStart: officeStart || '09:00',
                officeRadiusMeters: Number(officeRadiusMeters) || 150,
                setupCompleted: true,
                setupDate: new Date().toISOString(),
            };
            data.users.push(adminUser);
            data.leaveTypes = defaultLeaveTypes;
            data.departments = [engineeringDept, hrDept, financeDept];
            data.designations = defaultDesignations;
        });
        recordAudit({
            actorId: adminUser.id,
            actorName: adminUser.name,
            actorRole: adminUser.role,
            action: 'ORGANIZATION_INITIALIZED',
            entity: 'COMPANY_SETTINGS',
            details: `Initialized organization '${companyName}' and created primary Admin account.`,
        });
        const token = generateAccessToken(adminUser);
        res.json({
            success: true,
            message: 'Organization setup completed successfully.',
            token,
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Server error during setup.' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = db.get('users').find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        if (user.status === 'DEACTIVATED') {
            return res.status(403).json({ error: 'Your account is deactivated. Please contact an Administrator.' });
        }
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = generateAccessToken(user);
        recordAudit({
            actorId: user.id,
            actorName: user.name,
            actorRole: user.role,
            action: 'USER_LOGIN',
            entity: 'USER',
            entityId: user.id,
            details: `User ${user.email} logged into HCM Lite.`,
        });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                forcePasswordChange: user.forcePasswordChange,
                employeeId: user.employeeId,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});
// Change Password (or forced password change)
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = db.get('users').find((u) => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // If not a forced change, verify current password
        if (!user.forcePasswordChange) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required.' });
            }
            const match = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!match) {
                return res.status(400).json({ error: 'Incorrect current password.' });
            }
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        }
        const newHash = await bcrypt.hash(newPassword, 10);
        db.update((data) => {
            const u = data.users.find((usr) => usr.id === userId);
            if (u) {
                u.passwordHash = newHash;
                u.forcePasswordChange = false;
            }
        });
        recordAudit({
            actorId: user.id,
            actorName: user.name,
            actorRole: user.role,
            action: 'PASSWORD_CHANGED',
            entity: 'USER',
            entityId: user.id,
            details: `User updated account password.`,
        });
        res.json({ success: true, message: 'Password updated successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update password.' });
    }
});
// Current User Profile
router.get('/me', authenticateToken, (req, res) => {
    const user = db.get('users').find((u) => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const employee = user.employeeId
        ? db.get('employees').find((e) => e.id === user.employeeId)
        : undefined;
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
        employee,
    });
});
export default router;
