import type {
  HealthResponse,
  DashboardStats,
  PatientSummary,
  PatientDetail,
  TimelineEvent,
  Document,
  DocumentUploadResponse,
  SearchRequest,
  SearchResult,
  ReviewFlag,
  ReviewPatchRequest,
  ActivityEntry,
} from '../types';
import {
  SEEDED_PATIENTS,
  SEEDED_PATIENT_DETAILS,
  SEEDED_DOCUMENTS,
  SEEDED_REVIEWS,
  SEEDED_ACTIVITY,
} from '../data/syntheticData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ─── Local State Persistence for Standalone Demo Mode ───────────────────────
const STORAGE_PREFIX = 'fertilens_demo_';

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // Ignore storage quota limits
  }
}

// Mutable in-memory stores initialized from localStorage or seed
let mockPatients: PatientSummary[] = getStored('patients', SEEDED_PATIENTS);
let mockPatientDetails: Record<string, PatientDetail> = getStored('patient_details', SEEDED_PATIENT_DETAILS);
let mockDocuments: Document[] = getStored('documents', SEEDED_DOCUMENTS);
let mockReviews: ReviewFlag[] = getStored('reviews', SEEDED_REVIEWS);
let mockActivity: ActivityEntry[] = getStored('activity', SEEDED_ACTIVITY);

export function resetDemoState(): void {
  localStorage.removeItem(STORAGE_PREFIX + 'patients');
  localStorage.removeItem(STORAGE_PREFIX + 'patient_details');
  localStorage.removeItem(STORAGE_PREFIX + 'documents');
  localStorage.removeItem(STORAGE_PREFIX + 'reviews');
  localStorage.removeItem(STORAGE_PREFIX + 'activity');

  mockPatients = [...SEEDED_PATIENTS];
  mockPatientDetails = JSON.parse(JSON.stringify(SEEDED_PATIENT_DETAILS));
  mockDocuments = [...SEEDED_DOCUMENTS];
  mockReviews = [...SEEDED_REVIEWS];
  mockActivity = [...SEEDED_ACTIVITY];
}

// ─── Network Request Runner ──────────────────────────────────────────────────
let hasAttemptedBackend = false;
let backendAvailable = false;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers:
      options.body instanceof FormData
        ? undefined // Let browser set multipart boundary
        : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      message = err?.detail ?? message;
    } catch {
      // Ignore JSON parse failures
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// ─── Health ───────────────────────────────────────────────────────────────────
export const getHealth = async (): Promise<HealthResponse> => {
  try {
    const res = await request<HealthResponse>('/api/health');
    backendAvailable = true;
    hasAttemptedBackend = true;
    return res;
  } catch (err) {
    backendAvailable = false;
    hasAttemptedBackend = true;
    // Return standalone demo mode indicator
    return {
      status: 'standalone_demo',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo-local',
    };
  }
};

export const isBackendConnected = (): boolean => backendAvailable;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    return await request<DashboardStats>('/api/dashboard/stats');
  } catch {
    // Derived dynamically from local state
    const pendingReviews = mockReviews.filter((r) => r.review_status === 'pending');
    let totalEvents = 0;
    Object.values(mockPatientDetails).forEach((p) => {
      totalEvents += (p.past_events?.length || 0) + (p.current_status_events?.length || 0) + (p.future_events?.length || 0);
    });

    return {
      patient_count: mockPatients.length,
      document_count: mockDocuments.length,
      event_count: totalEvents,
      pending_review_count: pendingReviews.length,
      recent_documents: mockDocuments.slice(0, 6) as any,
      recent_activity: mockActivity.slice(0, 5),
    };
  }
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const getPatients = async (search?: string): Promise<PatientSummary[]> => {
  try {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request<PatientSummary[]>(`/api/patients${qs}`);
  } catch {
    let list = [...mockPatients];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.patient_id.toLowerCase().includes(q),
      );
    }
    return list;
  }
};

export const getPatient = async (patientId: string): Promise<PatientDetail> => {
  try {
    return await request<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}`);
  } catch {
    const detail = mockPatientDetails[patientId];
    if (!detail) {
      throw new ApiError(404, `Patient record ${patientId} not found in synthetic cohort.`);
    }
    // Synchronize review flags with global reviews store
    const patientFlags = mockReviews.filter((r) => r.patient_id === patientId);
    return {
      ...detail,
      unresolved_flags: patientFlags,
    };
  }
};

export const getPatientTimeline = async (patientId: string): Promise<TimelineEvent[]> => {
  try {
    return await request<TimelineEvent[]>(
      `/api/patients/${encodeURIComponent(patientId)}/timeline`,
    );
  } catch {
    const detail = mockPatientDetails[patientId];
    if (!detail) return [];
    return [
      ...(detail.past_events || []),
      ...(detail.current_status_events || []),
      ...(detail.future_events || []),
    ];
  }
};

// ─── Documents ────────────────────────────────────────────────────────────────
export interface DocumentListParams {
  search?: string;
  patient_id?: string;
  document_type?: string;
  processing_status?: string;
}

export const getDocuments = async (params?: DocumentListParams): Promise<Document[]> => {
  try {
    const qs = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join('&')
      : '';
    return await request<Document[]>(`/api/documents${qs}`);
  } catch {
    let list = [...mockDocuments];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.filename.toLowerCase().includes(q) ||
          d.document_id.toLowerCase().includes(q),
      );
    }
    if (params?.patient_id) {
      if (params.patient_id === '__unassigned__') {
        list = list.filter((d) => !d.patient_id);
      } else {
        list = list.filter((d) => d.patient_id === params.patient_id);
      }
    }
    if (params?.document_type) {
      list = list.filter((d) => d.document_type === params.document_type);
    }
    if (params?.processing_status) {
      list = list.filter((d) => d.processing_status === params.processing_status);
    }
    return list;
  }
};

export const uploadDocument = async (formData: FormData): Promise<DocumentUploadResponse> => {
  try {
    return await request<DocumentUploadResponse>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  } catch {
    const file = formData.get('file') as File | null;
    const targetPatientId = (formData.get('patient_id') as string | null) || null;

    if (!file) {
      throw new ApiError(400, 'No document payload received.');
    }

    const docId = `DOC-${Math.floor(820 + Math.random() * 800)}`;
    const nowIso = new Date().toISOString();

    // Check for duplicate filename in existing records
    const isDuplicate = mockDocuments.some(
      (d) => d.filename.toLowerCase() === file.name.toLowerCase(),
    );

    const patientObj = targetPatientId
      ? mockPatients.find((p) => p.patient_id === targetPatientId)
      : null;

    const newDoc: Document = {
      document_id: docId,
      filename: file.name,
      patient_id: targetPatientId,
      patient_display_name: patientObj?.display_name || (targetPatientId ? targetPatientId : null),
      document_type: file.name.toLowerCase().includes('lab')
        ? 'Lab Report'
        : file.name.toLowerCase().includes('consult')
        ? 'Consultation Note'
        : 'Medical PDF',
      processing_status: isDuplicate ? 'duplicate' : 'indexed',
      upload_timestamp: nowIso,
      document_date: nowIso.split('T')[0],
      file_size_bytes: file.size,
      page_count: Math.max(1, Math.floor(file.size / 150000) + 1),
      is_duplicate: isDuplicate,
      duplicate_of_document_id: isDuplicate ? 'DOC-801' : null,
      processing_error: isDuplicate ? 'Duplicate intake flagged via SHA-256 match.' : null,
      requires_review: isDuplicate || !targetPatientId,
    };

    mockDocuments = [newDoc, ...mockDocuments];
    setStored('documents', mockDocuments);

    // If patient was matched, increment document count
    if (targetPatientId) {
      mockPatients = mockPatients.map((p) =>
        p.patient_id === targetPatientId
          ? { ...p, indexed_record_count: p.indexed_record_count + 1 }
          : p,
      );
      setStored('patients', mockPatients);
    }

    // Add activity
    const newActivity: ActivityEntry = {
      activity_id: `ACT-${Date.now().toString().slice(-4)}`,
      action: isDuplicate ? 'DUPLICATE_FLAGGED' : 'DOCUMENT_UPLOADED',
      timestamp: nowIso,
      patient_id: targetPatientId,
      patient_display_name: patientObj?.display_name ?? null,
      document_id: docId,
      document_name: file.name,
      details: isDuplicate
        ? `Duplicate document identified: ${file.name}`
        : `Ingested ${file.name} (${(file.size / 1024).toFixed(1)} KB) into repository.`,
    };
    mockActivity = [newActivity, ...mockActivity];
    setStored('activity', mockActivity);

    return {
      document_id: docId,
      filename: file.name,
      processing_status: newDoc.processing_status,
      message: isDuplicate
        ? 'Duplicate document detected and routed to staff review queue.'
        : !targetPatientId
        ? 'Document ingested without patient assignment. Awaiting identity confirmation.'
        : 'Document parsed and indexed into patient timeline.',
      patient_id: targetPatientId,
      requires_staff_review: newDoc.requires_review,
    };
  }
};

export const getDocument = async (documentId: string): Promise<Document> => {
  try {
    return await request<Document>(`/api/documents/${encodeURIComponent(documentId)}`);
  } catch {
    const doc = mockDocuments.find((d) => d.document_id === documentId);
    if (!doc) {
      throw new ApiError(404, `Document ${documentId} not found.`);
    }
    return doc;
  }
};

export const getDocumentFileUrl = (documentId: string): string =>
  `${BASE_URL}/api/documents/${encodeURIComponent(documentId)}/file`;

// ─── Evidence Search ──────────────────────────────────────────────────────────
export const postSearch = async (body: SearchRequest): Promise<SearchResult> => {
  try {
    return await request<SearchResult>('/api/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch {
    const qLower = body.query.toLowerCase();
    const patientDetail = mockPatientDetails[body.patient_id];

    if (!patientDetail) {
      return {
        answer: null,
        no_evidence_message: `No patient record indexed for ID: ${body.patient_id}.`,
        search_mode: body.search_mode || 'hybrid',
        excerpts: [],
      };
    }

    // Match based on clinical query keywords
    const excerpts: import('../types').SearchExcerpt[] = [];
    let answer: string | null = null;

    if (qLower.includes('amh') || qLower.includes('hormone') || qLower.includes('lab')) {
      if (body.patient_id === 'FL-1001') {
        answer =
          'Contradictory Anti-Müllerian Hormone (AMH) values documented across two laboratories: Memorial Endocrine Lab (2026-01-14) reported baseline AMH of 0.82 ng/mL (DOR indication), whereas St. Jude Medical external transfer (2026-02-02) reported 2.45 ng/mL. Clinician review flag FLG-301 is active.';
        excerpts.push(
          {
            excerpt_id: 'EXC-101',
            document_id: 'DOC-801',
            document_name: 'Memorial_Endocrine_Panel_Jan2026.pdf',
            page_number: 1,
            event_date: '2026-01-14',
            text: 'Anti-Müllerian Hormone (AMH): 0.82 ng/mL [Reference Range: 1.00 - 3.50 ng/mL]. Interpretation: Diminished ovarian reserve compatible with age 34.',
            relevance_score: 0.96,
          },
          {
            excerpt_id: 'EXC-102',
            document_id: 'DOC-803',
            document_name: 'External_Transfer_Lab_StJude.pdf',
            page_number: 2,
            event_date: '2026-02-02',
            text: 'AMH Serum: 2.45 ng/mL [Assay: Roche Elecsys]. Ovarian reserve within expected normal parameters.',
            relevance_score: 0.94,
          },
        );
      } else if (body.patient_id === 'FL-1003') {
        answer =
          'Baseline hormonal panel for Sarah Chen-Kowalski on 2026-02-12 demonstrated AMH 4.8 ng/mL, consistent with polycystic ovarian morphology and elevated response risk.';
        excerpts.push({
          excerpt_id: 'EXC-301',
          document_id: 'DOC-809',
          document_name: 'Hormonal_Assay_Quest_Chen.pdf',
          page_number: 1,
          event_date: '2026-02-12',
          text: 'AMH: 4.8 ng/mL. LH: 8.9 IU/L. FSH: 5.4 IU/L. Consistent with high follicle reserve.',
          relevance_score: 0.95,
        });
      }
    } else if (qLower.includes('embryo') || qLower.includes('blastocyst') || qLower.includes('fertiliz')) {
      if (body.patient_id === 'FL-1002') {
        answer =
          'Embryology culture record (2026-03-03) documents 12 oocytes injected via ICSI, 9 normal fertilizations (2PN), and 4 Day-5 blastocysts biopsied and cryopreserved for PGT-A.';
        excerpts.push({
          excerpt_id: 'EXC-201',
          document_id: 'DOC-807',
          document_name: 'Embryology_Culture_Day5_Report.pdf',
          page_number: 3,
          event_date: '2026-03-03',
          text: 'Day 5 Culture Summary: 4 blastocysts met expansion criteria (4AA, 4AB, 3BB, 3BB). Trophectoderm biopsy performed. Vitrified in straws #1-4.',
          relevance_score: 0.98,
        });
      }
    } else if (qLower.includes('plan') || qLower.includes('procedure') || qLower.includes('retrieval')) {
      if (body.patient_id === 'FL-1002') {
        answer =
          'ICSI procedure note documented retrieval planned for 2026-02-26 at 08:30 AM. However, no surgical completion note or anesthesia operative report has been indexed into the repository (Flag FLG-303).';
        excerpts.push({
          excerpt_id: 'EXC-202',
          document_id: 'DOC-806',
          document_name: 'ICSI_Procedure_Plan_Vance.pdf',
          page_number: 1,
          event_date: '2026-02-24',
          text: 'Plan: Transvaginal ultrasound-guided oocyte aspiration scheduled 2026-02-26 08:30. Anesthesia clearance received.',
          relevance_score: 0.92,
        });
      } else if (body.patient_id === 'FL-1001') {
        answer =
          'Oocyte retrieval planned tentatively for 2026-03-15 pending follicle trigger criteria (Consultation Dr. Mercer).';
        excerpts.push({
          excerpt_id: 'EXC-103',
          document_id: 'DOC-802',
          document_name: 'IVF_Cycle_Planning_Consult_Mercer.pdf',
          page_number: 2,
          event_date: '2026-01-20',
          text: 'Tentative cycle trajectory places oocyte retrieval at cycle day 13-14 (approx March 15, 2026).',
          relevance_score: 0.89,
        });
      }
    } else if (qLower.includes('miss') || qLower.includes('report') || qLower.includes('hsg') || qLower.includes('requested')) {
      if (body.patient_id === 'FL-1001') {
        answer =
          'An external Hysterosalpingogram (HSG) disc was requested from Metropolitan Imaging during cycle planning on 2026-01-20, but the radiographic report remains unindexed in the document repository.';
        excerpts.push({
          excerpt_id: 'EXC-104',
          document_id: 'DOC-802',
          document_name: 'IVF_Cycle_Planning_Consult_Mercer.pdf',
          page_number: 3,
          event_date: '2026-01-20',
          text: 'Records Request: Outside HSG performed 2024 to evaluate left salpingectomy status requested from Metropolitan Imaging. Unreceived as of cycle baseline.',
          relevance_score: 0.93,
        });
      }
    } else if (qLower.includes('consult') || qLower.includes('visit') || qLower.includes('change')) {
      const pastEvents = patientDetail.past_events || [];
      answer = `Patient has ${pastEvents.length} recorded prior clinical encounters spanning from ${pastEvents[0]?.event_date || 'earlier'} to ${pastEvents[pastEvents.length - 1]?.event_date || 'recent'}.`;
      pastEvents.forEach((ev, i) => {
        excerpts.push({
          excerpt_id: `EXC-GEN-${i}`,
          document_id: ev.source_document_id || 'DOC-801',
          document_name: ev.source_document_name || 'Encounter Note',
          page_number: 1,
          event_date: ev.event_date,
          text: ev.description,
          relevance_score: 0.85,
        });
      });
    }

    // Log this search into activity stream
    const searchActivity: ActivityEntry = {
      activity_id: `ACT-${Date.now().toString().slice(-4)}`,
      action: 'EVIDENCE_SEARCH',
      timestamp: new Date().toISOString(),
      patient_id: body.patient_id,
      patient_display_name: patientDetail.display_name,
      document_id: excerpts[0]?.document_id || null,
      document_name: excerpts[0]?.document_name || null,
      details: `Search inquiry: "${body.query}" (${excerpts.length} excerpts retrieved)`,
    };
    mockActivity = [searchActivity, ...mockActivity];
    setStored('activity', mockActivity);

    if (excerpts.length === 0) {
      return {
        answer: null,
        no_evidence_message: `No clinical evidence found for "${body.query}" in the indexed records for ${patientDetail.display_name}.`,
        search_mode: body.search_mode || 'hybrid',
        excerpts: [],
      };
    }

    return {
      answer,
      no_evidence_message: null,
      search_mode: body.search_mode || 'hybrid',
      excerpts,
    };
  }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getReviews = async (status?: string): Promise<ReviewFlag[]> => {
  try {
    const qs = status ? `?review_status=${encodeURIComponent(status)}` : '';
    return await request<ReviewFlag[]>(`/api/reviews${qs}`);
  } catch {
    if (status) {
      return mockReviews.filter((r) => r.review_status === status);
    }
    return [...mockReviews];
  }
};

export const patchReview = async (
  flagId: string,
  body: ReviewPatchRequest,
): Promise<ReviewFlag> => {
  try {
    return await request<ReviewFlag>(`/api/reviews/${encodeURIComponent(flagId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  } catch {
    const index = mockReviews.findIndex((r) => r.flag_id === flagId);
    if (index === -1) {
      throw new ApiError(404, `Review flag #${flagId} not found.`);
    }

    const current = mockReviews[index];
    const nowIso = new Date().toISOString();
    const updated: ReviewFlag = {
      ...current,
      review_status: body.review_status,
      staff_note: body.staff_note !== undefined ? body.staff_note : current.staff_note,
      updated_at: nowIso,
    };

    mockReviews[index] = updated;
    setStored('reviews', mockReviews);

    // Update patient flags count in mockPatients
    const remainingPendingForPatient = mockReviews.filter(
      (r) => r.patient_id === updated.patient_id && r.review_status === 'pending',
    ).length;

    mockPatients = mockPatients.map((p) =>
      p.patient_id === updated.patient_id
        ? { ...p, unresolved_flag_count: remainingPendingForPatient }
        : p,
    );
    setStored('patients', mockPatients);

    // Add activity log
    const act: ActivityEntry = {
      activity_id: `ACT-${Date.now().toString().slice(-4)}`,
      action: body.review_status === 'resolved' ? 'DISCREPANCY_RESOLVED' : 'REVIEW_UPDATED',
      timestamp: nowIso,
      patient_id: updated.patient_id,
      patient_display_name: updated.patient_display_name ?? null,
      document_id: updated.source_document_id_a,
      document_name: updated.source_document_name_a ?? null,
      details: `Flag #${flagId} status updated to ${body.review_status}. Note: ${body.staff_note || 'No note recorded'}`,
    };
    mockActivity = [act, ...mockActivity];
    setStored('activity', mockActivity);

    return updated;
  }
};

// ─── Activity ─────────────────────────────────────────────────────────────────
export const getActivity = async (params?: {
  patient_id?: string;
  action?: string;
  limit?: number;
}): Promise<ActivityEntry[]> => {
  try {
    const qs = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v!))}`)
          .join('&')
      : '';
    return await request<ActivityEntry[]>(`/api/activity${qs}`);
  } catch {
    let list = [...mockActivity];
    if (params?.patient_id) {
      list = list.filter((a) => a.patient_id === params.patient_id);
    }
    if (params?.action) {
      const act = params.action.toLowerCase();
      list = list.filter(
        (a) =>
          a.action.toLowerCase().includes(act) ||
          (a.details && a.details.toLowerCase().includes(act)),
      );
    }
    if (params?.limit) {
      list = list.slice(0, params.limit);
    }
    return list;
  }
};

export { ApiError };
