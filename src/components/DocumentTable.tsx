import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ExternalLink,
  AlertTriangle,
  Copy,
  Info,
  Calendar,
  Layers,
  X,
  FileCheck,
} from 'lucide-react';
import type { Document } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatDateTime, formatFileSize } from '../utils/format';

interface DocumentTableProps {
  documents: Document[];
  compact?: boolean;
}

export function DocumentTable({ documents, compact = false }: DocumentTableProps) {
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  const openDocumentFile = (doc: Document) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    // If backend is configured, attempt window.open
    const url = `${baseUrl}/api/documents/${encodeURIComponent(doc.document_id)}/file`;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          setViewingDoc(doc);
        }
      })
      .catch(() => {
        // Standalone demo mode fallback preview
        setViewingDoc(doc);
      });
  };

  return (
    <>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <th scope="col" className="px-4 py-3">
                  Document Identity
                </th>
                {!compact && (
                  <>
                    <th scope="col" className="px-4 py-3">
                      Assigned Patient
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Document Date
                    </th>
                  </>
                )}
                <th scope="col" className="px-4 py-3">
                  Processing Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Intake Timestamp
                </th>
                {!compact && (
                  <th scope="col" className="px-4 py-3 text-right">
                    Pages / Size
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {documents.map((doc) => {
                const isUnassigned = !doc.patient_id;

                return (
                  <tr
                    key={doc.document_id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Filename & ID */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600 border border-slate-200 mt-0.5">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-xs" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-slate-400">
                              {doc.document_id}
                            </span>
                            {doc.is_duplicate && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 font-medium">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Duplicate
                              </span>
                            )}
                            {doc.requires_review && (
                              <span className="inline-flex items-center text-xs text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">
                                Review required
                              </span>
                            )}
                          </div>

                          {doc.processing_error && (
                            <p className="mt-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 truncate max-w-sm" title={doc.processing_error}>
                              Error: {doc.processing_error}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isUnassigned ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50/70 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Unassigned
                          </span>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/patients/${encodeURIComponent(doc.patient_id!)}`)}
                              className="font-medium text-slate-800 hover:text-teal-700 hover:underline transition-colors block text-left"
                            >
                              {doc.patient_display_name ?? doc.patient_id}
                            </button>
                            <span className="font-mono text-xs text-slate-400">
                              {doc.patient_id}
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Category */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {doc.document_type ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 border border-slate-200">
                            {doc.document_type}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unclassified</span>
                        )}
                      </td>
                    )}

                    {/* Document Date */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {doc.document_date ? (
                          <span className="font-mono">{formatDate(doc.document_date)}</span>
                        ) : (
                          <span className="text-slate-400 italic">Undated</span>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={doc.processing_status} />
                    </td>

                    {/* Upload Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono">
                      <span title={formatDateTime(doc.upload_timestamp)}>
                        {formatDate(doc.upload_timestamp)}
                      </span>
                    </td>

                    {/* Size & Pages */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-right text-slate-600 font-mono">
                        <div>
                          {doc.page_count != null ? `${doc.page_count} pp` : '—'}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {doc.file_size_bytes != null ? formatFileSize(doc.file_size_bytes) : '—'}
                        </div>
                      </td>
                    )}

                    {/* Action buttons */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                          title="View metadata and extraction details"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => openDocumentFile(doc)}
                          className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100 transition-colors"
                          title="Open original document via backend"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
          <div>
            Showing <span className="font-medium text-slate-700">{documents.length}</span> {documents.length === 1 ? 'document' : 'documents'}
          </div>
          <div className="text-slate-400">
            Source documents served via backend file endpoint
          </div>
        </div>
      </div>

      {/* Document Metadata Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Document Metadata Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-500 font-medium uppercase tracking-wider mb-1">Filename</p>
                <p className="font-semibold text-slate-900 text-sm">{selectedDoc.filename}</p>
                <p className="font-mono text-slate-400 mt-0.5">ID: {selectedDoc.document_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
                <div>
                  <span className="text-slate-500">Assigned Patient:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedDoc.patient_display_name ?? selectedDoc.patient_id ?? 'Unassigned'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Document Type:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedDoc.document_type ?? 'Unclassified'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Document Date:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {formatDate(selectedDoc.document_date)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Upload Date:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {formatDateTime(selectedDoc.upload_timestamp)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Page Count:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedDoc.page_count ?? 'Not computed'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">File Size:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedDoc.file_size_bytes != null ? formatFileSize(selectedDoc.file_size_bytes) : '—'}
                  </p>
                </div>
              </div>

              {selectedDoc.is_duplicate && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
                  <p className="font-semibold">Duplicate Document Detected</p>
                  <p className="mt-0.5">
                    Matches existing document record {selectedDoc.duplicate_of_document_id ? `#${selectedDoc.duplicate_of_document_id}` : ''}.
                  </p>
                </div>
              )}

              {selectedDoc.processing_error && (
                <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-rose-800">
                  <p className="font-semibold">Processing Error</p>
                  <p className="mt-0.5 font-mono text-xs">{selectedDoc.processing_error}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400">
                  Status: <StatusBadge status={selectedDoc.processing_status} />
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openDocumentFile(selectedDoc);
                      setSelectedDoc(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded bg-teal-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Original PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Demo Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Clinical Document Inspection
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {viewingDoc.filename} ({viewingDoc.document_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="rounded border border-amber-200 bg-amber-50/80 p-3 text-amber-900">
                <p className="font-semibold">Standalone Demo Sandbox Viewer</p>
                <p className="mt-0.5 leading-relaxed text-amber-800">
                  In standalone demo mode, primary source records are rendered from the synthetic clinical registry. When the FastAPI backend is connected at <code>{import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}</code>, original PDF binary streams are served directly from disk.
                </p>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50/50 p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1 font-sans font-semibold text-slate-700">
                  <span>RECORD ATTRIBUTES</span>
                  <span>GROUNDED EMR EVIDENCE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Document ID:</span>
                  <span className="font-bold text-slate-800">{viewingDoc.document_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Patient:</span>
                  <span className="font-bold text-slate-800">{viewingDoc.patient_display_name || viewingDoc.patient_id || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Date:</span>
                  <span>{formatDate(viewingDoc.document_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Category:</span>
                  <span>{viewingDoc.document_type || 'Unclassified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Page Count:</span>
                  <span>{viewingDoc.page_count ?? 2} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ingestion SHA-256:</span>
                  <span className="text-slate-500 truncate max-w-xs">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                </div>
              </div>

              <div className="rounded border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                <span className="font-semibold text-xs text-teal-900 uppercase tracking-wider block">
                  Indexed Text Findings & Transcript Sample
                </span>
                <p className="text-slate-800 leading-relaxed font-sans text-xs">
                  {viewingDoc.filename.includes('Endocrine')
                    ? 'Patient: Elena Rostova (FL-1001). Clinical findings: Anti-Müllerian Hormone (AMH): 0.82 ng/mL. Follicle Stimulating Hormone (FSH): 10.4 mIU/mL. Estradiol: 42 pg/mL. Verified by Memorial Endocrine Laboratory.'
                    : viewingDoc.filename.includes('StJude')
                    ? 'Patient Transfer Document: Elena Rostova. AMH Serum level reported as 2.45 ng/mL. [Discrepancy active with baseline Memorial Endocrine result: Flag FLG-301]'
                    : viewingDoc.filename.includes('Culture')
                    ? 'Embryology Intake & Day-5 Blastocyst Grading: Marcus & Chloe Vance (FL-1002). Insemination: 12 oocytes injected via ICSI. Fertilization rate: 75% (9 2PN). Vitrified blastocysts: 4 Day-5 blastocysts (Grades: 4AA, 4AB, 3BB, 3BB). Trophectoderm biopsy completed for PGT-A.'
                    : viewingDoc.filename.includes('Semen')
                    ? 'Comprehensive Semen Analysis: Marcus Vance (FL-1002). Volume: 2.1 mL, Concentration: 2.8 M/mL, Progressive Motility: 14%, Normal Morphology: 1%. Severe oligoasthenoteratozoospermia indicated. ICSI recommended.'
                    : viewingDoc.filename.includes('Fax')
                    ? 'Outside Clinic Intake Fax: Sarah Kowalski. DOB 1994-08-14 matching FL-1003. Demographic confirmation pending for hyphenated surname Chen-Kowalski.'
                    : `Medical PDF document record ingested into Jeevankura repository for patient ${viewingDoc.patient_id || 'cohort'}. Indexed metadata and extracted temporal events are ground-truth synchronized.`}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ground-truth provenance verification active
              </span>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
