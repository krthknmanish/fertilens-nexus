import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Stethoscope,
  FlaskConical,
  FileText,
  AlertCircle,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Pill,
  Activity,
  Layers,
} from 'lucide-react';
import type { TimelineEvent } from '../types';
import { formatDate } from '../utils/format';
import { VerificationBadge } from './StatusBadge';

const EVENT_TYPE_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  consultation: { icon: Stethoscope, label: 'Consultation' },
  lab: { icon: FlaskConical, label: 'Laboratory' },
  ultrasound: { icon: Activity, label: 'Ultrasound / Scan' },
  medication: { icon: Pill, label: 'Medication' },
  document: { icon: FileText, label: 'Document Intake' },
  procedure: { icon: Layers, label: 'Clinical Procedure' },
};

function getEventMeta(typeStr: string) {
  const lower = (typeStr || '').toLowerCase();
  for (const [key, meta] of Object.entries(EVENT_TYPE_MAP)) {
    if (lower.includes(key)) return meta;
  }
  return { icon: Calendar, label: typeStr || 'Event' };
}

interface TimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
  showControls?: boolean;
}

export function Timeline({
  events,
  emptyMessage = 'No clinical events recorded.',
  showControls = true,
}: TimelineProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Discover distinct event types
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.event_type) set.add(e.event_type);
    });
    return Array.from(set);
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (filterType !== 'all') {
      result = result.filter((e) => e.event_type === filterType);
    }

    result.sort((a, b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      const tA = new Date(a.event_date).getTime();
      const tB = new Date(b.event_date).getTime();
      return sortOrder === 'asc' ? tA - tB : tB - tA;
    });

    return result;
  }, [events, filterType, sortOrder]);

  const openDocument = (docId: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    const url = `${baseUrl}/api/documents/${encodeURIComponent(docId)}/file`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded border border-dashed border-slate-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls header */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter Category:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All event categories ({events.length})</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowUpDown className="h-3 w-3 text-slate-400" />
            <span>Order: {sortOrder === 'asc' ? 'Chronological (Oldest First)' : 'Reverse (Newest First)'}</span>
          </button>
        </div>
      )}

      {/* Timeline entries */}
      {filteredEvents.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">
          No events match the selected category filter.
        </p>
      ) : (
        <ol className="relative space-y-0 pl-1">
          {filteredEvents.map((event, idx) => {
            const { icon: Icon, label } = getEventMeta(event.event_type);
            const isLast = idx === filteredEvents.length - 1;

            return (
              <li key={event.event_id || idx} className="relative flex gap-3.5 pb-6 last:pb-0">
                {/* Connecting track */}
                {!isLast && (
                  <span
                    className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                {/* Node icon */}
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 border border-slate-200 text-slate-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Event details */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {event.event_type || label}
                      </span>
                      {event.event_date ? (
                        <span className="text-xs text-slate-500 font-mono">
                          {formatDate(event.event_date)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          <AlertCircle className="h-3 w-3" />
                          Date unrecorded in source
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {event.status && (
                        <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                          {event.status}
                        </span>
                      )}
                      <VerificationBadge status={event.verification_status} />
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-slate-700 leading-relaxed font-normal">
                    {event.description}
                  </p>

                  {/* Provenance Document Link */}
                  {event.source_document_id && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDocument(event.source_document_id!)}
                        className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 hover:underline"
                        title="Open source document"
                      >
                        <FileText className="h-3 w-3 text-teal-600" />
                        <span>Source: {event.source_document_name ?? `Doc #${event.source_document_id}`}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
