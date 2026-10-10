import React from 'react';
import { AlertCircle, RefreshCw, Terminal, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ message, onRetry, compact = false }: ErrorStateProps) {
  const isConnectionRefused =
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('connection');

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-md border border-rose-200 bg-rose-50/50 py-10 px-6 text-center max-w-xl mx-auto">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-700 border border-rose-200">
        {isConnectionRefused ? (
          <WifiOff className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
      </div>

      <div className="space-y-1">
        <p className="font-bold text-rose-950 text-sm">
          {isConnectionRefused ? 'Backend Service Offline' : 'Clinical API Request Error'}
        </p>
        <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {isConnectionRefused && (
        <div className="rounded border border-rose-200/80 bg-white p-2.5 text-xs text-slate-700 text-left max-w-md space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Terminal className="h-3 w-3 text-slate-500" />
            <span>FastAPI Backend Expected:</span>
          </div>
          <p className="font-mono text-xs text-slate-600">
            http://127.0.0.1:8000
          </p>
          <p className="text-slate-500 text-xs">
            Start the backend agent or server, then click Retry to re-establish the connection.
          </p>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 transition-colors shadow-2xs"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
