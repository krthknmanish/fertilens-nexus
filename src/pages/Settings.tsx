import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Server,
  Database,
  Lock,
  UserCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useRole, ROLE_DEFINITIONS, type UserRole } from '../context/RoleContext';
import { resetDemoState, getHealth } from '../services/api';

export function Settings() {
  const { role, setRole, permissions } = useRole();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('Pinging…');

  useEffect(() => {
    getHealth().then((h) => {
      if (h.status === 'standalone_demo') {
        setApiStatus('Standalone Demo Mode (Local Synthetic Persistence)');
      } else {
        setApiStatus(`Connected to Backend (${h.status})`);
      }
    });
  }, []);

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all synthetic demo data? This will restore initial patient timelines, review flags, and document indexes.',
      )
    ) {
      setResetting(true);
      resetDemoState();
      setTimeout(() => {
        setResetting(false);
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
        window.location.reload();
      }, 500);
    }
  };

  const allRoles: UserRole[] = [
    'Clinic Administrator',
    'Fertility Specialist',
    'Embryologist',
    'Nurse / Clinical Coordinator',
    'Records Officer',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          System Settings & Demo Governance
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-aware view switcher, synthetic data resets, and clinical privacy parameters
        </p>
      </div>

      {/* Role Administration */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Demo Access Role Switcher
            </h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Frontend Simulation
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Select an authorized clinical role to preview scoped navigation and workflow permissions.
          In a production deployment, authorization is enforced cryptographically per request by the backend API.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {allRoles.map((r) => {
            const isSelected = role === r;
            const def = ROLE_DEFINITIONS[r];

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  'rounded-md border p-3 text-left transition-all relative flex flex-col justify-between',
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{r}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {def.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Scope: {def.canUploadDocuments ? 'Upload + Verify' : 'Read + Review'}</span>
                  {isSelected && (
                    <span className="font-semibold text-teal-700">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environment & Backend Connection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Card */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Server className="h-4 w-4 text-slate-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Environment & Runtime
            </h3>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">API Gateway:</dt>
              <dd className="font-mono text-slate-800 font-medium">
                {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Operating Mode:</dt>
              <dd className="text-slate-800 font-medium">{apiStatus}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Data Storage Engine:</dt>
              <dd className="text-slate-800 font-medium">Browser LocalStorage + Seed Fallback</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Integrity Hash Algorithm:</dt>
              <dd className="font-mono text-slate-800">SHA-256 (Web Crypto / CertUtil)</dd>
            </div>
          </dl>
        </div>

        {/* Demo State Reset */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Database className="h-4 w-4 text-slate-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Demo State Re-initialization
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Reset all user updates, uploaded files, and review resolutions back to the initial seeded state. Useful between judging demos.
          </p>

          {resetSuccess && (
            <div className="rounded bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Demo data restored to pristine initial state.</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetData}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset All Demo Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsible AI & Privacy Limitations */}
      <div className="rounded-md border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-950 font-bold">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <span>Responsible AI, Privacy & Regulatory Compliance Notice</span>
        </div>

        <p className="leading-relaxed">
          <strong>1. Synthetic Data Guarantee:</strong> All patient identifiers (e.g. FL-1001), clinical narratives, laboratory test values, and scan details presented in this prototype are entirely fictional and generated for hackathon benchmarking purposes.
        </p>

        <p className="leading-relaxed">
          <strong>2. Non-Diagnostic Guardrail:</strong> FertiLens Nexora does not make clinical diagnoses, recommend drug dosages, or automate clinical decisions. The platform serves as an evidence retrieval and discrepancy auditing tool for authorized healthcare staff.
        </p>

        <p className="leading-relaxed">
          <strong>3. Real-World EMR Deployment:</strong> Production deployments require HIPAA / GDPR compliant business associate agreements, cryptographic audit trails, on-premises or private VPC retrieval hosting, and TLS encryption in transit and at rest.
        </p>
      </div>
    </div>
  );
}
