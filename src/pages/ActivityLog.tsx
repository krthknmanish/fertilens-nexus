import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  RefreshCw,
  User,
  FileText,
  Search,
  RotateCcw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getActivity, getPatients } from '../services/api';
import type { ActivityEntry, PatientSummary } from '../types';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime, relativeTime } from '../utils/format';

export function ActivityLog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [patientFilter, setPatientFilter] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivity({
        patient_id: patientFilter || undefined,
        action: actionSearch.trim() || undefined,
        limit: 250,
      });
      setEntries(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to retrieve backend activity log.');
    } finally {
      setLoading(false);
    }
  }, [patientFilter, actionSearch]);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResetFilters = () => {
    setPatientFilter('');
    setActionSearch('');
  };

  const hasFilters = Boolean(patientFilter || actionSearch);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            System & Clinical Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically chronological log of document intakes, vector extractions, and staff reconciliations
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center gap-2">
        <select
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Patient Records</option>
          {patients.map((p) => (
            <option key={p.patient_id} value={p.patient_id}>
              {p.display_name} ({p.patient_id})
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            placeholder="Filter by action description (e.g. upload, resolve, index)…"
            className="w-full rounded border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="h-3 w-3 text-slate-400" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Table Content */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <LoadingState rows={9} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No activity events recorded"
          description={
            hasFilters
              ? 'No audit log entries matched your filter parameters.'
              : 'As document ingestions, indexings, and clinician review actions take place, events will appear here automatically.'
          }
          icon={<Activity className="h-7 w-7 text-slate-400" />}
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th scope="col" className="px-4 py-3">
                    Action Event
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Patient Reference
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Document Reference
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Operational Details
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Timestamp
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {entries.map((entry) => (
                  <tr key={entry.activity_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold text-slate-900 font-mono text-xs">
                          {entry.action}
                        </span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {entry.patient_id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/patients/${encodeURIComponent(entry.patient_id!)}`)}
                          className="font-medium hover:text-teal-700 hover:underline text-left inline-flex items-center gap-1"
                        >
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{entry.patient_display_name ?? entry.patient_id}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Document */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {entry.document_id ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs" title={entry.document_name ?? entry.document_id}>
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">
                            {entry.document_name ?? entry.document_id}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-slate-600 max-w-sm truncate" title={entry.details ?? ''}>
                      {entry.details ?? <span className="text-slate-400 italic">—</span>}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500 font-mono">
                      <span title={formatDateTime(entry.timestamp)}>
                        {relativeTime(entry.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
            <div>
              Total Audit Entries: <span className="font-medium text-slate-700">{entries.length}</span>
            </div>
            <div className="text-slate-400">
              Live audit stream from FastAPI backend
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
