import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileCheck,
  Loader2,
  Save,
  RotateCcw,
  Clock,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import type { ReviewFlag } from '../types';
import { ReviewBadge } from './StatusBadge';
import { patchReview } from '../services/api';
import { formatDate, formatDateTime } from '../utils/format';

interface ReviewCardProps {
  flag: ReviewFlag;
  onUpdated: (updated: ReviewFlag) => void;
}

export function ReviewCard({ flag, onUpdated }: ReviewCardProps) {
  const [note, setNote] = useState(flag.staff_note ?? '');
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openDocument = (docId: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    const url = `${baseUrl}/api/documents/${encodeURIComponent(docId)}/file`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUpdate = async (newStatus: 'pending' | 'reviewed' | 'resolved', isNoteOnly = false) => {
    setSavingAction(isNoteOnly ? 'note' : newStatus);
    setError(null);
    setFeedback(null);

    try {
      const updated = await patchReview(flag.flag_id, {
        review_status: newStatus,
        staff_note: note.trim() || undefined,
      });

      onUpdated(updated);
      setFeedback(
        isNoteOnly
          ? 'Staff review note recorded successfully.'
          : `Review flag marked as "${newStatus}".`
      );

      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err: unknown) {
      // Preserve the user's note in state!
      const msg = err instanceof Error ? err.message : 'Backend update failed. Please try again.';
      setError(`${msg} Your entered notes have been preserved.`);
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">
                {flag.conflict_type}
              </span>
              <span className="font-mono text-xs text-slate-400">
                #{flag.flag_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject: <span className="font-medium text-slate-800">{flag.patient_display_name ?? flag.patient_id}</span> · Discrepant Field: <span className="font-mono text-slate-700">{flag.field_or_event}</span>
            </p>
          </div>
        </div>

        <ReviewBadge status={flag.review_status} />
      </div>

      {/* Side-by-side Conflicting Values Comparison */}
      <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Source Document A */}
        <div className="rounded border border-slate-200 bg-slate-50/70 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-500 pb-1.5 border-b border-slate-200/60 mb-2">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-xs">
              Recorded Finding A
            </span>
            {flag.date_a && (
              <span className="flex items-center gap-1 font-mono text-xs">
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDate(flag.date_a)}
              </span>
            )}
          </div>

          <div className="py-1">
            <p className="text-xs text-slate-500">Documented Value:</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 font-mono">
              {flag.value_a || '—'}
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-slate-500 truncate max-w-[180px]" title={flag.source_document_name_a ?? flag.source_document_id_a}>
              {flag.source_document_name_a ?? `Doc #${flag.source_document_id_a}`}
            </span>
            <button
              type="button"
              onClick={() => openDocument(flag.source_document_id_a)}
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium hover:underline text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Verify Doc A</span>
            </button>
          </div>
        </div>

        {/* Source Document B */}
        <div className="rounded border border-amber-200/80 bg-amber-50/40 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-500 pb-1.5 border-b border-amber-200/60 mb-2">
            <span className="font-semibold text-amber-900 uppercase tracking-wider text-xs">
              Recorded Finding B (Discrepant)
            </span>
            {flag.date_b && (
              <span className="flex items-center gap-1 font-mono text-xs">
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDate(flag.date_b)}
              </span>
            )}
          </div>

          <div className="py-1">
            <p className="text-xs text-slate-500">Documented Value:</p>
            <p className="text-sm font-semibold text-amber-900 mt-0.5 font-mono">
              {flag.value_b || '—'}
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
            <span className="text-slate-500 truncate max-w-[180px]" title={flag.source_document_name_b ?? flag.source_document_id_b}>
              {flag.source_document_name_b ?? `Doc #${flag.source_document_id_b}`}
            </span>
            <button
              type="button"
              onClick={() => openDocument(flag.source_document_id_b)}
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium hover:underline text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Verify Doc B</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Review Note Input */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={`note-${flag.flag_id}`} className="text-xs font-semibold text-slate-700">
            Clinic Staff Review Note & Reconciliation Record
          </label>
          <span className="text-xs text-slate-400">
            Audit logging enabled
          </span>
        </div>
        <textarea
          id={`note-${flag.flag_id}`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Document reason for reconciliation, physician consultation, or verification against original pathology/lab portal..."
          className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Clinical Caution Notice */}
      <div className="mt-2.5 flex items-start gap-2 rounded bg-slate-50 border border-slate-200/80 p-2 text-xs text-slate-600">
        <ShieldAlert className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Clinical Verification Mandate:</strong> The system surfaces differences without asserting truth. Clinic staff must verify the original medical record before resolving discrepancies.
        </span>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="mt-2 rounded bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800">
          {error}
        </div>
      )}

      {feedback && (
        <div className="mt-2 rounded bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Clock className="h-3 w-3" />
          <span>Logged {formatDateTime(flag.created_at)}</span>
          {flag.updated_at && (
            <span>· Updated {formatDateTime(flag.updated_at)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save note only */}
          <button
            type="button"
            onClick={() => handleUpdate(flag.review_status, true)}
            disabled={savingAction !== null}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
          >
            {savingAction === 'note' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3 text-slate-500" />
            )}
            <span>Save Note</span>
          </button>

          {/* Mark Reviewed */}
          {flag.review_status !== 'reviewed' && flag.review_status !== 'resolved' && (
            <button
              type="button"
              onClick={() => handleUpdate('reviewed')}
              disabled={savingAction !== null}
              className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800 hover:bg-blue-100 font-medium transition-colors disabled:opacity-50"
            >
              {savingAction === 'reviewed' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileCheck className="h-3 w-3 text-blue-600" />
              )}
              <span>Mark Reviewed</span>
            </button>
          )}

          {/* Mark Resolved */}
          {flag.review_status !== 'resolved' ? (
            <button
              type="button"
              onClick={() => handleUpdate('resolved')}
              disabled={savingAction !== null}
              className="inline-flex items-center gap-1 rounded bg-teal-600 border border-teal-700 px-3 py-1 text-white hover:bg-teal-700 font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {savingAction === 'resolved' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span>Mark Resolved</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdate('pending')}
              disabled={savingAction !== null}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
            >
              {savingAction === 'pending' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              <span>Reopen Flag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
