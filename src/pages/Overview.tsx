import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  CalendarDays,
  AlertCircle,
  Search,
  Upload,
  RefreshCw,
  Activity,
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  Clock,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats, Document } from '../types';
import { StatCard } from '../components/StatCard';
import { DocumentTable } from '../components/DocumentTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { relativeTime, formatDateTime } from '../utils/format';
import { UploadModal } from './UploadModal';

export function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to connect to FertiLens Nexora backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePatientSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientSearch.trim()) {
      navigate(`/patients?search=${encodeURIComponent(patientSearch.trim())}`);
    } else {
      navigate('/patients');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Clinic System Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Clinical Operations & Evidence Retrieval
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time longitudinal synchronization of synthetic fertility records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Refresh dashboard stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Patient Directory Quick-Find Bar */}
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-2xs">
        <form onSubmit={handlePatientSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Jump directly to a patient record by name or clinical ID (e.g., PT-001)…"
              className="w-full rounded border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-900 transition-colors"
          >
            Search Registry
          </button>
        </form>
      </div>

      {/* Main Operational Metrics */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {loading ? (
            <LoadingState type="cards" rows={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                title="Synthetic Patients"
                value={stats?.patient_count}
                icon={Users}
                iconColor="text-teal-700"
                subtitle="Clinical cohort registry"
                onClick={() => navigate('/patients')}
              />
              <StatCard
                title="Indexed Documents"
                value={stats?.document_count}
                icon={FileText}
                iconColor="text-slate-700"
                subtitle="Primary source PDFs"
                onClick={() => navigate('/documents')}
              />
              <StatCard
                title="Timeline Events"
                value={stats?.event_count}
                icon={CalendarDays}
                iconColor="text-slate-700"
                subtitle="Cross-encounter extractions"
                onClick={() => navigate('/patients/FL-1001')}
              />
              <StatCard
                title="Pending Discrepancies"
                value={stats?.pending_review_count}
                icon={AlertCircle}
                iconColor={
                  (stats?.pending_review_count ?? 0) > 0
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }
                subtitle="Requires clinician review"
                onClick={() => navigate('/reviews')}
              />
            </div>
          )}

          {/* Pending Discrepancy Alert Banner */}
          {(stats?.pending_review_count ?? 0) > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-100 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-amber-950">
                    {stats!.pending_review_count} Clinical Discrepanc{stats!.pending_review_count !== 1 ? 'ies' : 'y'} Awaiting Verification
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    Conflicting diagnostic measurements or visit dates detected between ingested records.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/reviews')}
                className="inline-flex items-center gap-1 rounded bg-amber-800 px-3 py-1.5 font-semibold text-white hover:bg-amber-900 transition-colors"
              >
                <span>Open Review Queue</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Secondary Layout: Recent Documents & Live Activity Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Recently Ingested Documents (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Recently Ingested Documents
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest PDF records processed by the extraction engine
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-0.5"
                >
                  <span>Repository View</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {loading ? (
                <LoadingState rows={4} />
              ) : (stats?.recent_documents?.length ?? 0) > 0 ? (
                <DocumentTable
                  documents={stats!.recent_documents as unknown as Document[]}
                  compact
                />
              ) : (
                <EmptyState
                  title="No documents ingested"
                  description="Upload a patient consultation or lab PDF to begin indexing."
                  action={
                    <button
                      type="button"
                      onClick={() => setShowUpload(true)}
                      className="inline-flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Upload Document</span>
                    </button>
                  }
                />
              )}
            </div>

            {/* Live Operational Audit Stream (5 cols) */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    System Audit Stream
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recent ingestion, query, and reconciliation activity
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/activity')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-0.5"
                >
                  <span>Full Audit Log</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {loading ? (
                <LoadingState rows={4} />
              ) : (stats?.recent_activity?.length ?? 0) > 0 ? (
                <div className="rounded-md border border-slate-200 bg-white divide-y divide-slate-100 shadow-2xs overflow-hidden">
                  {stats!.recent_activity.map((entry) => (
                    <div key={entry.activity_id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 font-mono">
                          {entry.action}
                        </span>
                        <span className="text-slate-400 font-mono text-xs" title={formatDateTime(entry.timestamp)}>
                          {relativeTime(entry.timestamp)}
                        </span>
                      </div>

                      {entry.patient_display_name && (
                        <p className="text-slate-600 mt-1">
                          Patient: <span className="font-medium text-slate-800">{entry.patient_display_name}</span>
                        </p>
                      )}

                      {entry.details && (
                        <p className="text-slate-500 mt-0.5 truncate" title={entry.details}>
                          {entry.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No audit events"
                  description="Activity will populate as staff interact with records."
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}
    </div>
  );
}
