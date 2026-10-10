import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string | undefined;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-teal-700',
  subtitle,
  loading = false,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        'rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs transition-all',
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="skeleton mt-1.5 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {value !== undefined && value !== null ? value : '—'}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>

        <div className={`shrink-0 rounded bg-slate-100 p-2 border border-slate-200 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
