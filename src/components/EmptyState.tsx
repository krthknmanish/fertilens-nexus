import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-4 text-center rounded border border-dashed border-slate-200 bg-slate-50/40">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-400 border border-slate-200">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-xs">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
