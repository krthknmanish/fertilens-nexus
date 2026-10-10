import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Copy,
  Check,
  Search,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { SearchExcerpt } from '../types';
import { formatDate } from '../utils/format';

interface EvidencePanelProps {
  answer: string | null;
  noEvidenceMessage: string | null;
  searchMode: string;
  excerpts: SearchExcerpt[];
}

export function EvidencePanel({
  answer,
  noEvidenceMessage,
  searchMode,
  excerpts,
}: EvidencePanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openDocument = (docId: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    const url = `${baseUrl}/api/documents/${encodeURIComponent(docId)}/file`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (excerpt: SearchExcerpt) => {
    const textToCopy = `"${excerpt.text}" — Source: ${excerpt.document_name}${excerpt.page_number ? ` (p. ${excerpt.page_number})` : ''}${excerpt.event_date ? `, Date: ${excerpt.event_date}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(excerpt.excerpt_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Honest label for mode
  const isKeyword = searchMode === 'keyword';
  const modeTitle = isKeyword
    ? 'Record retrieval'
    : searchMode === 'semantic'
    ? 'Semantic Concept Retrieval'
    : 'Hybrid Record Retrieval';

  const modeDescription = isKeyword
    ? 'Keyword-indexed text retrieval. No generative extrapolation.'
    : 'Evidence-grounded vector match against clinic records.';

  return (
    <div className="space-y-4">
      {/* Search Mode Provenance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 font-mono">
            <Search className="h-3 w-3 text-slate-500" />
            {modeTitle}
          </span>
          <span className="text-xs text-slate-500">{modeDescription}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>Evidence-Grounded Only</span>
        </div>
      </div>

      {/* Answer or No-Evidence Explanation */}
      {answer ? (
        <div className="rounded border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-900">
              Retrieved Clinical Synthesis
            </span>
            <span className="text-xs text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded border border-teal-200">
              Corroborated by {excerpts.length} record {excerpts.length === 1 ? 'excerpt' : 'excerpts'}
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
            {answer}
          </p>

          <div className="mt-3 pt-2.5 border-t border-teal-200/60 flex items-center gap-1.5 text-xs text-teal-800">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              Staff must cross-reference findings with primary source documents before altering treatment protocols.
            </span>
          </div>
        </div>
      ) : noEvidenceMessage ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
          <p className="text-sm font-medium text-slate-700">{noEvidenceMessage}</p>
          <p className="text-xs text-slate-500 mt-1">
            No documented findings matched the query parameters for this patient.
          </p>
        </div>
      ) : null}

      {/* Excerpts List */}
      {excerpts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Supporting Record Excerpts ({excerpts.length})
            </h4>
            <span className="text-xs text-slate-400">
              Direct verbatim quotes from indexed documents
            </span>
          </div>

          <div className="space-y-2.5">
            {excerpts.map((ex, index) => (
              <div
                key={ex.excerpt_id || index}
                className="rounded border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors"
              >
                {/* Excerpt Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-mono font-medium text-slate-400">#{index + 1}</span>
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium text-slate-800">{ex.document_name}</span>

                    {ex.page_number != null && (
                      <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono text-xs">
                        Page {ex.page_number}
                      </span>
                    )}

                    {ex.event_date && (
                      <span className="text-slate-500 font-mono">
                        · {formatDate(ex.event_date)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(ex)}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Copy excerpt with citation"
                    >
                      {copiedId === ex.excerpt_id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openDocument(ex.document_id)}
                      className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-slate-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open Source</span>
                    </button>
                  </div>
                </div>

                {/* Excerpt Body */}
                <div className="relative pl-3 border-l-2 border-teal-500/80 bg-slate-50/50 py-1.5 rounded-r">
                  <p className="text-xs text-slate-800 font-sans leading-relaxed">
                    "{ex.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
