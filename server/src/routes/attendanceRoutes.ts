import { Router } from 'express';
import crypto from 'crypto';
import { db, AttendanceRecord, AttendanceCorrection } from '../db/store.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { checkIn, checkOut } from '../services/attendanceService.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// List attendance
router.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const dateQuery = req.query.date as string;
  const attendanceList = db.get('attendance');
  const employees = db.get('employees');

  let list = attendanceList;
  if (user.role === 'EMPLOYEE') {
    list = list.filter((a) => a.employeeId === user.employeeId);
  }

  if (dateQuery) {
    list = list.filter((a) => a.date === dateQuery);
  }

  // Populate employee name
  const populated = list.map((a) => {
    const emp = employees.find((e) => e.id === a.employeeId);
    return {
      ...a,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp ? emp.employeeCode : '',
    };
  });

  res.json(populated);
});

// Check-In
router.post('/check-in', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const employeeId = user.role === 'EMPLOYEE' ? user.employeeId : (req.body.employeeId || user.employeeId);

  if (!employeeId) {
    return res.status(400).json({ error: 'No employee record linked to check in.' });
  }

  const { method, coords, faceDetected } = req.body;
  const result = checkIn({ employeeId, method, coords, faceDetected });

  if (!result.success) {
    return res.status(result.code || 400).json({ error: result.message });
  }

  recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'ATTENDANCE_CHECK_IN',
    entity: 'ATTENDANCE',
    entityId: result.record?.id,
    details: `${user.name} checked in via ${method || 'WEB'} (${result.record?.status}).`,
  });

  res.json(result);
});

// Check-Out
router.post('/check-out', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const employeeId = user.role === 'EMPLOYEE' ? user.employeeId : (req.body.employeeId || user.employeeId);

  if (!employeeId) {
    return res.status(400).json({ error: 'No employee record linked to check out.' });
  }

  const result = checkOut({ employeeId });
  if (!result.success) {
    return res.status(result.code || 400).json({ error: result.message });
  }

  recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'ATTENDANCE_CHECK_OUT',
    entity: 'ATTENDANCE',
    entityId: result.record?.id,
    details: `${user.name} checked out (${result.record?.durationHours} hrs, status: ${result.record?.status}).`,
  });

  res.json(result);
});

// Submit Attendance Correction Request
router.post('/corrections', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const employeeId = user.employeeId;

  if (!employeeId) {
    return res.status(400).json({ error: 'Employee account required to submit correction.' });
  }

  const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;
  if (!date || !requestedCheckIn || !reason) {
    return res.status(400).json({ error: 'Date, requested check-in time, and reason are required.' });
  }

  const correction: AttendanceCorrection = {
    id: crypto.randomUUID(),
    employeeId,
    date,
    requestedCheckIn,
    requestedCheckOut: requestedCheckOut || '',
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.corrections.push(correction);
    // Notify HR
    const hrUsers = data.users.filter((u) => u.role === 'HR');
    for (const hr of hrUsers) {
      data.notifications.push({
        id: crypto.randomUUID(),
        userId: hr.id,
        title: 'Attendance Correction Request',
        message: `${user.name} submitted an attendance correction for ${date}.`,
        type: 'ATTENDANCE',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  res.json({ success: true, message: 'Correction request submitted for HR approval.', correction });
});

// List Corrections
router.get('/corrections', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let corrections = db.get('corrections');
  const employees = db.get('employees');

  if (user.role === 'EMPLOYEE') {
    corrections = corrections.filter((c) => c.employeeId === user.employeeId);
  }

  const populated = corrections.map((c) => {
    const emp = employees.find((e) => e.id === c.employeeId);
    return {
      ...c,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp ? emp.employeeCode : '',
    };
  });

  res.json(populated);
});

// Review Correction (HR only)
router.put('/corrections/:id', authenticateToken, requireRole(['HR']), (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const { status, reviewComment } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
  }

  let updatedCorrection: AttendanceCorrection | null = null;
  db.update((data) => {
    const corr = data.corrections.find((c) => c.id === id);
    if (!corr) return;

    corr.status = status;
    corr.reviewComment = reviewComment || '';
    corr.reviewedBy = req.user!.name;
    corr.reviewedAt = new Date().toISOString();
    updatedCorrection = corr;

    // If approved, update or create attendance record
    if (status === 'APPROVED') {
      const existingAtt = data.attendance.find((a) => a.employeeId === corr.employeeId && a.date === corr.date);
      if (existingAtt) {
        existingAtt.checkIn = corr.requestedCheckIn;
        if (corr.requestedCheckOut) existingAtt.checkOut = corr.requestedCheckOut;
        existingAtt.status = 'PRESENT';
      } else {
        data.attendance.push({
          id: crypto.randomUUID(),
          employeeId: corr.employeeId,
          date: corr.date,
          checkIn: corr.requestedCheckIn,
          checkOut: corr.requestedCheckOut || null,
          status: 'PRESENT',
          method: 'WEB',
        });
      }
    }

    // Notify employee
    const emp = data.employees.find((e) => e.id === corr.employeeId);
    if (emp?.userId) {
      data.notifications.push({
        id: crypto.randomUUID(),
        userId: emp.userId,
        title: `Attendance Correction ${status}`,
        message: `Your correction for ${corr.date} was ${status.toLowerCase()} by HR. ${reviewComment ? 'Comment: ' + reviewComment : ''}`,
        type: 'ATTENDANCE',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  if (!updatedCorrection) {
    return res.status(404).json({ error: 'Correction request not found.' });
  }

  recordAudit({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: `ATTENDANCE_CORRECTION_${status}`,
    entity: 'ATTENDANCE_CORRECTION',
    entityId: id,
    details: `HR ${req.user!.name} ${status} correction for date ${(updatedCorrection as any).date}`,
  });

  res.json({ success: true, message: `Correction ${status}.`, correction: updatedCorrection });
});

export default router;
