import { Router } from 'express';
import { db, LeaveRequest } from '../db/store.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { applyLeave, getEmployeeLeaveBalances } from '../services/leaveService.js';
import { parseSmartLeaveText } from '../services/aiService.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// Get Leave Balances
router.get('/balances', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let targetEmpId = user.employeeId;

  // HR or Admin can view any employee's balance if specified in query
  if ((user.role === 'HR' || user.role === 'ADMIN') && req.query.employeeId) {
    targetEmpId = req.query.employeeId as string;
  }

  if (!targetEmpId) {
    return res.status(400).json({ error: 'No employee specified or associated with user.' });
  }

  const balances = getEmployeeLeaveBalances(targetEmpId);
  res.json(balances);
});

// List Leave Requests
router.get('/requests', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const leaves = db.get('leaves');
  const employees = db.get('employees');
  const leaveTypes = db.get('leaveTypes');

  let list = leaves;
  if (user.role === 'EMPLOYEE') {
    list = list.filter((l) => l.employeeId === user.employeeId);
  }

  const populated = list.map((l) => {
    const emp = employees.find((e) => e.id === l.employeeId);
    const lt = leaveTypes.find((t) => t.id === l.leaveTypeId);
    return {
      ...l,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp ? emp.employeeCode : '',
      leaveTypeName: lt ? lt.name : 'General Leave',
      color: lt ? lt.color : '#7C5CFF',
    };
  });

  res.json(populated);
});

// Apply for Leave
router.post('/apply', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const employeeId = user.employeeId;

  if (!employeeId) {
    return res.status(400).json({ error: 'Only employee accounts can apply for leave.' });
  }

  const { leaveTypeId, startDate, endDate, reason } = req.body;
  if (!leaveTypeId || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Leave type, start date, end date, and reason are required.' });
  }

  const result = applyLeave({
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    reason,
  });

  if (!result.success) {
    return res.status(result.code || 400).json({ error: result.message });
  }

  recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'LEAVE_APPLIED',
    entity: 'LEAVE_REQUEST',
    entityId: result.leave?.id,
    details: `${user.name} applied for ${result.leave?.daysCount} day(s) leave (${startDate} to ${endDate}).`,
  });

  res.json(result);
});

// Smart Leave Parser (AI Natural Language Pre-fill)
router.post('/smart-parse', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text prompt is required.' });
  }

  const user = req.user!;
  const parsed = parseSmartLeaveText(text, user.employeeId || '');
  res.json({ success: true, parsed });
});

// Approve or Reject Leave (HR only)
router.put('/requests/:id', authenticateToken, requireRole(['HR']), (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const { status, reviewComment } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
  }

  let updatedLeave: LeaveRequest | null = null;
  db.update((data) => {
    const leave = data.leaves.find((l) => l.id === id);
    if (!leave) return;

    leave.status = status;
    leave.reviewComment = reviewComment || '';
    leave.reviewedBy = req.user!.name;
    leave.reviewedAt = new Date().toISOString();
    updatedLeave = leave;

    // Send notification to employee
    const emp = data.employees.find((e) => e.id === leave.employeeId);
    if (emp?.userId) {
      data.notifications.push({
        id: crypto.randomUUID(),
        userId: emp.userId,
        title: `Leave Application ${status}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()} by HR. ${reviewComment ? 'Remarks: ' + reviewComment : ''}`,
        type: 'LEAVE',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  if (!updatedLeave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  recordAudit({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: `LEAVE_${status}`,
    entity: 'LEAVE_REQUEST',
    entityId: id,
    details: `HR ${req.user!.name} ${status} leave for employee.`,
  });

  res.json({ success: true, message: `Leave request ${status}.`, leave: updatedLeave });
});

// Cancel Leave (Employee only for own pending or upcoming leaves)
router.post('/cancel/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const user = req.user!;

  let cancelled = false;
  db.update((data) => {
    const leave = data.leaves.find((l) => l.id === id);
    if (!leave) return;

    if (user.role === 'EMPLOYEE' && leave.employeeId !== user.employeeId) {
      return;
    }

    if (leave.status === 'CANCELLED') {
      return;
    }

    leave.status = 'CANCELLED';
    cancelled = true;
  });

  if (!cancelled) {
    return res.status(400).json({ error: 'Cannot cancel this leave request or unauthorized.' });
  }

  recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'LEAVE_CANCELLED',
    entity: 'LEAVE_REQUEST',
    entityId: id,
    details: `${user.name} cancelled leave application.`,
  });

  res.json({ success: true, message: 'Leave request cancelled.' });
});

export default router;
