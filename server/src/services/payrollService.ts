import crypto from 'crypto';
import { db, PayrollRun, PayrollItem, Employee } from '../db/store.js';
import { calculateWorkingDays, isWorkingDay } from './leaveService.js';

export function calculateAnnualTax(annualGross: number): number {
  if (annualGross <= 600000) {
    return 0;
  }
  if (annualGross <= 1200000) {
    return (annualGross - 600000) * 0.05;
  }
  if (annualGross <= 2400000) {
    return 30000 + (annualGross - 1200000) * 0.15;
  }
  if (annualGross <= 3600000) {
    return 210000 + (annualGross - 2400000) * 0.25;
  }
  return 510000 + (annualGross - 3600000) * 0.35;
}

export function generatePayrollDraft(monthStr: string): PayrollRun {
  // monthStr is "YYYY-MM"
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const totalWorkingDays = calculateWorkingDays(startDate, endDate) || 22;

  const employees = db.get('employees').filter((e) => e.status !== 'TERMINATED');
  const departments = db.get('departments');
  const designations = db.get('designations');
  const attendanceList = db.get('attendance');
  const leaveList = db.get('leaves');
  const leaveTypes = db.get('leaveTypes');

  const unpaidLeaveType = leaveTypes.find((lt) => !lt.isPaid);

  const items: PayrollItem[] = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;

  for (const emp of employees) {
    const basic = emp.salary?.basic || 50000;
    const hra = emp.salary?.hra || Math.round(basic * 0.4);
    const medical = emp.salary?.medical || Math.round(basic * 0.1);
    const gross = basic + hra + medical;

    // Filter attendance in month
    const empAtt = attendanceList.filter(
      (a) => a.employeeId === emp.id && a.date >= startDate && a.date <= endDate
    );

    const presentDays = empAtt.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const lateDays = empAtt.filter((a) => a.status === 'LATE').length;
    const halfDays = empAtt.filter((a) => a.status === 'HALF_DAY').length;

    // Approved leaves in month
    const empLeaves = leaveList.filter(
      (l) =>
        l.employeeId === emp.id &&
        l.status === 'APPROVED' &&
        l.startDate <= endDate &&
        l.endDate >= startDate
    );

    let unpaidDays = 0;
    if (unpaidLeaveType) {
      unpaidDays = empLeaves
        .filter((l) => l.leaveTypeId === unpaidLeaveType.id)
        .reduce((sum, l) => sum + l.daysCount, 0);
    }

    // Days worked equivalent
    const attendedEquivalent = presentDays + halfDays * 0.5;
    // Approved paid leaves
    const paidLeaveDays = empLeaves
      .filter((l) => l.leaveTypeId !== unpaidLeaveType?.id)
      .reduce((sum, l) => sum + l.daysCount, 0);

    const payableDays = Math.min(totalWorkingDays, attendedEquivalent + paidLeaveDays);
    const absentDays = Math.max(0, totalWorkingDays - payableDays - unpaidDays);

    const dailyRate = gross / totalWorkingDays;
    const deductions = Math.round((absentDays + unpaidDays + halfDays * 0.5) * dailyRate);
    const earnedGross = Math.max(0, gross - deductions);

    const annualizedGross = earnedGross * 12;
    const annualTax = calculateAnnualTax(annualizedGross);
    const monthlyTax = Math.round(annualTax / 12);
    const netPay = Math.max(0, earnedGross - monthlyTax);

    const dept = departments.find((d) => d.id === emp.departmentId)?.name || 'General';
    const desg = designations.find((d) => d.id === emp.designationId)?.title || 'Staff';

    totalGross += gross;
    totalNet += netPay;
    totalTax += monthlyTax;

    items.push({
      id: crypto.randomUUID(),
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: dept,
      designation: desg,
      basic,
      hra,
      medical,
      gross,
      totalWorkingDays,
      presentDays,
      lateDays,
      halfDays,
      absentDays,
      unpaidLeaveDays: unpaidDays,
      payableDays: parseFloat(payableDays.toFixed(1)),
      earnedGross,
      unpaidDeductions: deductions,
      annualizedGross,
      monthlyTax,
      netPay,
    });
  }

  const payrollRun: PayrollRun = {
    id: crypto.randomUUID(),
    month: monthStr,
    status: 'DRAFT',
    totalGross,
    totalNet,
    totalTax,
    totalEmployees: items.length,
    createdAt: new Date().toISOString(),
    items,
  };

  return payrollRun;
}

export function savePayrollDraft(run: PayrollRun) {
  db.update((data) => {
    const existingIdx = data.payrolls.findIndex((p) => p.month === run.month);
    if (existingIdx !== -1) {
      if (data.payrolls[existingIdx].status === 'FINALIZED') {
        throw new Error('Cannot overwrite a finalized payroll run.');
      }
      data.payrolls[existingIdx] = run;
    } else {
      data.payrolls.unshift(run);
    }
  });
}

export function finalizePayroll(monthStr: string, adminName: string): PayrollRun | null {
  let finalizedRun: PayrollRun | null = null;
  db.update((data) => {
    const run = data.payrolls.find((p) => p.month === monthStr);
    if (!run) {
      throw new Error('Payroll run not found for month ' + monthStr);
    }
    if (run.status === 'FINALIZED') {
      throw new Error('Payroll run is already finalized and immutable.');
    }
    run.status = 'FINALIZED';
    run.finalizedBy = adminName;
    run.finalizedAt = new Date().toISOString();
    finalizedRun = run;

    // Send notification to all employees
    for (const item of run.items) {
      const emp = data.employees.find((e) => e.id === item.employeeId);
      if (emp?.userId) {
        data.notifications.push({
          id: crypto.randomUUID(),
          userId: emp.userId,
          title: 'Payslip Available',
          message: `Your payslip for ${monthStr} is now available for download. Net pay: PKR ${item.netPay.toLocaleString()}`,
          type: 'PAYROLL',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });
  return finalizedRun;
}
