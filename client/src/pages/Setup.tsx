import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Building2, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [officeStart, setOfficeStart] = useState('09:00');
  const [officeRadiusMeters, setOfficeRadiusMeters] = useState(150);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if setup already done
    const checkStatus = async () => {
      try {
        const res = await api.getStatus();
        if (res.setupCompleted) {
          navigate('/login');
        }
      } catch (err) {
        // ok
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.setup({
        companyName,
        adminName,
        adminEmail,
        adminPassword,
        officeStart,
        officeRadiusMeters,
      });

      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060B] flex items-center justify-center p-6 selection:bg-aurora-violet/30 selection:text-aurora-cyan">
      <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top Glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-aurora-violet/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-aurora-cyan/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan flex items-center justify-center shadow-lg shadow-aurora-violet/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">First-Run Organization Setup</h2>
            <p className="text-xs text-aurora-muted">HCM Lite · Empty System Initialization</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-aurora-rose/10 border border-aurora-rose/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1.5 font-mono">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
              <input
                type="text"
                required
                placeholder="e.g. Acme Tech Global"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1.5 font-mono">
                Office Start
              </label>
              <input
                type="text"
                value={officeStart}
                onChange={(e) => setOfficeStart(e.target.value)}
                placeholder="09:00"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1.5 font-mono">
                Geofence Radius
              </label>
              <input
                type="number"
                value={officeRadiusMeters}
                onChange={(e) => setOfficeRadiusMeters(Number(e.target.value))}
                placeholder="150m"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold text-aurora-cyan uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Primary Administrator Credentials
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1 font-mono">
                  Admin Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-aurora-violet"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1 font-mono">
                  Admin Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
                  <input
                    type="email"
                    required
                    placeholder="admin@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-aurora-violet"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1 font-mono">
                  Master Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-aurora-violet"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-aurora-violet/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Initializing Company...</span>
            ) : (
              <>
                <span>Complete Setup & Enter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
