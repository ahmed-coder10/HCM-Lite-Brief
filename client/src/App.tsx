import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';

import { Landing } from './pages/Landing.js';
import { Setup } from './pages/Setup.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Employees } from './pages/Employees.js';
import { Attendance } from './pages/Attendance.js';
import { Leave } from './pages/Leave.js';
import { Payroll } from './pages/Payroll.js';
import { AIAssistant } from './pages/AIAssistant.js';
import { Announcements } from './pages/Announcements.js';
import { Organization } from './pages/Organization.js';
import { AuditLog } from './pages/AuditLog.js';

import { Sidebar } from './components/Sidebar.js';
import { Topbar } from './components/Topbar.js';
import { CommandPalette } from './components/CommandPalette.js';

// Protected App Shell Layout
const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05060B] flex items-center justify-center text-aurora-cyan text-xs font-mono">
        Verifying Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-aurora-bg text-aurora-text flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated Workspace */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/audit-log" element={<AuditLog />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
