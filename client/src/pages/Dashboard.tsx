import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { StatsCard } from '../components/StatsCard.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);

  const fetchKpis = async () => {
    try {
      const data = await api.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.getAISummary();
      setAiSummary(res.observations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleQuickCheckIn = async () => {
    setCheckInMsg(null);
    try {
      const res = await api.checkIn({ method: 'WEB' });
      setCheckInMsg(`✅ ${res.message}`);
      fetchKpis();
    } catch (err: any) {
      setCheckInMsg(`❌ ${err.message}`);
    }
  };

  const handleQuickCheckOut = async () => {
    setCheckInMsg(null);
    try {
      const res = await api.checkOut({});
      setCheckInMsg(`✅ ${res.message}`);
      fetchKpis();
    } catch (err: any) {
      setCheckInMsg(`❌ ${err.message}`);
    }
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Active Workspace
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-aurora-muted mt-1">
            System Status: <strong>Operational</strong> · Role: <span className="text-aurora-violet font-semibold">{role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aurora-violet/30 to-aurora-cyan/30 border border-aurora-violet/50 text-xs font-bold text-white hover:shadow-lg hover:shadow-aurora-violet/20 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="h-4 w-4 text-aurora-cyan animate-pulse" />
            <span>{loadingSummary ? 'Analyzing DB...' : 'Summarize with AI'}</span>
          </button>
        </div>
      </div>

      {/* Check In Toast/Message */}
      {checkInMsg && (
        <div className="p-3.5 rounded-2xl glass-panel border border-aurora-cyan/40 text-xs text-aurora-text flex items-center justify-between animate-in fade-in">
          <span>{checkInMsg}</span>
          <button onClick={() => setCheckInMsg(null)} className="text-aurora-muted hover:text-white">✕</button>
        </div>
      )}

      {/* AI Live Summary Card */}
      {aiSummary && (
        <div className="glass-panel p-6 rounded-3xl border border-aurora-cyan/30 bg-aurora-cyan/5 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2.5 mb-3 text-aurora-cyan font-heading font-bold text-sm">
            <Bot className="h-5 w-5" />
            <span>Executive AI Observation Brief (Grounded in Real DB Records)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSummary.map((obs, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-white/90 bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-aurora-cyan font-mono font-bold">{idx + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: obs }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Adaptive Stats Cards */}
      {role === 'ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Headcount"
            value={kpis?.headcount || 0}
            subtext="Active employees across all depts"
            icon={Users}
            color="violet"
            trend={{ value: 'Real-time Count', isPositive: true }}
          />
          <StatsCard
            title="Attendance Compliance"
            value={`${kpis?.attendanceRate || 100}%`}
            subtext={`${kpis?.presentToday || 0} Present · ${kpis?.lateToday || 0} Late`}
            icon={Clock}
            color="cyan"
            trend={{ value: `${kpis?.lateToday || 0} Late Arrivals`, isPositive: kpis?.lateToday === 0 }}
          />
          <StatsCard
            title="Total Monthly Payroll"
            value={`PKR ${(kpis?.totalPayrollCost || 0).toLocaleString()}`}
            subtext={`Avg PKR ${(kpis?.avgSalary || 0).toLocaleString()} per staff`}
            icon={CreditCard}
            color="mint"
            trend={{ value: `Month: ${kpis?.latestPayrollMonth || 'Active'}`, isPositive: true }}
          />
          <StatsCard
            title="Security Audit"
            value="Protected"
            subtext="Tamper-proof append-only feed"
            icon={ShieldCheck}
            color="rose"
            trend={{ value: 'Immutable', isPositive: true }}
          />
        </div>
      )}

      {role === 'HR' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Registered Workforce"
            value={kpis?.headcount || 0}
            subtext="Staff members managed"
            icon={Users}
            color="violet"
          />
          <StatsCard
            title="Today Present"
            value={kpis?.presentToday || 0}
            subtext="On-time arrivals before 09:15"
            icon={CheckCircle}
            color="mint"
          />
          <StatsCard
            title="Late Arrivals"
            value={kpis?.lateToday || 0}
            subtext="Arrivals recorded past 09:15"
            icon={AlertCircle}
            color="amber"
          />
          <StatsCard
            title="On Approved Leave"
            value={kpis?.onLeaveToday || 0}
            subtext="Official sanctioned absence"
            icon={CalendarDays}
            color="cyan"
          />
        </div>
      )}

      {role === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="My Attendance Events"
            value={kpis?.totalRecords || 0}
            subtext="Total check-ins logged"
            icon={Clock}
            color="cyan"
          />
          <StatsCard
            title="Late Flags Recorded"
            value={kpis?.lateDays || 0}
            subtext="3 late flags = 0.5-day deduction"
            icon={AlertCircle}
            color="amber"
          />
          <StatsCard
            title="Approved Leave Days"
            value={`${kpis?.totalApprovedLeaveDays || 0} days`}
            subtext="Sanctioned time off"
            icon={CalendarDays}
            color="mint"
          />
        </div>
      )}

      {/* Employee Quick Actions Widget */}
      {role === 'EMPLOYEE' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold font-heading text-white">Daily Web Check-In & Check-Out</h3>
            <p className="text-xs text-aurora-muted mt-1">
              Office start: 09:00 AM (15m grace period). Second check-in on the same day is strictly prohibited.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickCheckIn}
              className="px-5 py-2.5 rounded-xl bg-aurora-mint text-black font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-aurora-mint/20"
            >
              Check In Now
            </button>
            <button
              onClick={handleQuickCheckOut}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Check Out
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="px-4 py-2.5 rounded-xl border border-aurora-cyan/40 text-aurora-cyan hover:bg-aurora-cyan/10 text-xs font-semibold"
            >
              Camera & Geofence Mode →
            </button>
          </div>
        </div>
      )}

      {/* Admin / HR Department Distribution & Quick Actions */}
      {role !== 'EMPLOYEE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Headcount */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="text-base font-bold font-heading text-white mb-4">
              Headcount Distribution by Department
            </h3>
            {kpis?.deptHeadcount?.length === 0 ? (
              <p className="text-xs text-aurora-muted py-6 text-center">No departments created yet.</p>
            ) : (
              <div className="space-y-3">
                {kpis?.deptHeadcount?.map((dept: any) => (
                  <div key={dept.name} className="flex items-center justify-between text-xs">
                    <span className="text-aurora-text font-medium">{dept.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-aurora-violet to-aurora-cyan h-full rounded-full"
                          style={{
                            width: `${kpis.headcount > 0 ? (dept.count / kpis.headcount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white w-6 text-right">{dept.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Navigation Cards */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="text-base font-bold font-heading text-white mb-4">
              Core Operations Hub
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/employees')}
                className="p-3.5 rounded-2xl glass-card border border-white/5 text-left hover:border-aurora-violet/40 transition-all group"
              >
                <Users className="h-5 w-5 text-aurora-violet mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Employee Directory</h4>
                <p className="text-[11px] text-aurora-muted mt-0.5">Register & manage staff</p>
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="p-3.5 rounded-2xl glass-card border border-white/5 text-left hover:border-aurora-cyan/40 transition-all group"
              >
                <Clock className="h-5 w-5 text-aurora-cyan mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Attendance Board</h4>
                <p className="text-[11px] text-aurora-muted mt-0.5">Staff daily presence</p>
              </button>

              <button
                onClick={() => navigate('/leave')}
                className="p-3.5 rounded-2xl glass-card border border-white/5 text-left hover:border-aurora-mint/40 transition-all group"
              >
                <CalendarDays className="h-5 w-5 text-aurora-mint mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Leave Inbox</h4>
                <p className="text-[11px] text-aurora-muted mt-0.5">Approve requests</p>
              </button>

              <button
                onClick={() => navigate('/payroll')}
                className="p-3.5 rounded-2xl glass-card border border-white/5 text-left hover:border-aurora-amber/40 transition-all group"
              >
                <CreditCard className="h-5 w-5 text-aurora-amber mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Payroll Run</h4>
                <p className="text-[11px] text-aurora-muted mt-0.5">Monthly calculations</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
