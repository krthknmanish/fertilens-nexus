import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  FileText,
  User,
} from 'lucide-react';
import type { PatientSummary } from '../types';
import { formatDate } from '../utils/format';

interface PatientTableProps {
  patients: PatientSummary[];
  onSelectPatient?: (patientId: string) => void;
  compact?: boolean;
}

type SortField = 'display_name' | 'patient_id' | 'last_visit_date' | 'indexed_record_count' | 'unresolved_flag_count';
type SortDirection = 'asc' | 'desc';

export function PatientTable({
  patients,
  onSelectPatient,
  compact = false,
}: PatientTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('display_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (sortField === 'last_visit_date') {
        const timeA = new Date(aVal as string).getTime();
        const timeB = new Date(bVal as string).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [patients, sortField, sortDirection]);

  const handleRowClick = (patientId: string) => {
    if (onSelectPatient) {
      onSelectPatient(patientId);
    } else {
      navigate(`/patients/${encodeURIComponent(patientId)}`);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-400 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-teal-600 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-teal-600 ml-1 inline" />
    );
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th
                scope="col"
                className="px-4 py-3 cursor-pointer select-none group"
                onClick={() => handleSort('display_name')}
              >
                <div className="flex items-center">
                  <span>Patient Identity</span>
                  {renderSortIcon('display_name')}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 cursor-pointer select-none group"
                onClick={() => handleSort('patient_id')}
              >
                <div className="flex items-center">
                  <span>Record ID</span>
                  {renderSortIcon('patient_id')}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 cursor-pointer select-none group"
                onClick={() => handleSort('last_visit_date')}
              >
                <div className="flex items-center">
                  <span>Last Encounter</span>
                  {renderSortIcon('last_visit_date')}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 cursor-pointer select-none group text-right"
                onClick={() => handleSort('indexed_record_count')}
              >
                <div className="flex items-center justify-end">
                  <span>Indexed Documents</span>
                  {renderSortIcon('indexed_record_count')}
                </div>
              </th>

              {!compact && (
                <th scope="col" className="px-4 py-3">
                  <span>Latest Clinical Event</span>
                </th>
              )}

              <th
                scope="col"
                className="px-4 py-3 cursor-pointer select-none group text-center"
                onClick={() => handleSort('unresolved_flag_count')}
              >
                <div className="flex items-center justify-center">
                  <span>Review Flags</span>
                  {renderSortIcon('unresolved_flag_count')}
                </div>
              </th>

              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedPatients.map((p) => {
              const hasFlags = p.unresolved_flag_count > 0;
              return (
                <tr
                  key={p.patient_id}
                  onClick={() => handleRowClick(p.patient_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(p.patient_id);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-slate-50"
                >
                  {/* Name */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600 border border-slate-200">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 hover:text-teal-700 transition-colors">
                          {p.display_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Synthetic Record
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {p.patient_id}
                    </span>
                  </td>

                  {/* Last Visit */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                    {p.last_visit_date ? (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(p.last_visit_date)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No visit documented</span>
                    )}
                  </td>

                  {/* Document count */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      {p.indexed_record_count}
                    </span>
                  </td>

                  {/* Latest Event */}
                  {!compact && (
                    <td className="px-4 py-3 max-w-xs text-xs text-slate-600">
                      {p.latest_event_description ? (
                        <p className="truncate" title={p.latest_event_description}>
                          {p.latest_event_description}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                  )}

                  {/* Unresolved flags */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {hasFlags ? (
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>{p.unresolved_flag_count} unresolved</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Clear</span>
                    )}
                  </td>

                  {/* Action arrow */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800">
                      <span>Timeline</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
        <div>
          Showing <span className="font-medium text-slate-700">{sortedPatients.length}</span> patient {sortedPatients.length === 1 ? 'record' : 'records'}
        </div>
        <div className="text-slate-400">
          Click any row to open full patient history
        </div>
      </div>
    </div>
  );
}
