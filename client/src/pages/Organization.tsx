import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Users,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Modal } from '../components/Modal.js';

export const Organization: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Create HR Modal
  const [hrModal, setHrModal] = useState(false);
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('Welcome@2026');

  // Add Dept Modal
  const [deptModal, setDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // Add Holiday Modal
  const [holidayModal, setHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const fetchOrgData = async () => {
    try {
      const [s, d, desg, h] = await Promise.all([
        api.getSettings(),
        api.getDepartments(),
        api.getDesignations(),
        api.getHolidays(),
      ]);
      setSettings(s);
      setDepartments(d);
      setDesignations(desg);
      setHolidays(h);

      if (user?.role === 'ADMIN') {
        const u = await api.getUsers().catch(() => []);
        setSystemUsers(u);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  const handleCreateHr = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.createHrLogin({
        name: hrName,
        email: hrEmail,
        password: hrPassword,
      });
      setHrModal(false);
      setHrName('');
      setHrEmail('');
      setMessage({ text: `✅ ${res.message}` });
      fetchOrgData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment({ name: deptName, code: deptCode });
      setDeptModal(false);
      setDeptName('');
      setDeptCode('');
      fetchOrgData();
    } catch (err: any) {
      setMessage({ text: `❌ ${err.message}`, isError: true });
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHoliday({ name: holidayName, date: holidayDate });
      setHolidayModal(false);
      setHolidayName('');
      setHolidayDate('');
      fetchOrgData();
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
            Module 02 · Company Structure & Policies
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Organization Configuration</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Departments, designations, public holidays, work hours, and HR login creation.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setHrModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white text-xs font-bold shadow-lg shadow-aurora-violet/25 hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create HR Login</span>
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

      {/* Grid: Settings, Departments, Holidays, System Logins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Policies */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-aurora-cyan" />
            <h3 className="text-sm font-bold text-white font-heading">Work Rules & Geofence</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-aurora-muted">Company Name:</span>
              <span className="font-bold text-white">{settings?.companyName || 'HCM Lite'}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-aurora-muted">Standard Office Start:</span>
              <span className="font-mono text-aurora-cyan">{settings?.officeStart || '09:00'} AM</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-aurora-muted">Arrival Grace Period:</span>
              <span className="font-mono text-aurora-mint">{settings?.graceMinutes || 15} minutes</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-aurora-muted">Minimum Full-Day Hours:</span>
              <span className="font-mono text-white">{settings?.halfDayMinHours || 5} hours</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-aurora-muted">Office Geofence Radius:</span>
              <span className="font-mono text-white">{settings?.officeRadiusMeters || 150} meters</span>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-aurora-violet" />
              <h3 className="text-sm font-bold text-white font-heading">Departments</h3>
            </div>
            {role === 'ADMIN' && (
              <button
                onClick={() => setDeptModal(true)}
                className="text-xs text-aurora-cyan hover:underline font-semibold"
              >
                + Add Department
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {departments.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs"
              >
                <span className="font-semibold text-white">{d.name}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-aurora-violet/20 text-aurora-violet">
                  {d.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Public Holidays */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-aurora-amber" />
              <h3 className="text-sm font-bold text-white font-heading">Public Holidays</h3>
            </div>
            {role === 'ADMIN' && (
              <button
                onClick={() => setHolidayModal(true)}
                className="text-xs text-aurora-amber hover:underline font-semibold"
              >
                + Add Holiday
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {holidays.length === 0 ? (
              <p className="text-xs text-aurora-muted py-4 text-center">No public holidays registered.</p>
            ) : (
              holidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs"
                >
                  <span className="font-semibold text-white">{h.name}</span>
                  <span className="font-mono text-aurora-cyan">{h.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System User Accounts (Admin Only) */}
        {role === 'ADMIN' && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-aurora-rose" />
              <h3 className="text-sm font-bold text-white font-heading">System Accounts</h3>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {systemUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-aurora-muted">{u.email}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      u.role === 'ADMIN'
                        ? 'bg-aurora-rose/20 text-aurora-rose'
                        : u.role === 'HR'
                        ? 'bg-aurora-amber/20 text-aurora-amber'
                        : 'bg-aurora-mint/20 text-aurora-mint'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create HR Modal */}
      <Modal
        isOpen={hrModal}
        onClose={() => setHrModal(false)}
        title="Create HR Operational Account"
      >
        <form onSubmit={handleCreateHr} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              HR Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fatima Zahra"
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="hr@company.com"
              value={hrEmail}
              onChange={(e) => setHrEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Initial Password *
            </label>
            <input
              type="text"
              required
              value={hrPassword}
              onChange={(e) => setHrPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase"
          >
            Create HR User
          </button>
        </form>
      </Modal>

      {/* Create Department Modal */}
      <Modal
        isOpen={deptModal}
        onClose={() => setDeptModal(false)}
        title="Add Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Artificial Intelligence"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Department Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-violet text-white font-bold text-xs uppercase"
          >
            Create Department
          </button>
        </form>
      </Modal>

      {/* Create Holiday Modal */}
      <Modal
        isOpen={holidayModal}
        onClose={() => setHolidayModal(false)}
        title="Add Public Holiday"
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Holiday Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Quaid-e-Azam Day"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Date *
            </label>
            <input
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-amber text-black font-bold text-xs uppercase"
          >
            Save Public Holiday
          </button>
        </form>
      </Modal>
    </div>
  );
};
