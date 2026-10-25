import { Router } from 'express';
import { db } from '../db/store.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generatePayrollDraft, savePayrollDraft, finalizePayroll } from '../services/payrollService.js';
import { generatePayslipPdf } from '../services/pdfService.js';
import { recordAudit } from '../services/auditService.js';
const router = Router();
// List payroll runs
router.get('/', authenticateToken, requireRole(['HR', 'ADMIN']), (req, res) => {
    const payrolls = db.get('payrolls');
    const summary = payrolls.map((p) => ({
        id: p.id,
        month: p.month,
        status: p.status,
        totalGross: p.totalGross,
        totalNet: p.totalNet,
        totalTax: p.totalTax,
        totalEmployees: p.totalEmployees,
        createdAt: p.createdAt,
        finalizedBy: p.finalizedBy,
        finalizedAt: p.finalizedAt,
    }));
    res.json(summary);
});
// Get payroll for specific month
router.get('/:month', authenticateToken, (req, res) => {
    const month = String(req.params.month);
    const user = req.user;
    const payroll = db.get('payrolls').find((p) => p.month === month);
    if (!payroll) {
        return res.status(404).json({ error: `No payroll run found for ${month}` });
    }
    // Employee can only see their own line item
    if (user.role === 'EMPLOYEE') {
        const item = payroll.items.find((i) => i.employeeId === user.employeeId);
        if (!item) {
            return res.status(404).json({ error: 'No payslip found for your account in this month.' });
        }
        return res.json({
            month: payroll.month,
            status: payroll.status,
            item,
        });
    }
    // HR or Admin see the full payroll run
    res.json(payroll);
});
// Generate / Preview Payroll Draft (HR only)
router.post('/generate', authenticateToken, requireRole(['HR']), (req, res) => {
    try {
        const { month } = req.body;
        if (!month) {
            return res.status(400).json({ error: 'Month (YYYY-MM) is required.' });
        }
        const existing = db.get('payrolls').find((p) => p.month === month);
        if (existing && existing.status === 'FINALIZED') {
            return res.status(409).json({ error: `Payroll for ${month} is already FINALIZED and cannot be modified.` });
        }
        const draft = generatePayrollDraft(month);
        savePayrollDraft(draft);
        recordAudit({
            actorId: req.user.id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: 'PAYROLL_DRAFT_GENERATED',
            entity: 'PAYROLL',
            entityId: draft.id,
            details: `HR generated payroll draft for ${month} (${draft.totalEmployees} employees, Net PKR ${draft.totalNet.toLocaleString()}).`,
        });
        res.json({ success: true, message: `Payroll draft for ${month} prepared.`, payroll: draft });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Failed to generate payroll draft.' });
    }
});
// Finalize Payroll Run (ADMIN ONLY)
router.post('/finalize', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    try {
        const { month } = req.body;
        if (!month) {
            return res.status(400).json({ error: 'Month (YYYY-MM) is required.' });
        }
        const finalized = finalizePayroll(month, req.user.name);
        recordAudit({
            actorId: req.user.id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: 'PAYROLL_FINALIZED',
            entity: 'PAYROLL',
            entityId: finalized ? finalized.id : undefined,
            details: `Admin ${req.user.name} finalized and permanently locked payroll for ${month}.`,
        });
        res.json({ success: true, message: `Payroll for ${month} finalized and locked.`, payroll: finalized });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Failed to finalize payroll.' });
    }
});
// Download Payslip PDF
router.get('/:month/payslip/:empId', authenticateToken, async (req, res) => {
    try {
        const month = String(req.params.month);
        const empId = String(req.params.empId);
        const user = req.user;
        // Security guard: Employee can only download their own payslip
        if (user.role === 'EMPLOYEE' && user.employeeId !== empId) {
            return res.status(403).json({ error: 'Forbidden: You cannot access payslips of other employees.' });
        }
        const payroll = db.get('payrolls').find((p) => p.month === month);
        if (!payroll) {
            return res.status(404).json({ error: `No payroll records for ${month}.` });
        }
        const item = payroll.items.find((i) => i.employeeId === empId);
        if (!item) {
            return res.status(404).json({ error: 'Employee not found in this payroll run.' });
        }
        const settings = db.get('settings');
        const pdfBuffer = await generatePayslipPdf(item, settings, month);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Payslip_${item.employeeCode}_${month}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate payslip PDF.' });
    }
});
export default router;
