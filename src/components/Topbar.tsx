import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, FlaskConical, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';
import { getHealth } from '../services/api';
import { useRole, type UserRole } from '../context/RoleContext';

export function Topbar({ title }: { title?: string }) {
  const { role, setRole } = useRole();
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await getHealth();
      setOnline(res.status !== 'standalone_demo');
    } catch {
      setOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, []);

  const roles: UserRole[] = [
    'Clinic Administrator',
    'Fertility Specialist',
    'Embryologist',
    'Nurse / Clinical Coordinator',
    'Records Officer',
  ];

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-6 shadow-2xs select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">
          {title || 'FertiLens Nexus'}
        </h1>
        <span className="text-slate-300 font-light hidden sm:inline">|</span>
        <span className="text-xs text-slate-500 font-normal hidden sm:inline">
          Evidence Retrieval Platform
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Switcher Pill */}
        <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-500 hidden md:inline font-medium">Demo Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
            title="Switch demo preview role"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Synthetic Demo Notice */}
        <div className="hidden lg:flex items-center gap-1.5 rounded border border-amber-300/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs">
          <FlaskConical className="h-3.5 w-3.5 text-amber-700" />
          <span>SYNTHETIC DEMO</span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          {online === null ? (
            <span className="text-slate-400">Verifying…</span>
          ) : online ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Backend API Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded" title="Operating with local synthetic demo persistence">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              <span>Standalone Demo</span>
            </div>
          )}

          <button
            type="button"
            onClick={checkHealth}
            disabled={checking}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Recheck API connection"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
