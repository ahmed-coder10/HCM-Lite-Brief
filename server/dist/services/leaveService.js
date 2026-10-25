import crypto from 'crypto';
import { db } from '../db/store.js';
// Checks if a date (YYYY-MM-DD) is a weekend or public holiday
export function isWorkingDay(dateStr) {
    const settings = db.get('settings');
    const holidays = db.get('publicHolidays');
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (settings.weekendDays.includes(dayOfWeek)) {
        return false;
    }
    const isHoliday = holidays.some((h) => h.date === dateStr);
    if (isHoliday) {
        return false;
    }
    return true;
}
// Calculate total working days in inclusive range [startDate, endDate]
export function calculateWorkingDays(startDateStr, endDateStr) {
    let count = 0;
    const current = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        if (isWorkingDay(dateStr)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
// Calculate remaining balance for an employee for each leave type
export function getEmployeeLeaveBalances(employeeId) {
    const leaveTypes = db.get('leaveTypes');
    const leaves = db.get('leaves').filter((l) => l.employeeId === employeeId && l.status === 'APPROVED');
    return leaveTypes.map((lt) => {
        const usedDays = leaves
            .filter((l) => l.leaveTypeId === lt.id)
            .reduce((sum, l) => sum + l.daysCount, 0);
        const remaining = lt.quotaDays === 9999 ? 9999 : Math.max(0, lt.quotaDays - usedDays);
        return {
            leaveTypeId: lt.id,
            name: lt.name,
            quota: lt.quotaDays,
            used: usedDays,
            remaining: remaining,
            isPaid: lt.isPaid,
            color: lt.color,
        };
    });
}
// Checks if date ranges overlap
export function doDatesOverlap(startA, endA, startB, endB) {
    return startA <= endB && startB <= endA;
}
export function applyLeave(params) {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = params;
    if (startDate > endDate) {
        return { success: false, message: 'Start date cannot be after end date.', code: 422 };
    }
    const daysCount = calculateWorkingDays(startDate, endDate);
    if (daysCount <= 0) {
        return { success: false, message: 'Selected date range contains no working days.', code: 422 };
    }
    const existingLeaves = db.get('leaves').filter((l) => l.employeeId === employeeId && (l.status === 'PENDING' || l.status === 'APPROVED'));
    const overlap = existingLeaves.some((l) => doDatesOverlap(startDate, endDate, l.startDate, l.endDate));
    if (overlap) {
        return {
            success: false,
            message: 'You already have an active or pending leave application covering these dates.',
            code: 422,
        };
    }
    const balances = getEmployeeLeaveBalances(employeeId);
    const targetBalance = balances.find((b) => b.leaveTypeId === leaveTypeId);
    if (!targetBalance) {
        return { success: false, message: 'Invalid leave type specified.', code: 404 };
    }
    if (targetBalance.quota !== 9999 && daysCount > targetBalance.remaining) {
        return {
            success: false,
            message: `Insufficient leave balance: requested ${daysCount} days, but only ${targetBalance.remaining} days remaining for ${targetBalance.name}.`,
            code: 422,
        };
    }
    const newLeave = {
        id: crypto.randomUUID(),
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        daysCount,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };
    db.update((data) => {
        data.leaves.push(newLeave);
        // Notification to HR users
        const hrUsers = data.users.filter((u) => u.role === 'HR' || u.role === 'ADMIN');
        for (const hr of hrUsers) {
            data.notifications.push({
                id: crypto.randomUUID(),
                userId: hr.id,
                title: 'New Leave Request',
                message: `An employee requested ${daysCount} day(s) ${targetBalance.name} leave.`,
                type: 'LEAVE',
                read: false,
                createdAt: new Date().toISOString(),
            });
        }
    });
    return { success: true, message: 'Leave request submitted successfully.', leave: newLeave };
}
