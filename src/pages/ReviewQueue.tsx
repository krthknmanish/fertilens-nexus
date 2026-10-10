import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckSquare,
  RefreshCw,
  Filter,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { getReviews } from '../services/api';
import type { ReviewFlag } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Needs Review' },
  { value: 'reviewed', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: '', label: 'All Items' },
];

export function ReviewQueue() {
  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [conflictTypeFilter, setConflictTypeFilter] = useState('');
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviews(statusFilter || undefined);
      setFlags(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to retrieve review discrepancies.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = (updated: ReviewFlag) => {
    setFlags((prev) =>
      prev.map((f) => (f.flag_id === updated.flag_id ? updated : f)),
    );
    setAcknowledgement(`Record #${updated.flag_id} updated to status "${updated.review_status}". Audit log updated.`);
    setTimeout(() => setAcknowledgement(null), 5000);
  };

  // Discover distinct conflict types
  const distinctConflictTypes = Array.from(
    new Set(flags.map((f) => f.conflict_type).filter(Boolean)),
  );

  const filteredFlags = conflictTypeFilter
    ? flags.filter((f) => f.conflict_type === conflictTypeFilter)
    : flags;

  const pendingCount = flags.filter((f) => f.review_status === 'pending').length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Clinical Discrepancy & Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-record contradictions, dosage mismatches, and date conflicts requiring manual clinician reconciliation
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Mandatory Clinical Verification Directive */}
      <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Human Clinical Verification Protocol:</span> The system surfaces conflicting entries between scanned records. Staff must review primary PDFs and document reconciliation rationale before marking items resolved. The software does not automate clinical decisions.
        </div>
      </div>

      {/* Success Acknowledgement Toast / Banner */}
      {acknowledgement && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{acknowledgement}</span>
          </div>
          <button
            type="button"
            onClick={() => setAcknowledgement(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Sub-filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={[
                'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                statusFilter === f.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {distinctConflictTypes.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Conflict Category:</span>
            <select
              value={conflictTypeFilter}
              onChange={(e) => setConflictTypeFilter(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="">All Categories ({flags.length})</option>
              {distinctConflictTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Queue Content */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
              <div className="skeleton h-4 w-48" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-16 rounded" />
                <div className="skeleton h-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFlags.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'pending'
              ? 'No pending discrepancies in queue'
              : 'No discrepancy records match filter'
          }
          description={
            statusFilter === 'pending'
              ? 'All indexed patient documents currently have aligned dates, diagnostic values, and medication records.'
              : 'Try selecting another status tab or resetting the conflict category filter.'
          }
          icon={<CheckSquare className="h-7 w-7 text-slate-400" />}
          action={
            conflictTypeFilter ? (
              <button
                type="button"
                onClick={() => setConflictTypeFilter('')}
                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Category Filter</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredFlags.map((flag) => (
            <ReviewCard key={flag.flag_id} flag={flag} onUpdated={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
