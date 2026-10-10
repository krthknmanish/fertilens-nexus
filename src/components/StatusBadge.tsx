import React from 'react';
import type { ProcessingStatus } from '../types';

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  switch (status) {
    case 'indexed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
          Indexed
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-600 animate-pulse shrink-0" />
          Processing
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
          Pending
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
          Error
        </span>
      );
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
          Duplicate
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
}

export function ReviewBadge({
  status,
}: {
  status: 'pending' | 'reviewed' | 'resolved';
}) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
          Needs Review
        </span>
      );
    case 'reviewed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
          Reviewed
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
          Resolved
        </span>
      );
    default:
      return null;
  }
}

export function VerificationBadge({
  status,
}: {
  status: 'verified' | 'unverified' | 'conflicted' | null;
}) {
  if (!status) return null;
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Verified
        </span>
      );
    case 'conflicted':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Conflict
        </span>
      );
    case 'unverified':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          Unverified
        </span>
      );
    default:
      return null;
  }
}
