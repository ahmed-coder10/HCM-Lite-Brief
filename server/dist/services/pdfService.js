import PDFDocument from 'pdfkit';
export function generatePayslipPdf(item, settings, monthStr) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 45, size: 'A4' });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            // Colors
            const primaryColor = '#5B3EE8';
            const textColor = '#1E293B';
            const mutedColor = '#64748B';
            // Header Banner
            doc.rect(45, 45, 505, 55).fill(primaryColor);
            doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold');
            doc.text(settings.companyName || 'HCM Lite Enterprise', 60, 58);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Official Salary Statement — Month of ${monthStr}`, 60, 80);
            // Metadata section
            doc.moveDown(2);
            doc.fillColor(textColor);
            const startY = 120;
            doc.fontSize(10).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 45, startY);
            doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
            doc.text(`Employee Name:`, 45, startY + 18);
            doc.text(`Employee Code:`, 45, startY + 34);
            doc.text(`Department:`, 45, startY + 50);
            doc.text(`Designation:`, 45, startY + 66);
            doc.font('Helvetica-Bold').fillColor(textColor);
            doc.text(item.employeeName, 140, startY + 18);
            doc.text(item.employeeCode, 140, startY + 34);
            doc.text(item.department, 140, startY + 50);
            doc.text(item.designation, 140, startY + 66);
            // Attendance summary on right
            doc.fontSize(10).font('Helvetica-Bold').text('ATTENDANCE SUMMARY', 320, startY);
            doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
            doc.text(`Working Days:`, 320, startY + 18);
            doc.text(`Present Days:`, 320, startY + 34);
            doc.text(`Half / Late Days:`, 320, startY + 50);
            doc.text(`Absent / Unpaid:`, 320, startY + 66);
            doc.font('Helvetica-Bold').fillColor(textColor);
            doc.text(`${item.totalWorkingDays} days`, 430, startY + 18);
            doc.text(`${item.presentDays} days`, 430, startY + 34);
            doc.text(`${item.halfDays} / ${item.lateDays}`, 430, startY + 50);
            doc.text(`${item.absentDays} / ${item.unpaidLeaveDays}`, 430, startY + 66);
            // Divider
            doc.moveTo(45, startY + 95).lineTo(550, startY + 95).strokeColor('#E2E8F0').stroke();
            // Table Header: Earnings vs Deductions
            const tableY = startY + 110;
            doc.rect(45, tableY, 245, 24).fill('#F1F5F9');
            doc.rect(305, tableY, 245, 24).fill('#F1F5F9');
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10);
            doc.text('EARNINGS', 55, tableY + 7);
            doc.text('AMOUNT (PKR)', 195, tableY + 7);
            doc.text('DEDUCTIONS', 315, tableY + 7);
            doc.text('AMOUNT (PKR)', 455, tableY + 7);
            // Rows
            let rowY = tableY + 32;
            doc.fillColor(textColor).font('Helvetica').fontSize(9);
            // Basic
            doc.text('Basic Salary', 55, rowY);
            doc.text(item.basic.toLocaleString(), 200, rowY, { align: 'right', width: 80 });
            doc.text('Absence & Unpaid Penalty', 315, rowY);
            doc.text(item.unpaidDeductions.toLocaleString(), 460, rowY, { align: 'right', width: 80 });
            // HRA
            rowY += 20;
            doc.text('House Rent Allowance (HRA)', 55, rowY);
            doc.text(item.hra.toLocaleString(), 200, rowY, { align: 'right', width: 80 });
            doc.text('Income Tax (Progressive)', 315, rowY);
            doc.text(item.monthlyTax.toLocaleString(), 460, rowY, { align: 'right', width: 80 });
            // Medical
            rowY += 20;
            doc.text('Medical Allowance (10%)', 55, rowY);
            doc.text(item.medical.toLocaleString(), 200, rowY, { align: 'right', width: 80 });
            doc.text('Other Deductions', 315, rowY);
            doc.text('0', 460, rowY, { align: 'right', width: 80 });
            // Total Row
            rowY += 30;
            doc.rect(45, rowY - 5, 245, 22).fill('#F8FAFC');
            doc.rect(305, rowY - 5, 245, 22).fill('#F8FAFC');
            doc.fillColor(textColor).font('Helvetica-Bold');
            doc.text('Total Gross', 55, rowY);
            doc.text(`PKR ${item.gross.toLocaleString()}`, 170, rowY, { align: 'right', width: 110 });
            const totalDeductions = item.unpaidDeductions + item.monthlyTax;
            doc.text('Total Deductions', 315, rowY);
            doc.text(`PKR ${totalDeductions.toLocaleString()}`, 430, rowY, { align: 'right', width: 110 });
            // Net Take Home Box
            const netY = rowY + 45;
            doc.rect(45, netY, 505, 55).fill('#F5F3FF');
            doc.rect(45, netY, 505, 55).strokeColor(primaryColor).stroke();
            doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold');
            doc.text('NET TAKE HOME SALARY', 65, netY + 12);
            doc.fontSize(18).text(`PKR ${item.netPay.toLocaleString()}`, 65, netY + 28);
            doc.fontSize(9).font('Helvetica').fillColor(mutedColor);
            doc.text(`Payable Days: ${item.payableDays} / ${item.totalWorkingDays}`, 380, netY + 18);
            doc.text(`Status: Official & Bank Disbursed`, 380, netY + 34);
            // Footer
            const footerY = 720;
            doc.fontSize(8).fillColor(mutedColor).font('Helvetica');
            doc.text('This is a computer-generated document from HCM Lite. No physical signature is required.', 45, footerY, {
                align: 'center',
                width: 505,
            });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
