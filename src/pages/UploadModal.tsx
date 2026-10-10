import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { getPatients, uploadDocument } from '../services/api';
import type { PatientSummary } from '../types';
import { formatFileSize } from '../utils/format';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialPatientId?: string;
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function UploadModal({
  onClose,
  onSuccess,
  initialPatientId = '',
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState<string>(initialPatientId);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    message: string;
    requiresReview: boolean;
    documentId?: string;
  } | null>(null);

  useEffect(() => {
    setPatientsLoading(true);
    getPatients()
      .then((data) => setPatients(data))
      .catch(() => setPatients([]))
      .finally(() => setPatientsLoading(false));
  }, []);

  const validateAndSetFile = (f: File) => {
    setValidationError(null);
    setServerError(null);

    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Unsupported file format. Only clinical PDF records (.pdf) are accepted.');
      setFile(null);
      return false;
    }

    if (f.size > MAX_SIZE_BYTES) {
      setValidationError(`Document exceeds maximum threshold of ${formatFileSize(MAX_SIZE_BYTES)}. Selected: ${formatFileSize(f.size)}.`);
      setFile(null);
      return false;
    }

    setFile(f);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const computeSHA256 = async (f: File): Promise<string> => {
    try {
      const buffer = await f.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setValidationError('Please select or drop a PDF document to upload.');
      return;
    }

    setUploading(true);
    setServerError(null);

    // Compute cryptographic SHA-256 hash for duplicate detection
    const sha256 = await computeSHA256(file);

    // Prepare multipart FormData
    const formData = new FormData();
    formData.append('file', file);
    if (sha256) {
      formData.append('sha256', sha256);
    }
    if (patientId.trim()) {
      formData.append('patient_id', patientId.trim());
    }

    try {
      const response = await uploadDocument(formData);
      setUploadResult({
        message: response.message || 'Document successfully received by intake pipeline.',
        requiresReview: response.requires_staff_review,
        documentId: response.document_id,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload transmission failed.';
      setServerError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-100 text-teal-800">
              <FileUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Document Intake & Indexing
              </h3>
              <p className="text-xs text-slate-500">
                Upload clinical consultation, lab, or scan PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {uploadResult ? (
          /* Confirmation Screen */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Upload Confirmed by Server
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                {uploadResult.message}
              </p>
              {uploadResult.documentId && (
                <p className="font-mono text-xs text-slate-400 mt-1">
                  Assigned Document ID: {uploadResult.documentId}
                </p>
              )}
            </div>

            {uploadResult.requiresReview && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Staff Review Queue Flagged</p>
                    <p className="mt-0.5">
                      This document was ingested without an unambiguous patient identity. Staff must assign or confirm the patient record before full timeline integration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onSuccess}
                className="w-full rounded bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Return to Document Repository
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex flex-col items-center justify-center rounded border-2 border-dashed p-6 text-center cursor-pointer transition-colors select-none',
                isDragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : file
                  ? 'border-teal-400 bg-teal-50/20'
                  : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />

              {file ? (
                <div className="space-y-1.5">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-teal-100 text-teal-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 max-w-xs truncate">
                    {file.name}
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-teal-700 font-medium pt-1">
                    Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-500 mb-1">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Drag and drop clinical PDF here, or <span className="text-teal-700 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Standard medical PDF documents up to 50 MB
                  </p>
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Patient Association */}
            <div className="space-y-1">
              <label htmlFor="patient-select" className="text-xs font-semibold text-slate-700 block">
                Assign to Patient Record
              </label>

              <select
                id="patient-select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={patientsLoading || uploading}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">
                  Unassigned (Document requires staff verification)
                </option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.display_name} — {p.patient_id}
                  </option>
                ))}
              </select>

              {!patientId ? (
                <div className="mt-1 flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Unassigned uploads will be routed to the <strong>Review Queue</strong> for manual provenance confirmation.
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Document will be indexed and correlated with {patientId}'s clinical timeline.
                </p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Backend Transmission Error</p>
                  <p className="mt-0.5">{serverError}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={uploading || !file}
                className="inline-flex items-center gap-1.5 rounded bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-2xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Ingestion…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Ingest Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
