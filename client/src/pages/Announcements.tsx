import React, { useState, useEffect } from 'react';
import { Bell, Plus, AlertCircle, Sparkles, Send } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Announcement } from '../types/index.js';
import { Modal } from '../components/Modal.js';

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const list = await api.getAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.postAnnouncement({ title, content, priority });
      setCreateModal(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Module 09 · Communications
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Company Announcements</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Broadcast organizational updates, event schedules, and critical notices.
          </p>
        </div>

        {role !== 'EMPLOYEE' && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white text-xs font-bold shadow-lg shadow-aurora-violet/25 hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 text-aurora-muted text-xs">
            No company announcements posted yet.
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className={`glass-panel p-6 rounded-3xl border transition-all ${
                item.priority === 'URGENT'
                  ? 'border-aurora-rose/40 bg-aurora-rose/5 shadow-rose-950/20'
                  : 'border-white/10 hover:border-aurora-violet/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      item.priority === 'URGENT'
                        ? 'bg-aurora-rose/20 text-aurora-rose'
                        : 'bg-aurora-violet/20 text-aurora-violet'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">{item.title}</h3>
                    <p className="text-[11px] text-aurora-muted">
                      Posted by <strong>{item.authorName}</strong> ({item.authorRole}) ·{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {item.priority === 'URGENT' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-aurora-rose/20 text-aurora-rose border border-aurora-rose/30 animate-pulse">
                    URGENT
                  </span>
                )}
              </div>
              <p className="text-xs text-aurora-text leading-relaxed pl-12">{item.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Post Company Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hackathon Demo Schedule or Office Holiday Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="URGENT">Urgent Broadcast</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Announcement Content *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter message details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase"
          >
            Publish Announcement
          </button>
        </form>
      </Modal>
    </div>
  );
};
