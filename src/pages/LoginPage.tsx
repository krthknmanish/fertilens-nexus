import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Microscope,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { useRole, type UserRole, ROLE_DEFINITIONS } from '../context/RoleContext';

const AVAILABLE_ROLES: { role: UserRole; badge: string; desc: string }[] = [
  {
    role: 'Clinic Administrator',
    badge: 'Admin',
    desc: 'Full clinical management, document oversight, audit logs, and settings.',
  },
  {
    role: 'Fertility Specialist',
    badge: 'Physician',
    desc: 'Longitudinal patient history, evidence validation, and clinical timelines.',
  },
  {
    role: 'Embryologist',
    badge: 'Lab',
    desc: 'IVF culture reports, blastocyst grading, and laboratory milestones.',
  },
  {
    role: 'Nurse / Clinical Coordinator',
    badge: 'Clinical',
    desc: 'Visit coordination, intake workflows, and patient care timeline review.',
  },
  {
    role: 'Records Officer',
    badge: 'Intake',
    desc: 'Document upload indexing, SHA duplicate checks, and identity verification.',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [username, setUsername] = useState('Clinic Administrator');
  const [password, setPassword] = useState('Clinic Administrator');
  const [error, setError] = useState<string | null>(null);

  const normalize = (str: string) => str.trim().toLowerCase();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const normUser = normalize(username);
    const normPass = normalize(password);

    if (!normUser || !normPass) {
      setError('Please enter both username and password.');
      return;
    }

    // Check if password equals username or matches the role
    const matchedRoleObj = AVAILABLE_ROLES.find(
      (r) =>
        normalize(r.role) === normUser ||
        normalize(r.badge) === normUser
    );

    if (!matchedRoleObj) {
      setError(
        'Invalid role username. Please use one of the 5 clinic roles (e.g. Clinic Administrator, Fertility Specialist, Embryologist, Nurse / Clinical Coordinator, Records Officer).'
      );
      return;
    }

    // Password must match the role name or the typed username
    const validPasswordMatches = [
      normUser,
      normalize(matchedRoleObj.role),
      normalize(matchedRoleObj.badge),
    ];

    if (!validPasswordMatches.includes(normPass)) {
      setError(`Password must match the role name: "${matchedRoleObj.role}".`);
      return;
    }

    // Success: log in with the matched role
    login(matchedRoleObj.role);
    navigate('/');
  };

  const handleQuickSelect = (roleName: UserRole) => {
    setUsername(roleName);
    setPassword(roleName);
    setError(null);
  };

  const handleOneClickLogin = (roleName: UserRole) => {
    login(roleName);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-teal-400 shadow-md border border-slate-800 mb-3">
          <Microscope className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FertiLens
          </h1>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            NEXORA
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Evidence-Grounded Temporal Intelligence for Fertility Clinics
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm rounded-xl border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-sm font-bold text-slate-900">
              Authorized Staff Sign-In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your clinic role as both the <strong>Username</strong> and <strong>Password</strong>.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic Role (Username)
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Clinic Administrator"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-slate-400 font-normal">(same as role)</span>
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Clinic Administrator"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-2xs text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
            >
              <span>Sign In to EMR</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick Role Selector Cards for Demo Ease */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                Quick Role Sign-In
              </span>
              <span className="text-xs text-teal-700 font-medium">Click to access</span>
            </div>

            <div className="space-y-1.5">
              {AVAILABLE_ROLES.map(({ role: r, badge, desc }) => (
                <div
                  key={r}
                  className="group flex items-center justify-between p-2 rounded-lg border border-slate-200/80 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-300 transition-all text-xs cursor-pointer"
                  onClick={() => handleOneClickLogin(r)}
                  title={`Sign in immediately as ${r}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 group-hover:text-teal-900 truncate">
                        {r}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 group-hover:bg-teal-100 group-hover:text-teal-800 px-1.5 py-0.2 rounded">
                        {badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickSelect(r);
                    }}
                    className="shrink-0 text-[11px] font-semibold text-slate-500 hover:text-teal-700 px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Fill into username & password fields"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Demo Environment:</strong> Authentication is scoped to the client session. Credentials match the role name for instant exploration.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
