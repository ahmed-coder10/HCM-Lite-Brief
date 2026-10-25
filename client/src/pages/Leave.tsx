import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { LeaveBalance, LeaveRequest } from '../types/index.js';
import { Modal } from '../components/Modal.js';

export const Leave: React.FC = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Apply Leave Modal
  const [applyModal, setApplyModal] = useState(false);
  const [smartPrompt, setSmartPrompt] = useState('');
  const [parsingSmart, setParsingSmart] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // HR Review Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [balList, reqList] = await Promise.all([
        api.getLeaveBalances(),
        api.getLeaveRequests(),
      ]);
      setBalances(balList);
      setRequests(reqList);
      if (balList.length > 0 && !selectedLeaveTypeId) {
        setSelectedLeaveTypeId(balList[0].leaveTypeId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleSmartParse = async () => {
    if (!smartPrompt) return;
    setParsingSmart(true);
    setMessage(null);
    try {
      const res = await api.smartParseLeave(smartPrompt);
      const parsed = res.parsed;
      setSelectedLeaveTypeId(parsed.leaveTypeId);
      setStartDate(parsed.startDate);
      setEndDate(parsed.endDate);
      setReason(parsed.reason);
      setMessage({ text: '✨ Smart Leave pre-filled dates and type from your sentence!' });
    } catch (err: any) {
      setMessage({ text: 'Failed to parse natural language prompt.', isError: true });
    } finally {
      setParsingSmart(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.applyLeave({
        leaveTypeId: selectedLeaveTypeId,
        startDate,
        endDate,
        reason,
      });
      setApplyModal(false);
      setSmartPrompt('');
      setReason('');
      setMessage({ text: `✅ ${res.message}` });
      fetchLeaveData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setMessage(null);
    try {
      await api.reviewLeave(selectedRequest.id, {
        status,
        reviewComment,
      });
      setReviewModal(false);
      setSelectedRequest(null);
      setReviewComment('');
      setMessage({ text: `✅ Leave request ${status}.` });
      fetchLeaveData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await api.cancelLeave(id);
      setMessage({ text: '✅ Leave application cancelled.' });
      fetchLeaveData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Module 05 · Absence & Quotas
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Leave Management & Smart AI</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Dynamic balance calculation, weekend & holiday exclusion, smart leave natural language parsing.
          </p>
        </div>

        {role === 'EMPLOYEE' && (
          <button
            onClick={() => setApplyModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white text-xs font-bold shadow-lg shadow-aurora-violet/25 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="h-4 w-4 text-aurora-cyan animate-pulse" />
            <span>Apply with Smart Leave AI</span>
          </button>
        )}
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

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div
            key={b.leaveTypeId}
            className="glass-card p-4 rounded-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white font-heading">{b.name}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {b.quota === 9999 ? '∞' : b.remaining}
              </span>
              <span className="text-xs text-aurora-muted font-mono">
                / {b.quota === 9999 ? 'Flexible' : `${b.quota} days`}
              </span>
            </div>
            <p className="text-[11px] text-aurora-muted mt-1">Used: {b.used} days this year</p>
          </div>
        ))}
      </div>

      {/* Applications Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-heading">
            {role === 'EMPLOYEE' ? 'My Leave Applications' : 'Organization Leave Requests'}
          </h3>
          <span className="text-xs font-mono text-aurora-muted">Total: {requests.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-aurora-muted bg-white/5">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Leave Type</th>
                <th className="py-3.5 px-6">Dates & Working Days</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-aurora-muted">
                    No leave requests found. Click 'Apply with Smart Leave AI' to submit.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-semibold">
                      <div>{r.employeeName}</div>
                      <div className="text-[10px] font-mono text-aurora-cyan">{r.employeeCode}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{ backgroundColor: `${r.color}20`, color: r.color }}
                      >
                        {r.leaveTypeName}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      <div>{r.startDate} to {r.endDate}</div>
                      <span className="text-[10px] text-aurora-muted">({r.daysCount} working days)</span>
                    </td>
                    <td className="py-4 px-6 text-aurora-muted max-w-xs truncate">{r.reason}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          r.status === 'APPROVED'
                            ? 'bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30'
                            : r.status === 'REJECTED'
                            ? 'bg-aurora-rose/20 text-aurora-rose border border-aurora-rose/30'
                            : r.status === 'CANCELLED'
                            ? 'bg-white/10 text-aurora-muted'
                            : 'bg-aurora-amber/20 text-aurora-amber border border-aurora-amber/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {role === 'HR' && r.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(r);
                            setReviewModal(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-aurora-violet/20 hover:bg-aurora-violet/30 text-aurora-cyan font-semibold text-xs border border-aurora-violet/40"
                        >
                          Review
                        </button>
                      )}
                      {role === 'EMPLOYEE' && r.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelLeave(r.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal with Smart Leave AI Pre-fill */}
      <Modal
        isOpen={applyModal}
        onClose={() => setApplyModal(false)}
        title="Apply for Leave (Smart Leave AI)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Natural Language Prompt Assistant */}
          <div className="p-3.5 rounded-2xl bg-aurora-violet/10 border border-aurora-violet/30 space-y-2">
            <div className="flex items-center gap-2 text-aurora-cyan text-xs font-bold font-heading">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Smart Leave: Type in Plain English or Roman Urdu</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder='e.g. "I need 2 days off next Monday and Tuesday for my cousin wedding"'
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet"
              />
              <button
                type="button"
                onClick={handleSmartParse}
                disabled={parsingSmart || !smartPrompt}
                className="px-3.5 py-2 rounded-xl bg-aurora-cyan text-black font-bold text-xs hover:bg-cyan-300 transition-all shrink-0"
              >
                {parsingSmart ? 'Parsing...' : 'AI Pre-Fill'}
              </button>
            </div>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Leave Type *
              </label>
              <select
                required
                value={selectedLeaveTypeId}
                onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              >
                {balances.map((b) => (
                  <option key={b.leaveTypeId} value={b.leaveTypeId}>
                    {b.name} ({b.quota === 9999 ? 'Unlimited' : `${b.remaining} days remaining`})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Reason *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for absence..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-aurora-violet/25 transition-all"
            >
              Submit Leave Application
            </button>
          </form>
        </div>
      </Modal>

      {/* HR Review Modal */}
      {selectedRequest && (
        <Modal
          isOpen={reviewModal}
          onClose={() => setReviewModal(false)}
          title={`Review Leave Request · ${selectedRequest.employeeName}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 text-xs space-y-1.5">
              <div><strong>Type:</strong> {selectedRequest.leaveTypeName}</div>
              <div><strong>Dates:</strong> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.daysCount} working days)</div>
              <div><strong>Reason:</strong> {selectedRequest.reason}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Decision Remarks
              </label>
              <input
                type="text"
                placeholder="Optional HR comment..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleReview('APPROVED')}
                className="flex-1 py-2.5 rounded-xl bg-aurora-mint text-black font-bold text-xs uppercase"
              >
                Approve Leave
              </button>
              <button
                onClick={() => handleReview('REJECTED')}
                className="flex-1 py-2.5 rounded-xl bg-aurora-rose/20 border border-aurora-rose/40 text-rose-300 font-bold text-xs uppercase hover:bg-aurora-rose/30"
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
