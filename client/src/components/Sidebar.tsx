import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Bot,
  Bell,
  Building2,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Leave Management', path: '/leave', icon: CalendarDays, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Payroll & Slips', path: '/payroll', icon: CreditCard, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, roles: ['ADMIN', 'HR', 'EMPLOYEE'], badge: 'AI' },
    { name: 'Announcements', path: '/announcements', icon: Bell, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Organization', path: '/organization', icon: Building2, roles: ['ADMIN', 'HR'] },
    { name: 'Audit Log', path: '/audit-log', icon: ShieldCheck, roles: ['ADMIN'], badge: 'Secure' },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan flex items-center justify-center shadow-lg shadow-aurora-violet/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white via-aurora-text to-aurora-cyan bg-clip-text text-transparent">
              HCM Lite
            </span>
            <span className="block text-[10px] font-mono tracking-wider uppercase text-aurora-muted">
              {role} Workspace
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-aurora-violet/20 text-white border border-aurora-violet/40 shadow-sm shadow-aurora-violet/20 font-semibold'
                    : 'text-aurora-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-aurora-muted truncate">{user?.email}</p>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                role === 'ADMIN'
                  ? 'bg-aurora-rose/20 text-aurora-rose border border-aurora-rose/30'
                  : role === 'HR'
                  ? 'bg-aurora-amber/20 text-aurora-amber border border-aurora-amber/30'
                  : 'bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30'
              }`}
            >
              {role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
