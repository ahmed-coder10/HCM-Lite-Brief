import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Lock,
  FileText,
  DollarSign,
  TrendingDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { PayrollRun, PayrollItem } from '../types/index.js';
import { Modal } from '../components/Modal.js';

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  const [employeeItem, setEmployeeItem] = useState<PayrollItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'EMPLOYEE') {
        const res = await api.getPayroll(selectedMonth).catch(() => null);
        if (res && res.item) {
          setEmployeeItem(res.item);
        } else {
          setEmployeeItem(null);
        }
      } else {
        const [list, detailed] = await Promise.all([
          api.getPayrolls(),
          api.getPayroll(selectedMonth).catch(() => null),
        ]);
        setPayrolls(list);
        setCurrentRun(detailed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth]);

  const handleGenerateDraft = async () => {
    setMessage(null);
    try {
      const res = await api.generatePayrollDraft(selectedMonth);
      setMessage({ text: `✅ ${res.message}` });
      fetchPayrollData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleFinalize = async () => {
    if (!confirm(`Are you sure you want to finalize payroll for ${selectedMonth}? Once locked by Admin, it is permanently immutable.`)) return;
    setMessage(null);
    try {
      const res = await api.finalizePayroll(selectedMonth);
      setMessage({ text: `🔒 ${res.message}` });
      fetchPayrollData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleDownloadPdf = (empId: string) => {
    const token = localStorage.getItem('hcm_token');
    const url = `/api/payroll/${selectedMonth}/payslip/${empId}`;
    window.open(url, '_blank');
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Module 06 · Compensation & Slabs
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Monthly Payroll & Payslips</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Gross 1.5x basic, absence deductions, FBR progressive tax slabs, immutable finalization lock.
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-aurora-violet"
          />

          {role === 'HR' && (!currentRun || currentRun.status === 'DRAFT') && (
            <button
              onClick={handleGenerateDraft}
              className="px-4 py-2 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white text-xs font-bold shadow-lg shadow-aurora-violet/25 hover:scale-[1.02] transition-all"
            >
              Generate Draft Run
            </button>
          )}

          {role === 'ADMIN' && currentRun && currentRun.status === 'DRAFT' && (
            <button
              onClick={handleFinalize}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-aurora-mint to-emerald-400 text-black text-xs font-bold shadow-lg hover:scale-[1.02] transition-all"
            >
              <Lock className="h-4 w-4" />
              <span>Finalize & Lock Month</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl glass-panel border text-xs flex items-center justify-between ${
            message.isError
              ? 'border-aurora-rose/40 text-rose-300 bg-aurora-rose/5'
              : 'border-aurora-mint/40 text-emerald-300 bg-aurora-mint/5'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-aurora-muted hover:text-white">✕</button>
        </div>
      )}

      {/* Employee View: Single Payslip Card */}
      {role === 'EMPLOYEE' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-aurora-cyan">
                {selectedMonth} Payslip
              </span>
              <h3 className="text-lg font-bold text-white font-heading">
                Monthly Compensation Summary
              </h3>
            </div>
            {employeeItem && (
              <button
                onClick={() => handleDownloadPdf(employeeItem.employeeId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aurora-violet/20 border border-aurora-violet/40 text-xs font-semibold text-aurora-cyan hover:bg-aurora-violet/30"
              >
                <Download className="h-4 w-4" />
                <span>PDF Payslip</span>
              </button>
            )}
          </div>

          {!employeeItem ? (
            <div className="py-12 text-center text-aurora-muted text-xs">
              No payslip has been prepared or published for {selectedMonth} yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-aurora-muted block text-[10px] uppercase font-mono">Working Days</span>
                  <span className="font-semibold text-white">
                    {employeeItem.payableDays} / {employeeItem.totalWorkingDays} days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-aurora-muted block text-[10px] uppercase font-mono">Total Deductions</span>
                  <span className="font-semibold text-aurora-amber">
                    PKR {(employeeItem.unpaidDeductions + employeeItem.monthlyTax).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Earnings & Net Breakdown */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Basic Salary:</span>
                  <span className="font-mono text-white">PKR {employeeItem.basic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">HRA (40%):</span>
                  <span className="font-mono text-white">PKR {employeeItem.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Medical Allowance (10%):</span>
                  <span className="font-mono text-white">PKR {employeeItem.medical.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10 font-bold">
                  <span className="text-white">Contracted Gross:</span>
                  <span className="font-mono text-aurora-cyan">PKR {employeeItem.gross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-aurora-amber">
                  <span>Absence & Late Penalties:</span>
                  <span className="font-mono">- PKR {employeeItem.unpaidDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-aurora-rose">
                  <span>Progressive Income Tax:</span>
                  <span className="font-mono">- PKR {employeeItem.monthlyTax.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-aurora-mint/10 border border-aurora-mint/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-aurora-mint">
                    Net Disbursed Take-Home
                  </span>
                  <div className="text-2xl font-bold font-heading text-white">
                    PKR {employeeItem.netPay.toLocaleString()}
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-aurora-mint" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin / HR View: Full Payroll Run Table */}
      {role !== 'EMPLOYEE' && (
        <div className="space-y-6">
          {/* Status Bar */}
          {currentRun && (
            <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-white/10">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    currentRun.status === 'FINALIZED'
                      ? 'bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30'
                      : 'bg-aurora-amber/20 text-aurora-amber border border-aurora-amber/30'
                  }`}
                >
                  {currentRun.status === 'FINALIZED' ? 'FINALIZED (LOCKED)' : 'DRAFT (EDITABLE)'}
                </span>
                <span className="text-xs text-aurora-muted">
                  Employees: <strong>{currentRun.totalEmployees}</strong> · Total Net Outlay:{' '}
                  <strong className="text-white font-mono">
                    PKR {currentRun.totalNet.toLocaleString()}
                  </strong>
                </span>
              </div>
              {currentRun.finalizedBy && (
                <span className="text-[11px] text-aurora-muted">
                  Finalized by {currentRun.finalizedBy} on{' '}
                  {new Date(currentRun.finalizedAt || '').toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Table */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-aurora-muted bg-white/5">
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Gross Pay</th>
                    <th className="py-3.5 px-6">Payable Days</th>
                    <th className="py-3.5 px-6">Deductions</th>
                    <th className="py-3.5 px-6">Monthly Tax</th>
                    <th className="py-3.5 px-6">Net Take-Home</th>
                    <th className="py-3.5 px-6 text-right">Payslip PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white">
                  {!currentRun || currentRun.items?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-aurora-muted">
                        No payroll run created for {selectedMonth}. Click 'Generate Draft Run' to calculate.
                      </td>
                    </tr>
                  ) : (
                    currentRun.items.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-semibold">
                          <div>{item.employeeName}</div>
                          <div className="text-[10px] font-mono text-aurora-cyan">{item.employeeCode}</div>
                        </td>
                        <td className="py-4 px-6 text-aurora-muted">{item.department}</td>
                        <td className="py-4 px-6 font-mono font-bold">
                          PKR {item.gross.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-mono text-aurora-text">
                          {item.payableDays} / {item.totalWorkingDays}
                        </td>
                        <td className="py-4 px-6 font-mono text-aurora-amber">
                          - PKR {item.unpaidDeductions.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-mono text-aurora-rose">
                          - PKR {item.monthlyTax.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-aurora-mint">
                          PKR {item.netPay.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownloadPdf(item.employeeId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-aurora-violet/20 border border-white/10 text-xs font-semibold text-aurora-cyan"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
