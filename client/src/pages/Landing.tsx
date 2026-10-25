import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Bot,
  Bell,
  Building2,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuroraCanvas } from '../components/AuroraCanvas.js';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const modules = [
    {
      code: 'M1',
      title: 'Auth & Access',
      desc: 'Strict server-side RBAC across 3 roles (Admin, HR, Employee) with JWT sessions.',
      icon: Lock,
      color: 'violet',
    },
    {
      code: 'M2',
      title: 'Organization Setup',
      desc: 'Configurable office hours, 15m grace rule, geofence radius, and public holidays.',
      icon: Building2,
      color: 'cyan',
    },
    {
      code: 'M3',
      title: 'Employees 360',
      desc: 'Directory search, department assignments, salary structures, and CSV export.',
      icon: Users,
      color: 'mint',
    },
    {
      code: 'M4',
      title: 'Attendance & Geofencing',
      desc: 'Server timestamping, 409 duplicate check guard, camera face detection & GPS checks.',
      icon: Clock,
      color: 'amber',
    },
    {
      code: 'M5',
      title: 'Leave & Smart AI',
      desc: 'Natural language smart leave parser, automatic working-day calculations, overlap checks.',
      icon: CalendarDays,
      color: 'rose',
    },
    {
      code: 'M6',
      title: 'Payroll Lite',
      desc: 'Gross 1.5x basic, absence deductions, FBR progressive tax slabs & PDF payslips.',
      icon: CreditCard,
      color: 'violet',
    },
    {
      code: 'M7',
      title: 'Dashboards & KPIs',
      desc: 'Dynamic headcount, attendance rates, late arrivals, and live AI summary generation.',
      icon: Sparkles,
      color: 'cyan',
    },
    {
      code: 'M8',
      title: 'AI Assistant',
      desc: 'Tool-calling chat, Roman Urdu comprehension, and strict colleague privacy guards.',
      icon: Bot,
      color: 'mint',
    },
    {
      code: 'M9',
      title: 'Comms & Audit',
      desc: 'Company noticeboard, real-time alerts, and append-only tamper-proof audit trail.',
      icon: ShieldCheck,
      color: 'amber',
    },
  ];

  const faqs = [
    {
      q: 'Does HCM Lite come preloaded with dummy employees?',
      a: 'No. In strict compliance with the Saylani Hackathon brief, the system initializes completely empty. The Admin initializes the organization, HR registers real staff members, and all charts reflect active app activity.',
    },
    {
      q: 'How does the AI Assistant enforce privacy?',
      a: 'Access control is checked on the server for every AI response. Employees cannot query colleagues\' salaries or personal records. Roman Urdu questions like "Mera leave balance kitna hai?" work natively.',
    },
    {
      q: 'How does the progressive tax calculation work?',
      a: 'Annualized gross is calculated and evaluated across exact income tax slabs (0-600k @ 0%, 600k-1.2M @ 5%, 1.2M-2.4M @ 30k+15%, 2.4M-3.6M @ 210k+25%, >3.6M @ 510k+35%), then divided into monthly payroll deductions.',
    },
    {
      q: 'Can employees check in multiple times or fake location?',
      a: 'A second check-in returns a strict HTTP 409 Conflict. If camera mode is used, the server evaluates client coordinates against the office GPS using Haversine formulas.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05060B] text-[#EEF1F8] selection:bg-aurora-violet/30 selection:text-aurora-cyan">
      {/* 2px Gradient Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aurora-violet via-aurora-cyan to-aurora-mint z-50" />

      {/* Public Navigation */}
      <nav className="sticky top-0 z-40 glass-panel border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan flex items-center justify-center shadow-lg shadow-aurora-violet/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-aurora-text to-aurora-cyan bg-clip-text text-transparent">
                HCM Lite
              </span>
              <span className="block text-[9px] font-mono tracking-widest uppercase text-aurora-muted">
                Saylani Hackathon Edition
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-aurora-muted">
            <a href="#modules" className="hover:text-white transition-colors">9 Modules</a>
            <a href="#timeline" className="hover:text-white transition-colors">Demo Journey</a>
            <a href="#ai-safety" className="hover:text-white transition-colors">AI Guardrails</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/setup')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-cyan text-white shadow-lg shadow-aurora-violet/25 hover:shadow-aurora-violet/40 hover:scale-[1.02] transition-all flex items-center gap-1.5"
            >
              <span>First-Run Setup</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aurora-violet/10 border border-aurora-violet/30 text-xs font-medium text-aurora-cyan mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Assisted Human Capital Management · Empty System Ready</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-heading tracking-tight text-white mb-6 leading-tight">
            Human capital, <br />
            <span className="bg-gradient-to-r from-aurora-violet via-aurora-cyan to-aurora-mint bg-clip-text text-transparent">
              answered with precision.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-aurora-muted leading-relaxed mb-8">
            Built for the Saylani Hackathon. Complete daily people operations with role-scoped
            governance for <strong>Admin</strong>, <strong>HR</strong>, and <strong>Employees</strong>.
            Zero pre-seeded mockups — every number is born from real workplace activity.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/setup')}
              className="px-6 py-3 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-semibold text-sm shadow-xl shadow-aurora-violet/30 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>Initialize Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl glass-panel text-white font-medium text-sm hover:border-white/20 transition-all"
            >
              Member Sign In
            </button>
          </div>
        </div>

        {/* 3D Aurora Glass Interactive Canvas */}
        <div className="max-w-4xl mx-auto mt-6">
          <AuroraCanvas />
        </div>

        {/* Capability Band */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Access Tiers', val: '3 Roles', sub: 'Admin · HR · Employee' },
            { label: 'Architecture', val: '9 Modules', sub: '25 Core Functionalities' },
            { label: 'Security & Scope', val: '100% Server', sub: 'Colleague Data Shielded' },
            { label: 'Initial State', val: 'Zero Seed', sub: 'Strict Brief Compliance' },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] font-mono text-aurora-muted uppercase tracking-wider block mb-1">
                {stat.label}
              </span>
              <span className="text-xl font-bold text-white font-heading block">{stat.val}</span>
              <span className="text-[11px] text-aurora-cyan mt-1 block">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9 Modules Bento Grid */}
      <section id="modules" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-aurora-violet">
            System Architecture
          </span>
          <h2 className="text-3xl font-bold font-heading text-white mt-2">
            Nine Modules. Seamlessly Connected.
          </h2>
          <p className="text-xs text-aurora-muted mt-2">
            Every screen operates on exact testable domain calculations with immutable audit tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div
              key={m.code}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-aurora-violet/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white/5 border border-white/10 text-aurora-cyan">
                  {m.code}
                </span>
                <div className="p-2.5 rounded-xl bg-aurora-violet/10 text-aurora-violet group-hover:scale-110 transition-transform">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-white font-heading mb-2">{m.title}</h3>
              <p className="text-xs text-aurora-muted leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5-Step Demo Timeline */}
      <section id="timeline" className="py-20 px-6 max-w-5xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-aurora-cyan">
            Judging Flow
          </span>
          <h2 className="text-3xl font-bold font-heading text-white mt-2">
            The 5-Minute Live Judging Journey
          </h2>
          <p className="text-xs text-aurora-muted mt-2">
            Follow this exact sequence during demonstration for maximum criteria evaluation.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: '01',
              title: 'Fresh Install & Admin Setup',
              desc: 'Admin initializes company name, office start time (09:00), 15-minute grace, and geofence coordinates. Then creates the HR user account.',
            },
            {
              step: '02',
              title: 'HR Employee Registration',
              desc: 'HR registers staff members (e.g. Ali and Fatima). System generates employee credentials with temporary password and forces reset upon first sign-in.',
            },
            {
              step: '03',
              title: 'Check-In & Smart Leave Request',
              desc: 'Employee logs in, performs web or camera check-in, and uses natural language Smart Leave: "I need 2 days off next Monday for my sister\'s wedding".',
            },
            {
              step: '04',
              title: 'HR Review & Monthly Payroll Draft',
              desc: 'HR approves leave, queries AI for attendance status, and generates the monthly payroll draft with automated progressive tax slabs.',
            },
            {
              step: '05',
              title: 'Admin Finalize & PDF Payslip',
              desc: 'Admin permanently locks payroll. Employee downloads their official PDF payslip and attempts to ask AI for a colleague\'s salary (strictly refused!).',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass-panel p-5 rounded-2xl border border-white/5 flex items-start gap-5 hover:border-aurora-cyan/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-aurora-cyan/10 border border-aurora-cyan/30 flex items-center justify-center font-mono font-bold text-aurora-cyan text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">{item.title}</h4>
                <p className="text-xs text-aurora-muted mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Guardrails Showcase */}
      <section id="ai-safety" className="py-20 px-6 max-w-4xl mx-auto border-t border-white/10">
        <div className="glass-panel p-8 rounded-3xl border border-aurora-violet/30 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-aurora-violet/20 text-aurora-violet">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-white">
                Live AI Safety & Scope Guard Demonstration
              </h3>
              <p className="text-xs text-aurora-muted">
                Server-side query evaluation prevents unauthorized cross-employee data leaks.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono uppercase text-aurora-muted block mb-1">
                Employee Query
              </span>
              <p className="text-sm text-aurora-text font-mono">
                "What is the salary of my colleague Ali Khan?"
              </p>
            </div>

            <div className="bg-aurora-rose/10 p-4 rounded-2xl border border-aurora-rose/30">
              <span className="text-[10px] font-mono uppercase text-aurora-rose font-bold block mb-1">
                Server Guardrail Response (Role: EMPLOYEE)
              </span>
              <p className="text-xs text-rose-200 leading-relaxed font-sans">
                🛡️ <strong>Access Denied (Role-Based Guardrail)</strong>: As an Employee, you are strictly
                restricted to your own personal records in compliance with the HCM Lite Server-Side Data Scope.
                You cannot query or view the salary, attendance, or personal details of colleagues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto border-t border-white/10">
        <h2 className="text-2xl font-bold font-heading text-white text-center mb-8">
          Frequently Answered Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-xs text-white"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-aurora-muted leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10 text-center text-xs text-aurora-muted">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>HCM Lite · Saylani Hackathon · Zaitoon Ashraf IT Park</p>
          <p className="font-mono text-[11px] text-aurora-cyan">Zero Seed · 100% Real Workplace Dynamics</p>
        </div>
      </footer>
    </div>
  );
};
