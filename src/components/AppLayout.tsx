import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useRole } from '../context/RoleContext';

export function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/') return 'Clinical Overview';
    if (pathname === '/patients') return 'Patient Directory';
    if (pathname.startsWith('/patients/')) return 'Patient Clinical History';
    if (pathname === '/documents') return 'Document Repository';
    if (pathname === '/evidence') return 'Clinical Validation & Evidence Retrieval';
    if (pathname === '/reviews') return 'Discrepancy Review Queue';
    if (pathname === '/activity') return 'System Audit Trail';
    if (pathname === '/settings') return 'Settings & Demo Roles';
    return 'Jeevankura';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/70">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
