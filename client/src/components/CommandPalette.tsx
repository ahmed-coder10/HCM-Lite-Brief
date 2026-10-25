import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Bot,
  Bell,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const actions = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Employees Directory', path: '/employees', icon: Users, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Attendance & Check-In', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Leave Applications', path: '/leave', icon: CalendarDays, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Payroll & Payslips', path: '/payroll', icon: CreditCard, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Ask AI Assistant', path: '/ai-assistant', icon: Bot, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Company Announcements', path: '/announcements', icon: Bell, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Organization Setup', path: '/organization', icon: Building2, roles: ['ADMIN', 'HR'] },
    { name: 'Security Audit Trail', path: '/audit-log', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  const allowed = actions.filter((a) => a.roles.includes(user?.role || 'EMPLOYEE'));
  const filtered = allowed.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="h-5 w-5 text-aurora-violet" />
          <input
            type="text"
            placeholder="Type a screen or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-aurora-muted"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-aurora-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-aurora-muted py-6">No matching screens found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-aurora-muted hover:text-white hover:bg-aurora-violet/20 hover:border-aurora-violet/30 border border-transparent transition-all group"
              >
                <item.icon className="h-4 w-4 text-aurora-cyan group-hover:scale-110 transition-transform" />
                <span className="flex-1 text-left text-sm text-aurora-text group-hover:text-white">
                  {item.name}
                </span>
                <span className="text-[10px] text-aurora-muted uppercase font-mono">Navigate</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
