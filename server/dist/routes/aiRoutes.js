import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { processAIChat, generateDashboardSummary } from '../services/aiService.js';
const router = Router();
// Chat Endpoint
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required.' });
        }
        const user = req.user;
        const responseText = await processAIChat(messages, {
            id: user.id,
            name: user.name,
            role: user.role,
            employeeId: user.employeeId,
        });
        res.json({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Error processing AI chat.' });
    }
});
// Dashboard Summary Endpoint
router.get('/summary', authenticateToken, (req, res) => {
    const user = req.user;
    const observations = generateDashboardSummary(user.role, user.employeeId);
    res.json({
        role: user.role,
        observations,
        timestamp: new Date().toISOString(),
    });
});
export default router;
