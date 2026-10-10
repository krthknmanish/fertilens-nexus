import React from 'react';

interface LoadingStateProps {
  rows?: number;
  type?: 'table' | 'cards' | 'detail';
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
      <div className="skeleton h-4 w-24 shrink-0" />
      <div className="skeleton h-4 w-48" />
      <div className="skeleton h-4 w-32 ml-auto" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-8 w-20" />
      <div className="skeleton h-3 w-48" />
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-4 p-4">
      <div className="skeleton h-6 w-64" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-4/5" />
      </div>
      <div className="skeleton h-4 w-48 mt-4" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    </div>
  );
}

export function LoadingState({ rows = 5, type = 'table' }: LoadingStateProps) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return <SkeletonDetail />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-teal-600`}
    />
  );
}
