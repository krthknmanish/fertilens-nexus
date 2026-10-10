import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Clock,
  CalendarRange,
  Calendar,
  AlertCircle,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { getPatient, getDocuments } from '../services/api';
import type { PatientDetail, ReviewFlag, Document } from '../types';
import { Timeline } from '../components/Timeline';
import { DocumentTable } from '../components/DocumentTable';
import { ReviewCard } from '../components/ReviewCard';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { formatDate } from '../utils/format';

type HistoryTab = 'timeline' | 'documents' | 'past' | 'current' | 'future' | 'flags';

export function PatientHistory() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [patientDocs, setPatientDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HistoryTab>('timeline');

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, docs] = await Promise.all([
        getPatient(patientId),
        getDocuments({ patient_id: patientId }),
      ]);
      setPatient(data);
      setPatientDocs(docs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to load clinical records for this patient.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFlag = (updated: ReviewFlag) => {
    if (!patient) return;
    setPatient({
      ...patient,
      unresolved_flags: patient.unresolved_flags.map((f) =>
        f.flag_id === updated.flag_id ? updated : f,
      ),
    });
  };

  const allTimelineEvents = patient
    ? [
        ...(patient.past_events || []),
        ...(patient.current_status_events || []),
        ...(patient.future_events || []),
      ]
    : [];

  const tabList: { id: HistoryTab; label: string; count?: number }[] = [
    { id: 'timeline', label: 'Chronological Timeline', count: allTimelineEvents.length },
    { id: 'documents', label: 'Indexed Documents', count: patientDocs.length },
    { id: 'past', label: 'Past Documented Events', count: patient?.past_events?.length ?? 0 },
    { id: 'current', label: 'Current Findings & Unresolved', count: patient?.current_status_events?.length ?? 0 },
    { id: 'future', label: 'Planned Next Steps', count: patient?.future_events?.length ?? 0 },
    { id: 'flags', label: 'Review Discrepancies', count: patient?.unresolved_flags?.length ?? 0 },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Patient Registry</span>
        </button>

        {patient && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/evidence?patient_id=${encodeURIComponent(patient.patient_id)}`)}
              className="inline-flex items-center gap-1.5 rounded bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
            >
              <FileSearch className="h-3.5 w-3.5 text-teal-600" />
              <span>Query Records with Evidence Search</span>
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <LoadingState type="detail" />
      ) : patient ? (
        <>
          {/* Patient Overview Card */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-700 border border-slate-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {patient.display_name}
                    </h2>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {patient.patient_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synthetic Fertility Cohort Record · EMR Bridge
                  </p>
                </div>
              </div>

              {patient.unresolved_flags && patient.unresolved_flags.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    {patient.unresolved_flags.length} Discrepanc{patient.unresolved_flags.length === 1 ? 'y' : 'ies'} Requiring Review
                  </span>
                </div>
              )}
            </div>

            {/* Extracted Facts vs Generated Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              {/* Clinical Narrative / Summary */}
              <div className="lg:col-span-2 rounded border border-slate-200 bg-slate-50/50 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-xs">
                    Longitudinal Case Synthesis
                  </span>

                  {patient.summary_is_generated ? (
                    <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 font-medium text-teal-800 text-xs">
                      <Sparkles className="h-2.5 w-2.5 text-teal-600" />
                      Evidence-Grounded AI Summary
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-1.5 py-0.5 font-medium text-slate-700 text-xs">
                      Extracted Provider Summary
                    </span>
                  )}
                </div>

                {patient.summary ? (
                  <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {patient.summary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No clinical summary has been compiled for this patient.
                  </p>
                )}

                <p className="text-xs text-slate-400 pt-1">
                  * Note: Summaries are compiled from indexed encounter notes. Consult primary PDFs for authoritative medication dosages and cycle protocols.
                </p>
              </div>

              {/* Extracted Discrete Facts */}
              <div className="rounded border border-slate-200 bg-white p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-xs">
                    Extracted Parameters
                  </span>
                </div>

                {patient.extracted_facts && Object.keys(patient.extracted_facts).length > 0 ? (
                  <dl className="space-y-1.5 divide-y divide-slate-100">
                    {Object.entries(patient.extracted_facts).map(([key, val]) => (
                      <div key={key} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                        <dt className="text-slate-500 capitalize text-xs">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="font-mono font-medium text-slate-800 text-right text-xs">
                          {String(val ?? '—')}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-slate-400 italic text-xs py-2">
                    No discrete lab biomarkers or vitals extracted yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex flex-wrap gap-1">
              {tabList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors',
                    activeTab === t.id
                      ? 'border-teal-600 text-teal-800 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className={[
                        'px-1.5 py-0.2 rounded text-xs font-mono',
                        activeTab === t.id
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Active Tab Panel */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Unified Chronological Record
                  </h3>
                  <span className="text-xs text-slate-400">
                    All documented consultations, diagnostics, and cycle milestones
                  </span>
                </div>
                <Timeline events={allTimelineEvents} emptyMessage="No clinical events documented for this patient." />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Patient Primary Source Documents ({patientDocs.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Primary laboratory reports, clinical notes, and intake scans
                  </span>
                </div>
                {patientDocs.length === 0 ? (
                  <EmptyState
                    title="No documents linked to this patient"
                    description="Upload a medical PDF and associate it with this patient record."
                  />
                ) : (
                  <DocumentTable documents={patientDocs} />
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Past Documented Events
                  </h3>
                </div>
                <Timeline events={patient.past_events || []} emptyMessage="No past encounters documented in repository." />
              </div>
            )}

            {activeTab === 'current' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 text-slate-700">
                  <CalendarRange className="h-4 w-4 text-teal-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Latest Documented Information & Unresolved Items
                  </h3>
                </div>
                <Timeline
                  events={patient.current_status_events || []}
                  emptyMessage="No ongoing or unverified clinical status items recorded."
                />
              </div>
            )}

            {activeTab === 'future' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 text-slate-700">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Explicitly Planned Future Events
                  </h3>
                </div>

                <div className="rounded border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Planning Notice:</span> These procedures or visits are documented as intended clinical milestones. Do not assume completion until corroborating discharge or embryology intake notes are indexed.
                  </div>
                </div>

                <Timeline
                  events={patient.future_events || []}
                  emptyMessage="No future appointments or planned cycle interventions recorded."
                />
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Discrepancy Flags & Conflict Queue
                  </h3>
                  <span className="text-xs text-slate-400">
                    Cross-document discrepancies requiring clinical staff verification
                  </span>
                </div>

                {!patient.unresolved_flags || patient.unresolved_flags.length === 0 ? (
                  <EmptyState
                    title="No unresolved review flags"
                    description="All indexed dates, lab values, and protocol events for this patient are consistent."
                    icon={<CheckCircle2 className="h-7 w-7 text-emerald-600" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {patient.unresolved_flags.map((flag) => (
                      <ReviewCard key={flag.flag_id} flag={flag} onUpdated={updateFlag} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
