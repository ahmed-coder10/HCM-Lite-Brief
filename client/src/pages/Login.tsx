import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Modal } from '../components/Modal.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forced password change state
  const [forceModal, setForceModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.user.forcePasswordChange) {
        setTempUser(res);
        setForceModal(true);
      } else {
        login(res.token, res.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForcedPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      // Temporarily store token so change-password request has Bearer
      localStorage.setItem('hcm_token', tempUser.token);
      await api.changePassword({ newPassword });

      login(tempUser.token, { ...tempUser.user, forcePasswordChange: false });
      setForceModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05060B] flex items-center justify-center p-6 selection:bg-aurora-violet/30 selection:text-aurora-cyan">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan flex items-center justify-center shadow-lg shadow-aurora-violet/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Sign In to HCM Lite</h2>
            <p className="text-xs text-aurora-muted">Role-Based Access Portal</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-aurora-rose/10 border border-aurora-rose/30 text-rose-300 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1.5 font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase tracking-wider mb-1.5 font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-aurora-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-aurora-violet/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span>Authenticating...</span> : <span>Sign In</span>}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-aurora-muted">
            New organization setup?{' '}
            <Link to="/setup" className="text-aurora-cyan font-semibold hover:underline">
              Run First-Run Setup
            </Link>
          </p>
        </div>
      </div>

      {/* Forced Password Reset Modal on First Employee Login */}
      <Modal
        isOpen={forceModal}
        onClose={() => setForceModal(false)}
        title="Security Notice: Set Permanent Password"
      >
        <p className="text-xs text-aurora-muted mb-4">
          This is your first time logging into HCM Lite. You must change your temporary password to a secure permanent password to continue.
        </p>
        <form onSubmit={handleForcedPasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-violet text-white font-bold text-xs uppercase tracking-wider hover:bg-aurora-btnViolet"
          >
            Save Password & Proceed
          </button>
        </form>
      </Modal>
    </div>
  );
};
