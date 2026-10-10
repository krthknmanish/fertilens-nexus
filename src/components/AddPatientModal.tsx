import React, { useEffect, useRef, useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, CheckCircle2, GitCommit, Calendar, Clock, ArrowRight } from 'lucide-react';
import { addPatient, type NewPatientInput } from '../services/api';
import type { PatientSummary } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (patient: PatientSummary) => void;
}

const PROTOCOL_OPTIONS = [
  'GnRH Antagonist Protocol',
  'Freeze-All IVF with PGT-A',
  'Long Agonist IVF Protocol',
  'Intrauterine Insemination (IUI)',
  'Diagnostic Ovarian Reserve Workup',
];

const EMPTY: NewPatientInput = {
  display_name: '',
  date_of_birth: '',
  diagnosis: '',
  treatment_protocol: 'GnRH Antagonist Protocol',
  referring_doctor: '',
  notes: '',
};

const DIAGNOSIS_OPTIONS = [
  'Diminished Ovarian Reserve (DOR)',
  'Polycystic Ovary Syndrome (PCOS)',
  'Unexplained Infertility',
  'Male Factor Infertility',
  'Tubal Factor Infertility',
  'Premature Ovarian Insufficiency (POI)',
  'Endometriosis',
  'Recurrent Implantation Failure',
  'Recurrent Pregnancy Loss',
  'Other / Pending Assessment',
];

export function AddPatientModal({ open, onClose, onAdded }: Props) {
  const [form, setForm] = useState<NewPatientInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof NewPatientInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<PatientSummary | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first field when modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setSuccess(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const set = (field: keyof NewPatientInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((errs) => ({ ...errs, [field]: undefined }));
    };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.display_name.trim()) errs.display_name = 'Patient name is required.';
    else if (form.display_name.trim().length < 2) errs.display_name = 'Name must be at least 2 characters.';
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required.';
    else {
      const dob = new Date(form.date_of_birth);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18 || age > 80) errs.date_of_birth = 'Date of birth must correspond to an adult patient (18–80 years).';
    }
    if (!form.diagnosis) errs.diagnosis = 'Please select a diagnosis category.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const patient = await addPatient(form);
      setSuccess(patient);
      onAdded(patient);
    } catch (err) {
      setErrors({ display_name: err instanceof Error ? err.message : 'Registration failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field: keyof NewPatientInput) =>
    [
      'w-full rounded border px-3 py-1.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors',
      errors[field]
        ? 'border-red-300 focus:ring-red-300'
        : 'border-slate-200 focus:ring-teal-400/40 focus:border-teal-400',
    ].join(' ');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patient-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-50 border border-teal-200">
                <UserPlus className="h-3.5 w-3.5 text-teal-700" />
              </div>
              <div>
                <h2 id="add-patient-title" className="text-sm font-bold text-slate-900">Register New Patient</h2>
                <p className="text-xs text-slate-500">Creates a synthetic demo patient record</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success state */}
          {success ? (
            <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Patient Registered</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-mono font-semibold text-teal-700">{success.patient_id}</span>
                  {' '}— {success.display_name}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setSuccess(null); setForm(EMPTY); }}
                  className="rounded border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Add Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="px-5 py-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    placeholder="e.g. Jane Smith"
                    value={form.display_name}
                    onChange={set('display_name')}
                    className={fieldClass('display_name')}
                    maxLength={80}
                  />
                  {errors.display_name && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" /> {errors.display_name}
                    </p>
                  )}
                </div>

                {/* DOB + Diagnosis row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={set('date_of_birth')}
                      max={new Date().toISOString().slice(0, 10)}
                      className={fieldClass('date_of_birth')}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" /> {errors.date_of_birth}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Diagnosis Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.diagnosis}
                      onChange={set('diagnosis')}
                      className={fieldClass('diagnosis')}
                    >
                      <option value="">Select…</option>
                      {DIAGNOSIS_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {errors.diagnosis && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" /> {errors.diagnosis}
                      </p>
                    )}
                  </div>
                </div>

                {/* Treatment Protocol & Doctor row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Treatment Protocol <span className="text-teal-600">*</span>
                    </label>
                    <select
                      value={form.treatment_protocol}
                      onChange={set('treatment_protocol')}
                      className={fieldClass('treatment_protocol')}
                    >
                      {PROTOCOL_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Referring Specialist</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. A. Mercer"
                      value={form.referring_doctor}
                      onChange={set('referring_doctor')}
                      className={fieldClass('referring_doctor')}
                      maxLength={80}
                    />
                  </div>
                </div>

                {/* Chronological Flow Preview Box */}
                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <GitCommit className="h-3.5 w-3.5 text-teal-700" />
                      Auto-Generated Chronological Clinical Flow
                    </span>
                    <span className="text-[10px] font-semibold bg-teal-200/70 text-teal-900 px-1.5 py-0.5 rounded">
                      6 Milestones
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="rounded border border-teal-200/80 bg-white p-2 text-[11px] space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1 font-bold text-teal-900">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Past / Documented</span>
                      </div>
                      <p className="text-slate-600">1. Intake Consultation</p>
                      <p className="text-slate-600">2. Baseline Diagnostic Labs</p>
                    </div>

                    <div className="rounded border border-teal-300 bg-teal-100/50 p-2 text-[11px] space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1 font-bold text-teal-900">
                        <Clock className="h-3 w-3 text-teal-700" />
                        <span>Current Stage</span>
                      </div>
                      <p className="text-slate-800 font-medium">3. Protocol Start (Active)</p>
                    </div>

                    <div className="rounded border border-teal-200/80 bg-white p-2 text-[11px] space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1 font-bold text-violet-900">
                        <Calendar className="h-3 w-3 text-violet-600" />
                        <span>Planned Milestones</span>
                      </div>
                      <p className="text-slate-600">4. Follicle Monitoring</p>
                      <p className="text-slate-600">5. Oocyte Retrieval</p>
                      <p className="text-slate-600">6. Day-5 Embryo Culture</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Initial Clinical Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any relevant intake notes, transfer context, or flags for the clinical team…"
                    value={form.notes}
                    onChange={set('notes')}
                    className={[fieldClass('notes'), 'resize-none'].join(' ')}
                    maxLength={500}
                  />
                  <p className="mt-0.5 text-right text-xs text-slate-400">{form.notes.length}/500</p>
                </div>

                {/* Synthetic data disclaimer */}
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <strong>Demo mode:</strong> Patient will be saved to local session storage only.
                  No real medical records are created.
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering…</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Register Patient</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
