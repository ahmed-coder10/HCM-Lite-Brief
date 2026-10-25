import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'hcm_super_secret_jwt_access_key_2026';
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        // Immediate deactivation check against database
        const user = db.get('users').find((u) => u.id === decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User account not found' });
        }
        if (user.status === 'DEACTIVATED') {
            return res.status(403).json({ error: 'Account has been deactivated. Access revoked.' });
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            employeeId: user.employeeId,
        };
        next();
    });
}
export function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Forbidden: role '${req.user.role}' lacks sufficient privileges for this resource.`,
            });
        }
        next();
    };
}
export function generateAccessToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
    }, JWT_SECRET, { expiresIn: '1d' });
}
