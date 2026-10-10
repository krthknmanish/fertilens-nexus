import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, RefreshCw, X, RotateCcw, UserPlus } from 'lucide-react';
import { getPatients } from '../services/api';
import type { PatientSummary } from '../types';
import { PatientTable } from '../components/PatientTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { AddPatientModal } from '../components/AddPatientModal';

export function PatientDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients(query || undefined);
      setPatients(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to retrieve patient registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') ?? '';
    setSearchInput(q);
    load(q);
  }, [searchParams, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePatientAdded = (patient: PatientSummary) => {
    // Prepend to list immediately without a reload
    setPatients((prev) => [patient, ...prev]);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Patient Directory &amp; Longitudinal History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthetic fertility patient records with cross-encounter timeline indexing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Patient */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Patient</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => load(searchParams.get('search') ?? '')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-2xs">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by patient display name or clinical ID (e.g., FL-1001)…"
              className="w-full rounded border border-slate-200 bg-slate-50/50 pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="rounded bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-900 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={() => load(searchParams.get('search') ?? '')} />
      ) : loading ? (
        <LoadingState rows={8} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          description={
            searchInput
              ? `No patient records matched "${searchInput}". Check the spelling or ID format.`
              : 'The synthetic patient registry contains no entries.'
          }
          icon={<Users className="h-7 w-7 text-slate-400" />}
          action={
            searchInput ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset search</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <UserPlus className="h-3 w-3" />
                <span>Register first patient</span>
              </button>
            )
          }
        />
      ) : (
        <PatientTable patients={patients} />
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(p) => {
          handlePatientAdded(p);
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
