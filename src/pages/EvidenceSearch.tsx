import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  ChevronRight,
  FileSearch,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { getPatients, postSearch } from '../services/api';
import type { PatientSummary, SearchResult } from '../types';
import { EvidencePanel } from '../components/EvidencePanel';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

const EXAMPLE_QUESTIONS = [
  "Show the patient's last two consultations.",
  "Which records mention pending reports?",
  "What changed between these visits?",
  "Are there conflicting dates?",
  "Which planned events have no documented completion?",
  "Show the records supporting this summary.",
];

export function EvidenceSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // Search parameters
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    searchParams.get('patient_id') ?? '',
  );
  const [query, setQuery] = useState<string>(searchParams.get('q') ?? '');
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load patients
  useEffect(() => {
    setPatientsLoading(true);
    getPatients()
      .then((data) => {
        setPatients(data);
        // If patient_id was not set and we have patients, we can leave blank or let user pick
      })
      .catch(() => setPatients([]))
      .finally(() => setPatientsLoading(false));
  }, []);

  // Update state when searchParams changes
  useEffect(() => {
    const pId = searchParams.get('patient_id');
    if (pId) setSelectedPatientId(pId);
  }, [searchParams]);

  const executeSearch = useCallback(
    async (pId: string, q: string, mode: 'keyword' | 'semantic' | 'hybrid') => {
      if (!pId) {
        setError('Please select a patient record to ground this search.');
        return;
      }
      if (!q.trim()) {
        setError('Please enter a clinical query or select one of the suggested questions.');
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await postSearch({
          patient_id: pId,
          query: q.trim(),
          search_mode: mode,
        });
        setResult(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Search retrieval request failed.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(selectedPatientId, query, searchMode);
  };

  const handleSelectExample = (qText: string) => {
    setQuery(qText);
    if (selectedPatientId) {
      executeSearch(selectedPatientId, qText, searchMode);
    }
  };

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Clinical Validation & Evidence Retrieval
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Validate clinical hypotheses and retrieve verbatim laboratory findings, ultrasound measurements, and encounter notes without hallucinations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search Parameter Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Retrieval Parameters
              </span>
              <span className="text-xs text-slate-400">POST /api/search</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Patient Selector */}
              <div>
                <label htmlFor="patient-selector" className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Patient Record <span className="text-rose-500">*</span>
                </label>
                <select
                  id="patient-selector"
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setSearchParams({ patient_id: e.target.value });
                  }}
                  disabled={patientsLoading}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="">Select a patient to scope evidence…</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.display_name} ({p.patient_id})
                    </option>
                  ))}
                </select>

                {selectedPatient && (
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200/60">
                    <span>
                      {selectedPatient.indexed_record_count} indexed document{selectedPatient.indexed_record_count === 1 ? '' : 's'} available
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/patients/${encodeURIComponent(selectedPatient.patient_id)}`)}
                      className="text-teal-700 hover:underline font-medium"
                    >
                      View Timeline
                    </button>
                  </div>
                )}
              </div>

              {/* Retrieval Mode Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Search Engine Mode
                </label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSearchMode('hybrid')}
                    className={[
                      'px-2 py-1.5 rounded border font-medium text-center transition-colors',
                      searchMode === 'hybrid'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    Hybrid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('keyword')}
                    className={[
                      'px-2 py-1.5 rounded border font-medium text-center transition-colors',
                      searchMode === 'keyword'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    Keyword
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('semantic')}
                    className={[
                      'px-2 py-1.5 rounded border font-medium text-center transition-colors',
                      searchMode === 'semantic'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    Semantic
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {searchMode === 'keyword'
                    ? 'Keyword: Exact text token retrieval without reasoning.'
                    : searchMode === 'semantic'
                    ? 'Semantic: Conceptual vector matching across clinical terminology.'
                    : 'Hybrid: Combined BM25 literal keyword retrieval and dense vector matching.'}
                </p>
              </div>

              {/* Question Text Area */}
              <div>
                <label htmlFor="query-input" className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Inquiry <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="query-input"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a specific clinical question grounded in this patient's records…"
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-2xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing Record Search…</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>Search Records</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Example Clinical Questions */}
          <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Benchmark Inquiries
              </span>
            </div>

            <div className="space-y-1">
              {EXAMPLE_QUESTIONS.map((qText) => (
                <button
                  key={qText}
                  type="button"
                  onClick={() => handleSelectExample(qText)}
                  className="w-full flex items-start gap-1.5 text-left text-xs text-slate-600 hover:text-teal-900 hover:bg-teal-50/60 p-1.5 rounded transition-colors group"
                >
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{qText}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs min-h-[420px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Retrieving Clinical Evidence
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scanning indexed text chunks and cross-referencing document dates…
                  </p>
                </div>
              </div>
            ) : result ? (
              <EvidencePanel
                answer={result.answer}
                noEvidenceMessage={result.no_evidence_message}
                searchMode={result.search_mode}
                excerpts={result.excerpts || []}
              />
            ) : (
              <EmptyState
                title="Enter a query to retrieve evidence"
                description="Select a synthetic patient from the left column and enter an inquiry or choose one of the benchmark questions to view grounded excerpts."
                icon={<FileSearch className="h-8 w-8 text-slate-400" />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
