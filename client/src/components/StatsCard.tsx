import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'violet' | 'cyan' | 'mint' | 'amber' | 'rose';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'violet',
  trend,
}) => {
  const colorMap = {
    violet: {
      bg: 'bg-aurora-violet/10',
      border: 'border-aurora-violet/30',
      iconBg: 'bg-aurora-violet/20 text-aurora-violet',
      glow: 'shadow-aurora-violet/10',
    },
    cyan: {
      bg: 'bg-aurora-cyan/10',
      border: 'border-aurora-cyan/30',
      iconBg: 'bg-aurora-cyan/20 text-aurora-cyan',
      glow: 'shadow-aurora-cyan/10',
    },
    mint: {
      bg: 'bg-aurora-mint/10',
      border: 'border-aurora-mint/30',
      iconBg: 'bg-aurora-mint/20 text-aurora-mint',
      glow: 'shadow-aurora-mint/10',
    },
    amber: {
      bg: 'bg-aurora-amber/10',
      border: 'border-aurora-amber/30',
      iconBg: 'bg-aurora-amber/20 text-aurora-amber',
      glow: 'shadow-aurora-amber/10',
    },
    rose: {
      bg: 'bg-aurora-rose/10',
      border: 'border-aurora-rose/30',
      iconBg: 'bg-aurora-rose/20 text-aurora-rose',
      glow: 'shadow-aurora-rose/10',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`glass-card p-5 rounded-2xl border ${scheme.border} relative overflow-hidden group shadow-lg ${scheme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-aurora-muted mb-1 font-mono">
            {title}
          </p>
          <h3 className="text-2xl font-bold font-heading text-white tracking-tight">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-aurora-muted mt-1.5 flex items-center gap-1.5">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${scheme.iconBg} transition-transform group-hover:scale-110 shadow-inner`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-aurora-mint' : 'text-aurora-amber'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[10px] text-aurora-muted font-mono">Real-time DB</span>
        </div>
      )}
    </div>
  );
};
