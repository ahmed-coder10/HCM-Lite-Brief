import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { AuditLog as AuditLogType } from '../types/index.js';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Module 09 · Security Governance
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Immutable Security Audit Feed</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Tamper-proof append-only ledger tracking all administrative, payroll, and auth events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Append-Only · Tamper Proof</span>
          </span>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl glass-card text-aurora-muted hover:text-white"
            title="Refresh feed"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
        <input
          type="text"
          placeholder="Filter audit entries by actor, action, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet"
        />
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-aurora-muted bg-white/5">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Entity</th>
                <th className="py-3.5 px-6">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-aurora-muted">
                    No matching audit entries.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-aurora-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <span className="text-[10px] font-mono font-bold text-aurora-cyan">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-aurora-violet/20 text-aurora-violet border border-aurora-violet/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-aurora-muted">
                      {log.entity}
                    </td>
                    <td className="py-4 px-6 text-aurora-text max-w-md leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
