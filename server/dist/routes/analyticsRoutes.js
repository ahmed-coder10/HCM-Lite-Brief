import { Router } from 'express';
import { db } from '../db/store.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
router.get('/kpis', authenticateToken, (req, res) => {
    const user = req.user;
    const employees = db.get('employees');
    const departments = db.get('departments');
    const attendanceList = db.get('attendance');
    const leaves = db.get('leaves');
    const payrolls = db.get('payrolls');
    const today = new Date().toISOString().split('T')[0];
    const activeEmps = employees.filter((e) => e.status !== 'TERMINATED');
    // Employee specific KPIs
    if (user.role === 'EMPLOYEE') {
        const empAtt = attendanceList.filter((a) => a.employeeId === user.employeeId);
        const present = empAtt.filter((a) => a.status === 'PRESENT').length;
        const late = empAtt.filter((a) => a.status === 'LATE').length;
        const halfDay = empAtt.filter((a) => a.status === 'HALF_DAY').length;
        const empLeaves = leaves.filter((l) => l.employeeId === user.employeeId && l.status === 'APPROVED');
        const totalApprovedLeaveDays = empLeaves.reduce((sum, l) => sum + l.daysCount, 0);
        return res.json({
            role: 'EMPLOYEE',
            presentDays: present,
            lateDays: late,
            halfDays: halfDay,
            totalApprovedLeaveDays,
            totalRecords: empAtt.length,
        });
    }
    // Company / HR KPIs
    const todayAtt = attendanceList.filter((a) => a.date === today);
    const presentToday = todayAtt.filter((a) => a.status === 'PRESENT').length;
    const lateToday = todayAtt.filter((a) => a.status === 'LATE').length;
    const onLeaveToday = leaves.filter((l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today).length;
    const totalEmps = activeEmps.length;
    const absentToday = Math.max(0, totalEmps - (presentToday + lateToday + onLeaveToday));
    // Department distribution
    const deptHeadcount = departments.map((d) => {
        const count = activeEmps.filter((e) => e.departmentId === d.id).length;
        return { name: d.name, count };
    });
    // Payroll aggregates
    const latestPayroll = payrolls[0];
    const totalPayrollCost = latestPayroll ? latestPayroll.totalGross : activeEmps.reduce((sum, e) => sum + (e.salary?.gross || 0), 0);
    const avgSalary = totalEmps > 0 ? Math.round(totalPayrollCost / totalEmps) : 0;
    // Attendance rate calculation
    const totalCheckedIn = presentToday + lateToday;
    const attendanceRate = totalEmps > 0 ? Math.round((totalCheckedIn / totalEmps) * 100) : 100;
    const latePercentage = totalCheckedIn > 0 ? Math.round((lateToday / totalCheckedIn) * 100) : 0;
    res.json({
        role: user.role,
        headcount: totalEmps,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        attendanceRate,
        latePercentage,
        totalPayrollCost,
        avgSalary,
        deptHeadcount,
        latestPayrollMonth: latestPayroll?.month || 'None',
    });
});
export default router;
