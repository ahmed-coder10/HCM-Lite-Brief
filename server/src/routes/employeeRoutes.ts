import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, Employee, User } from '../db/store.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// List Employees
router.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const employees = db.get('employees');
  const departments = db.get('departments');
  const designations = db.get('designations');

  // Employee role can only see their own record
  let list = employees;
  if (user.role === 'EMPLOYEE') {
    list = employees.filter((e) => e.id === user.employeeId);
  }

  // Optional search query & department filtering
  const search = (req.query.search as string)?.toLowerCase();
  const deptId = req.query.departmentId as string;

  if (search) {
    list = list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(search) ||
        e.lastName.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.employeeCode.toLowerCase().includes(search)
    );
  }
  if (deptId) {
    list = list.filter((e) => e.departmentId === deptId);
  }

  // Populate department & designation titles
  const populated = list.map((e) => ({
    ...e,
    departmentName: departments.find((d) => d.id === e.departmentId)?.name || 'Unassigned',
    designationTitle: designations.find((d) => d.id === e.designationId)?.title || 'Staff',
  }));

  res.json(populated);
});

// Employee 360 Profile
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const user = req.user!;

  if (user.role === 'EMPLOYEE' && user.employeeId !== id) {
    return res.status(403).json({ error: 'Access denied: You can only view your own employee 360 record.' });
  }

  const emp = db.get('employees').find((e) => e.id === id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const department = db.get('departments').find((d) => d.id === emp.departmentId);
  const designation = db.get('designations').find((d) => d.id === emp.designationId);
  const recentAttendance = db.get('attendance').filter((a) => a.employeeId === id).slice(-10);
  const recentLeaves = db.get('leaves').filter((l) => l.employeeId === id).slice(-10);

  res.json({
    employee: emp,
    department,
    designation,
    recentAttendance,
    recentLeaves,
  });
});

// Register Employee (HR only)
router.post('/', authenticateToken, requireRole(['HR']), async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, email, phone, address, departmentId, designationId, basicSalary, temporaryPassword } = req.body;

    if (!firstName || !lastName || !email || !departmentId || !designationId) {
      return res.status(400).json({ error: 'First name, last name, email, department, and designation are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (db.get('users').some((u) => u.email === cleanEmail)) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const basic = Number(basicSalary) || 50000;
    const hra = Math.round(basic * 0.4);
    const medical = Math.round(basic * 0.1);
    const gross = basic + hra + medical;

    const empCount = db.get('employees').length + 1;
    const employeeCode = `EMP-${String(empCount).padStart(4, '0')}`;

    const tempPass = temporaryPassword || 'Welcome@2026';
    const passwordHash = await bcrypt.hash(tempPass, 10);

    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();

    const newUser: User = {
      id: userId,
      name: `${firstName} ${lastName}`,
      email: cleanEmail,
      passwordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      forcePasswordChange: true,
      employeeId,
      createdAt: new Date().toISOString(),
    };

    const newEmployee: Employee = {
      id: employeeId,
      userId,
      employeeCode,
      firstName,
      lastName,
      email: cleanEmail,
      phone: phone || '',
      address: address || '',
      departmentId,
      designationId,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      salary: { basic, hra, medical, gross },
    };

    db.update((data) => {
      data.users.push(newUser);
      data.employees.push(newEmployee);
    });

    recordAudit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'EMPLOYEE_REGISTERED',
      entity: 'EMPLOYEE',
      entityId: employeeId,
      details: `HR registered employee ${employeeCode} (${cleanEmail}) with initial gross salary PKR ${gross}.`,
    });

    res.json({
      success: true,
      message: `Employee ${employeeCode} registered. Login credentials generated.`,
      employee: newEmployee,
      temporaryPassword: tempPass,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register employee.' });
  }
});

// Update Employee
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const user = req.user!;
  const empIndex = db.get('employees').findIndex((e) => e.id === id);

  if (empIndex === -1) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const existing = db.get('employees')[empIndex];

  // Employee role can ONLY edit their own phone and address
  if (user.role === 'EMPLOYEE') {
    if (user.employeeId !== id) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify other employee profiles.' });
    }
    const { phone, address } = req.body;
    db.update((data) => {
      data.employees[empIndex].phone = phone ?? existing.phone;
      data.employees[empIndex].address = address ?? existing.address;
    });
    return res.json({ success: true, message: 'Profile contact details updated.' });
  }

  // HR role can edit full details except cannot change employee code
  if (user.role === 'HR') {
    const { firstName, lastName, phone, address, departmentId, designationId, basicSalary, status } = req.body;

    const basic = basicSalary !== undefined ? Number(basicSalary) : existing.salary.basic;
    const hra = Math.round(basic * 0.4);
    const medical = Math.round(basic * 0.1);
    const gross = basic + hra + medical;

    db.update((data) => {
      data.employees[empIndex] = {
        ...existing,
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName,
        phone: phone ?? existing.phone,
        address: address ?? existing.address,
        departmentId: departmentId || existing.departmentId,
        designationId: designationId || existing.designationId,
        status: status || existing.status,
        salary: { basic, hra, medical, gross },
      };
    });

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'EMPLOYEE_UPDATED',
      entity: 'EMPLOYEE',
      entityId: id,
      details: `HR updated profile for employee ${existing.employeeCode}`,
    });

    return res.json({ success: true, employee: db.get('employees')[empIndex] });
  }

  res.status(403).json({ error: 'Forbidden: Admin should delegate employee management to HR.' });
});

// CSV Export
router.get('/actions/export-csv', authenticateToken, requireRole(['HR', 'ADMIN']), (req, res) => {
  const employees = db.get('employees');
  const departments = db.get('departments');
  const designations = db.get('designations');

  const headers = ['EmployeeCode', 'FirstName', 'LastName', 'Email', 'Phone', 'Department', 'Designation', 'BasicSalary', 'GrossSalary', 'JoiningDate', 'Status'];
  const rows = employees.map((e) => {
    const dept = departments.find((d) => d.id === e.departmentId)?.name || '';
    const desg = designations.find((d) => d.id === e.designationId)?.title || '';
    return [
      e.employeeCode,
      `"${e.firstName}"`,
      `"${e.lastName}"`,
      e.email,
      `"${e.phone}"`,
      `"${dept}"`,
      `"${desg}"`,
      e.salary.basic,
      e.salary.gross,
      e.joiningDate,
      e.status,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hcm_employees_export.csv"');
  res.send(csv);
});

export default router;
