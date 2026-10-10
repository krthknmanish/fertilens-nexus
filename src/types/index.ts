// Centralized API types for FertiLens Nexora

// ─── Health ───────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  timestamp: string;
  version?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  patient_count: number;
  document_count: number;
  event_count: number;
  pending_review_count: number;
  recent_documents: RecentDocument[];
  recent_activity: ActivityEntry[];
}

export interface RecentDocument {
  document_id: string;
  filename: string;
  patient_id: string | null;
  patient_display_name?: string | null;
  document_type: string | null;
  processing_status: ProcessingStatus;
  upload_timestamp: string;
  document_date: string | null;
}

// ─── Patients ─────────────────────────────────────────────────────────────────
export type ProcessingStatus = 'pending' | 'processing' | 'indexed' | 'error' | 'duplicate';

export interface PatientSummary {
  patient_id: string;
  display_name: string;
  last_visit_date: string | null;
  indexed_record_count: number;
  latest_event_description: string | null;
  unresolved_flag_count: number;
}

export interface PatientDetail {
  patient_id: string;
  display_name: string;
  summary: string | null;
  summary_is_generated: boolean;
  extracted_facts: Record<string, unknown> | null;
  past_events: TimelineEvent[];
  current_status_events: TimelineEvent[];
  future_events: TimelineEvent[];
  unresolved_flags: ReviewFlag[];
}

export interface TimelineEvent {
  event_id: string;
  event_date: string | null;
  event_type: string;
  description: string;
  status: string | null;
  source_document_id: string | null;
  source_document_name: string | null;
  verification_status: 'verified' | 'unverified' | 'conflicted' | null;
}

// ─── Documents ────────────────────────────────────────────────────────────────
export interface Document {
  document_id: string;
  filename: string;
  patient_id: string | null;
  patient_display_name?: string | null;
  document_type: string | null;
  processing_status: ProcessingStatus;
  upload_timestamp: string;
  document_date: string | null;
  file_size_bytes: number | null;
  page_count: number | null;
  is_duplicate: boolean;
  duplicate_of_document_id: string | null;
  processing_error: string | null;
  requires_review: boolean;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  processing_status: ProcessingStatus;
  message: string;
  patient_id: string | null;
  requires_staff_review: boolean;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchRequest {
  patient_id: string;
  query: string;
  search_mode?: 'keyword' | 'semantic' | 'hybrid';
}

export interface SearchResult {
  answer: string | null;
  no_evidence_message: string | null;
  search_mode: string;
  excerpts: SearchExcerpt[];
}

export interface SearchExcerpt {
  excerpt_id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  event_date: string | null;
  text: string;
  relevance_score: number | null;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface ReviewFlag {
  flag_id: string;
  conflict_type: string;
  patient_id: string;
  patient_display_name?: string | null;
  field_or_event: string;
  value_a: string;
  value_b: string;
  source_document_id_a: string;
  source_document_name_a: string | null;
  source_document_id_b: string;
  source_document_name_b: string | null;
  date_a: string | null;
  date_b: string | null;
  review_status: 'pending' | 'reviewed' | 'resolved';
  staff_note: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReviewPatchRequest {
  review_status: 'pending' | 'reviewed' | 'resolved';
  staff_note?: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface ActivityEntry {
  activity_id: string;
  action: string;
  timestamp: string;
  patient_id: string | null;
  patient_display_name?: string | null;
  document_id: string | null;
  document_name?: string | null;
  details: string | null;
}

// ─── Pagination & API errors ──────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  detail: string;
}
