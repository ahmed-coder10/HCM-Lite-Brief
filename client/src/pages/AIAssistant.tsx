import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${user?.name}! I am your **HCM Lite AI Assistant** operating directly on your authorized system data. How can I assist you with people operations or policy inquiries today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.chatAI([...messages, userMsg]);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.content,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Failed to reach AI service or query timed out. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role || 'EMPLOYEE';

  const suggestionPills = [
    { label: 'Who is on leave today?', prompt: 'Who is on leave today?' },
    { label: '🇵🇰 Aj kon chutti pe hai? (Roman Urdu)', prompt: 'Aj kon chutti pe hai?' },
    { label: 'My leave balance', prompt: 'What is my leave balance?' },
    { label: 'Office hours & grace rule', prompt: 'What is the official attendance and grace policy?' },
    ...(role === 'EMPLOYEE'
      ? [{ label: '🛡️ Test Colleague Privacy (Refusal Demo)', prompt: "What is the salary of my colleague Ali Khan?" }]
      : [{ label: 'Summarize company payroll', prompt: 'Give me the current monthly payroll summary' }]),
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan text-white shadow-lg shadow-aurora-violet/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading text-white">
              AI Operations Assistant
            </h1>
            <p className="text-xs text-aurora-muted">
              Live DB Tool Calling · Roman Urdu Comprehension · Server-Side Scope Guard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30">
            {role} Scope
          </span>
          <button
            onClick={() =>
              setMessages([
                {
                  id: '1',
                  role: 'assistant',
                  content: `Conversation reset. How can I assist your ${role} workflow?`,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ])
            }
            className="p-2 rounded-xl text-aurora-muted hover:text-white hover:bg-white/5"
            title="Clear Chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggestion Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {suggestionPills.map((pill, i) => (
          <button
            key={i}
            onClick={() => handleSend(pill.prompt)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold glass-card border border-white/10 text-aurora-text hover:border-aurora-violet/40 hover:text-white whitespace-nowrap transition-all"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/10 p-5 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="h-8 w-8 rounded-xl bg-aurora-violet/20 border border-aurora-violet/40 flex items-center justify-center text-aurora-cyan shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-aurora-btnViolet text-white font-medium rounded-tr-none'
                  : 'glass-card border border-white/10 text-aurora-text rounded-tl-none shadow-md'
              }`}
            >
              <div
                className="prose prose-invert prose-xs leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-black/40 px-1 py-0.5 rounded font-mono text-[11px] text-aurora-cyan">$1</code>'),
                }}
              />
              <span className="block text-[9px] text-aurora-muted text-right mt-2 font-mono">
                {m.timestamp}
              </span>
            </div>

            {m.role === 'user' && (
              <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-aurora-cyan text-xs">
            <div className="h-8 w-8 rounded-xl bg-aurora-violet/20 border border-aurora-violet/40 flex items-center justify-center text-aurora-cyan animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Evaluating system database & compiling response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="glass-panel p-2 rounded-2xl border border-white/10 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask anything about attendance, leaves, payroll, or policies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none text-xs text-white placeholder-aurora-muted focus:outline-none px-3"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white disabled:opacity-40 transition-all shadow-md shadow-aurora-violet/20"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
