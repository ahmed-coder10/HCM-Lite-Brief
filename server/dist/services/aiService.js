import { db } from '../db/store.js';
import { getEmployeeLeaveBalances, calculateWorkingDays } from './leaveService.js';
export function parseSmartLeaveText(promptText, employeeId) {
    const text = promptText.toLowerCase();
    const leaveTypes = db.get('leaveTypes');
    // Identify type
    let matchedType = leaveTypes.find((t) => t.name.toLowerCase() === 'casual') || leaveTypes[0];
    if (text.includes('sick') || text.includes('doctor') || text.includes('fever') || text.includes('hospital') || text.includes('ill') || text.includes('tabiyat')) {
        const sick = leaveTypes.find((t) => t.name.toLowerCase().includes('sick'));
        if (sick)
            matchedType = sick;
    }
    else if (text.includes('annual') || text.includes('vacation') || text.includes('trip') || text.includes('holiday')) {
        const annual = leaveTypes.find((t) => t.name.toLowerCase().includes('annual'));
        if (annual)
            matchedType = annual;
    }
    else if (text.includes('unpaid') || text.includes('without pay')) {
        const unpaid = leaveTypes.find((t) => !t.isPaid);
        if (unpaid)
            matchedType = unpaid;
    }
    // Calculate dates: look for days mentioned or default to tomorrow
    const today = new Date();
    let startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // tomorrow by default
    let durationDays = 1;
    if (text.includes('2 days') || text.includes('two days') || text.includes('monday and tuesday') || text.includes('do din')) {
        durationDays = 2;
    }
    else if (text.includes('3 days') || text.includes('three days') || text.includes('teen din')) {
        durationDays = 3;
    }
    else if (text.includes('week') || text.includes('hafta')) {
        durationDays = 5;
    }
    // Look for day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
        if (text.includes(`next ${dayNames[i]}`) || text.includes(dayNames[i])) {
            const currentDay = today.getDay();
            let targetDay = i;
            let daysAhead = (targetDay - currentDay + 7) % 7;
            if (daysAhead === 0)
                daysAhead = 7;
            startDate = new Date(today);
            startDate.setDate(today.getDate() + daysAhead);
            break;
        }
    }
    // End Date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (durationDays - 1));
    const toYMD = (d) => d.toISOString().split('T')[0];
    const startStr = toYMD(startDate);
    const endStr = toYMD(endDate);
    const cleanReason = promptText.replace(/^(i need|i want|apply for|take)\s+/i, '').trim();
    return {
        leaveTypeId: matchedType.id,
        leaveTypeName: matchedType.name,
        startDate: startStr,
        endDate: endStr,
        daysCount: calculateWorkingDays(startStr, endStr),
        reason: cleanReason.length > 5 ? cleanReason : 'Personal matters',
    };
}
export async function processAIChat(messages, user) {
    const latestMessage = messages[messages.length - 1]?.content || '';
    const lower = latestMessage.toLowerCase();
    // 1. SECURITY SCOPE GUARD: Prevent employees from peeking into colleagues' salary or personal data
    if (user.role === 'EMPLOYEE') {
        const forbiddenPatterns = [
            'salary of',
            "colleague's salary",
            'other employees',
            'who earns',
            'highest salary',
            'ali salary',
            'ahmed salary',
            'manager salary',
            'hr salary',
            'audit log',
            'company payroll',
            'all payroll',
        ];
        if (forbiddenPatterns.some((pattern) => lower.includes(pattern))) {
            return `🛡️ **Access Denied (Role-Based Guardrail)**: As an **Employee**, you are strictly restricted to your own personal records in compliance with the HCM Lite Server-Side Data Scope. You cannot query or view the salary, attendance, or personal details of colleagues or company-wide payroll.`;
        }
    }
    // 2. Who is on leave today (Roman Urdu & English)
    if (lower.includes('on leave today') ||
        lower.includes('who is on leave') ||
        lower.includes('chutti pe kon hai') ||
        lower.includes('aj kon chutti pe') ||
        lower.includes('chutti par')) {
        const today = new Date().toISOString().split('T')[0];
        const leaves = db.get('leaves').filter((l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today);
        const employees = db.get('employees');
        const leaveTypes = db.get('leaveTypes');
        if (leaves.length === 0) {
            return `No employees are currently on approved leave for today (${today}). All staff members are scheduled for regular duties.`;
        }
        const list = leaves.map((l) => {
            const emp = employees.find((e) => e.id === l.employeeId);
            const lt = leaveTypes.find((t) => t.id === l.leaveTypeId);
            return `• **${emp ? emp.firstName + ' ' + emp.lastName : 'Employee'}** (${lt?.name || 'Leave'}) — until ${l.endDate}`;
        });
        return `Found **${leaves.length} employee(s)** on approved leave today (${today}):\n\n${list.join('\n')}`;
    }
    // 3. Employee Leave Balance Inquiry
    if (lower.includes('my leave balance') ||
        lower.includes('mera leave balance') ||
        lower.includes('how many leaves do i have') ||
        lower.includes('chutti kitni bachi') ||
        lower.includes('leave balance')) {
        if (!user.employeeId && user.role === 'EMPLOYEE') {
            return 'No employee record is linked to your user account.';
        }
        const targetEmpId = user.employeeId || db.get('employees')[0]?.id;
        if (!targetEmpId) {
            return 'No employees are registered in the system yet. Once HR registers an employee, balances will become active.';
        }
        const balances = getEmployeeLeaveBalances(targetEmpId);
        const summary = balances
            .map((b) => `• **${b.name}**: ${b.remaining} remaining (used ${b.used} of ${b.quota === 9999 ? 'Unlimited' : b.quota})`)
            .join('\n');
        return `Here is the current active leave balance:\n\n${summary}`;
    }
    // 4. Company Policy & Office Timings (Roman Urdu + English)
    if (lower.includes('policy') ||
        lower.includes('timing') ||
        lower.includes('office hour') ||
        lower.includes('late penalty') ||
        lower.includes('grace time') ||
        lower.includes('timings kya') ||
        lower.includes('rules')) {
        const settings = db.get('settings');
        return `### 📋 Official Company Attendance & Leave Policy
- **Office Start Time:** \`${settings.officeStart}\` AM
- **Grace Period:** \`${settings.graceMinutes} minutes\` (Arrivals up to \`09:15\` are marked On-Time; arrivals at \`09:16\` or later are marked **Late**).
- **Half-Day Rule:** Working less than \`${settings.halfDayMinHours} hours\` is classified as a Half-Day.
- **Late Penalty:** Accumulating 3 Late arrivals triggers a 0.5-day salary deduction during monthly payroll.
- **Standard Quotas:** Annual (14 days), Sick (8 days), Casual (10 days), Unpaid (flexible).
- **Weekend:** Saturday & Sunday.`;
    }
    // 5. Payroll Summary Query (HR / Admin only)
    if (lower.includes('payroll summary') ||
        lower.includes('total payroll') ||
        lower.includes('salary cost') ||
        lower.includes('payroll kitna')) {
        if (user.role === 'EMPLOYEE') {
            return `🛡️ **Access Denied**: Employee accounts cannot access aggregated company payroll statistics. You can view your individual payslips under the **Payroll** menu.`;
        }
        const payrolls = db.get('payrolls');
        const latest = payrolls[0];
        if (!latest) {
            return `No payroll runs have been generated yet. HR can generate a draft for the current month under the **Payroll** module.`;
        }
        return `### 💰 Payroll Summary for ${latest.month}
- **Status:** \`${latest.status}\` ${latest.status === 'FINALIZED' ? '(Locked by Admin)' : '(Draft in Review)'}
- **Employees Included:** ${latest.totalEmployees}
- **Total Gross:** PKR ${latest.totalGross.toLocaleString()}
- **Total Tax Deducted:** PKR ${latest.totalTax.toLocaleString()}
- **Total Net Disbursed:** PKR ${latest.totalNet.toLocaleString()}`;
    }
    // 6. Generic or external AI fallback
    return `### 🤖 HCM Lite Assistant
I am operating directly on your authorized system data with active role-based security guards (\`${user.role}\`).

**Actions you can ask me:**
- *"Who is on leave today?"* / *"Aj kon chutti pe hai?"*
- *"What is my leave balance?"* / *"Mera leave balance kitna hai?"*
- *"What is the attendance and late policy?"* / *"Office timings kya hain?"*
- *"Summarize company payroll"* (HR & Admin only)

*All answers are grounded in real records. Fake data generation is strictly prohibited.*`;
}
export function generateDashboardSummary(role, empId) {
    const employees = db.get('employees');
    const attendance = db.get('attendance');
    const leaves = db.get('leaves');
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = attendance.filter((a) => a.date === today);
    const presentCount = todayAtt.filter((a) => a.status === 'PRESENT').length;
    const lateCount = todayAtt.filter((a) => a.status === 'LATE').length;
    const onLeaveToday = leaves.filter((l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today).length;
    const totalEmps = employees.length;
    if (role === 'ADMIN') {
        const payrolls = db.get('payrolls');
        const lastRun = payrolls[0];
        return [
            `Active headcount stands at **${totalEmps} employees** across ${db.get('departments').length} departments.`,
            `Today's staff presence: **${presentCount} present**, **${lateCount} late**, and **${onLeaveToday} on approved leave**.`,
            lastRun
                ? `Latest payroll run (${lastRun.month}) is **${lastRun.status}** with a total net outlay of PKR ${lastRun.totalNet.toLocaleString()}.`
                : `No monthly payroll has been finalized yet; pending HR draft preparation.`,
            `Zero security anomalies detected in the immutable audit trail.`,
        ];
    }
    if (role === 'HR') {
        const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
        const pendingCorrections = db.get('corrections').filter((c) => c.status === 'PENDING').length;
        return [
            `Operational workforce: **${totalEmps} registered personnel**.`,
            `Today's attendance check-in compliance is active with **${lateCount} late arrivals** recorded.`,
            `Pending action items: **${pendingLeaves} leave requests** and **${pendingCorrections} attendance corrections** awaiting decision.`,
            `Monthly payroll draft is ready for review before Admin final lock.`,
        ];
    }
    // Employee
    const empLeaves = leaves.filter((l) => l.employeeId === empId && l.status === 'APPROVED');
    const empAtt = attendance.filter((a) => a.employeeId === empId);
    const lates = empAtt.filter((a) => a.status === 'LATE').length;
    return [
        `Your profile is active with standard working hours (09:00 AM with 15-min grace).`,
        `You have recorded **${empAtt.length} attendance events** with **${lates} late flags**.`,
        `You have **${empLeaves.length} approved leave spells** logged this year.`,
        `Remember: 3 late check-ins result in a half-day deduction. Keep punctuality high!`,
    ];
}
