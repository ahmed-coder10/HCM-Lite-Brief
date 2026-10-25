import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../services/api.js';
import { Notification } from '../types/index.js';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, onOpenCommandPalette }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
      } catch (err) {
        // silent fail
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 sticky top-0 z-30 glass-panel border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-aurora-muted hover:text-white hover:bg-white/5 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Quick Search / Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-aurora-muted hover:border-aurora-violet/40 hover:text-white transition-all shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-aurora-violet" />
          <span>Quick actions & jump to...</span>
          <kbd className="ml-3 px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-aurora-text">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Ask AI Pill */}
        <button
          onClick={() => navigate('/ai-assistant')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-aurora-violet/20 to-aurora-cyan/20 border border-aurora-violet/40 text-xs font-semibold text-aurora-cyan hover:shadow-lg hover:shadow-aurora-violet/20 hover:scale-[1.02] transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-aurora-cyan animate-pulse" />
          <span>Ask AI</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-aurora-muted hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-aurora-amber" /> : <Moon className="h-4 w-4 text-indigo-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-aurora-muted hover:text-white hover:bg-white/5 border border-white/10 relative transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-aurora-rose text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl border border-white/10 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-aurora-text">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-aurora-cyan hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-aurora-muted py-4">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        n.read ? 'bg-white/5 text-aurora-muted' : 'bg-aurora-violet/10 border border-aurora-violet/30 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-aurora-cyan">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-aurora-cyan" />}
                      </div>
                      <p className="text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
