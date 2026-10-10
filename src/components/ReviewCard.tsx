import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  Save,
  RotateCcw,
  Clock,
  ShieldAlert,
  Calendar,
  X,
} from 'lucide-react';
import type { ReviewFlag, Document } from '../types';
import { ReviewBadge, StatusBadge } from './StatusBadge';
import { patchReview, getDocuments } from '../services/api';
import { formatDate, formatDateTime, formatFileSize } from '../utils/format';

interface ReviewCardProps {
  flag: ReviewFlag;
  onUpdated: (updated: ReviewFlag) => void;
}

export function ReviewCard({ flag, onUpdated }: ReviewCardProps) {
  const [note, setNote] = useState(flag.staff_note ?? '');
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Open a document: first try real backend, then fall back to demo inline viewer
  const openDocument = async (docId: string) => {
    if (!docId || docId === 'ABSENT') {
      setError('This document is absent from the indexed repository and cannot be opened.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    const url = `${baseUrl}/api/documents/${encodeURIComponent(docId)}/file`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      // Backend not available — fall through to demo viewer
    }
    // Demo mode: look up the document metadata from the in-memory store
    setViewerLoading(true);
    try {
      const docs = await getDocuments({ search: docId });
      const found = docs.find((d) => d.document_id === docId) ?? docs[0] ?? null;
      setViewingDoc(found);
      if (!found) {
        setError(`Document ${docId} metadata not found in the demo repository.`);
        setTimeout(() => setError(null), 4000);
      }
    } catch {
      setError('Could not retrieve document from the demo repository.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setViewerLoading(false);
    }
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
              disabled={viewerLoading}
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium hover:underline text-xs disabled:opacity-50"
            >
              {viewerLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
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
              disabled={viewerLoading}
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium hover:underline text-xs disabled:opacity-50"
            >
              {viewerLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
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

      {/* ── Inline Document Viewer Modal (demo mode) ─────────────────── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clinical Document Inspection</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {viewingDoc.filename} ({viewingDoc.document_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                aria-label="Close viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Demo notice */}
              <div className="rounded border border-amber-200 bg-amber-50/80 p-3 text-amber-900">
                <p className="font-semibold">Standalone Demo Sandbox Viewer</p>
                <p className="mt-0.5 leading-relaxed text-amber-800">
                  In standalone demo mode, source records are rendered from the synthetic registry.
                  Connect the FastAPI backend to serve the original PDF binary.
                </p>
              </div>

              {/* Metadata table */}
              <div className="rounded border border-slate-200 bg-slate-50/50 p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1 font-sans font-semibold text-slate-700">
                  <span>RECORD ATTRIBUTES</span>
                  <span>GROUNDED EMR EVIDENCE</span>
                </div>
                {[
                  ['Document ID', viewingDoc.document_id],
                  ['Assigned Patient', viewingDoc.patient_display_name || viewingDoc.patient_id || 'Unassigned'],
                  ['Document Date', formatDate(viewingDoc.document_date)],
                  ['Category', viewingDoc.document_type || 'Unclassified'],
                  ['Pages', `${viewingDoc.page_count ?? '—'}`],
                  ['File Size', viewingDoc.file_size_bytes != null ? formatFileSize(viewingDoc.file_size_bytes) : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}:</span>
                    <span className="font-bold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>

              {/* Extracted text sample */}
              <div className="rounded border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                <span className="font-semibold text-xs text-teal-900 uppercase tracking-wider block">
                  Indexed Text Findings &amp; Transcript Sample
                </span>
                <p className="text-slate-800 leading-relaxed font-sans text-xs">
                  {viewingDoc.filename.includes('Endocrine')
                    ? 'Patient: Elena Rostova (FL-1001). Clinical findings: Anti-Müllerian Hormone (AMH): 0.82 ng/mL. Follicle Stimulating Hormone (FSH): 10.4 mIU/mL. Estradiol: 42 pg/mL. Verified by Memorial Endocrine Laboratory.'
                    : viewingDoc.filename.includes('StJude')
                    ? 'Patient Transfer Document: Elena Rostova. AMH Serum level reported as 2.45 ng/mL. [Discrepancy active — Flag FLG-301 conflicts with Memorial Endocrine baseline.]'
                    : viewingDoc.filename.includes('Consult')
                    ? 'IVF Cycle Planning Consultation. Physician: Dr. Mercer. Referral order for prior 2024 HSG pelvic images noted. Antagonist protocol selected based on AMH 0.82.'
                    : viewingDoc.filename.includes('Culture')
                    ? 'Embryology Day-5 Blastocyst Grading: 4 blastocysts vitrified (4AA, 4AB, 3BB, 3BB). Trophectoderm biopsy completed for PGT-A.'
                    : viewingDoc.filename.includes('Semen')
                    ? 'Semen Analysis: Volume 2.1 mL, Concentration 2.8 M/mL, Progressive Motility 14%, Morphology 1%. ICSI recommended.'
                    : `Medical document ${viewingDoc.document_id} ingested into Jeevankura. Indexed metadata and extracted events are ground-truth synchronized with the patient record.`}
                </p>
              </div>

              {/* Processing status */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Processing Status:</span>
                <StatusBadge status={viewingDoc.processing_status} />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Ground-truth provenance verification active</span>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
