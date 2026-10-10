import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Search,
  CheckSquare,
  Activity,
  Microscope,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export function Sidebar() {
  const { role, permissions } = useRole();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview', end: true, show: permissions.canViewOverview },
    { to: '/patients', icon: Users, label: 'Patient History', end: false, show: permissions.canViewPatients },
    { to: '/documents', icon: FolderOpen, label: 'Document Repository', end: false, show: permissions.canManageDocuments },
    { to: '/evidence', icon: Search, label: 'Clinical Validation', end: false, show: permissions.canSearchEvidence },
    { to: '/reviews', icon: CheckSquare, label: 'Review Queue', end: false, show: permissions.canReviewDiscrepancies },
    { to: '/activity', icon: Activity, label: 'Activity Log', end: false, show: permissions.canViewAuditLog },
    { to: '/settings', icon: Settings, label: 'Settings & Roles', end: false, show: permissions.canAccessSettings },
  ];

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-teal-400 border border-slate-800">
          <Microscope className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-900 leading-tight">Jeevankura</span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1 rounded border border-teal-200 leading-tight">
              EMR
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">
            Fertility Clinical Intelligence
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="px-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Workspace</span>
          <span className="text-xs text-teal-700 font-mono font-medium truncate max-w-[85px]" title={role}>
            {role.split(' ')[0]}
          </span>
        </div>

        {navItems
          .filter((item) => item.show)
          .map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-teal-400' : 'text-slate-400',
                    ].join(' ')}
                  />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Role Scoped Indicator */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 text-xs">
        <div className="text-slate-400 text-xs uppercase font-semibold">Active Role:</div>
        <div className="font-semibold text-slate-800 truncate" title={role}>
          {role}
        </div>
      </div>

      {/* Clinical Disclaimer & Version */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
          <span>Clinical EMR Sandbox</span>
        </div>
        <p className="text-slate-400 leading-snug">
          Synthetic patient data only. Cross-examine primary documents for medical decisions.
        </p>
        <p className="text-slate-400 pt-1 font-mono text-xs">
          v1.0.0 · Jeevankura Core
        </p>
      </div>
    </aside>
  );
}
