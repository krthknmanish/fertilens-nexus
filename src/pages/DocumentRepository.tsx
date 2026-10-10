import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Upload,
  RefreshCw,
  Filter,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { getDocuments, getPatients } from '../services/api';
import type { Document, PatientSummary, ProcessingStatus } from '../types';
import { DocumentTable } from '../components/DocumentTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { UploadModal } from './UploadModal';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Processing Statuses' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'error', label: 'Error' },
  { value: 'duplicate', label: 'Duplicate' },
];

const DOCUMENT_TYPES: string[] = [
  'Consultation Note',
  'Lab Report',
  'Ultrasound Scan',
  'Embryology Record',
  'Pathology Report',
  'Semen Analysis',
  'Consent Form',
  'Referral / Summary',
];

export function DocumentRepository() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [patientFilter, setPatientFilter] = useState(searchParams.get('patient_id') ?? '');
  const [docTypeFilter, setDocTypeFilter] = useState(searchParams.get('type') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');

  const [showUpload, setShowUpload] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments({
        search: search.trim() || undefined,
        patient_id: patientFilter || undefined,
        document_type: docTypeFilter || undefined,
        processing_status: statusFilter || undefined,
      });
      setDocuments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to retrieve document repository records.');
    } finally {
      setLoading(false);
    }
  }, [search, patientFilter, docTypeFilter, statusFilter]);

  // Load patients for filter select
  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setPatientFilter('');
    setDocTypeFilter('');
    setStatusFilter('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || patientFilter || docTypeFilter || statusFilter);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Document Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed primary clinical source records, pathology reports, and sonograms
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
            onClick={loadDocs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Refresh repository from backend"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-md border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filename Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename or ID…"
                className="w-full rounded border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </form>

          {/* Patient Filter */}
          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Patients</option>
            <option value="__unassigned__">Unassigned Records Only</option>
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.display_name} ({p.patient_id})
              </option>
            ))}
          </select>

          {/* Document Type Filter */}
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Document Types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Processing Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3 w-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table / States */}
      {error ? (
        <ErrorState message={error} onRetry={loadDocs} />
      ) : loading ? (
        <LoadingState rows={7} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents found"
          description={
            hasActiveFilters
              ? 'No documents matched the selected filters. Try clearing or expanding your search criteria.'
              : 'The clinic document repository currently contains no ingested PDF files.'
          }
          icon={<FileText className="h-7 w-7 text-slate-400" />}
          action={
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear All Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
              >
                <Upload className="h-3 w-3" />
                <span>Upload New PDF</span>
              </button>
            </div>
          }
        />
      ) : (
        <DocumentTable documents={documents} />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            loadDocs();
          }}
          initialPatientId={patientFilter !== '__unassigned__' ? patientFilter : ''}
        />
      )}
    </div>
  );
}
