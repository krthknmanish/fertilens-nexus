# FertiLens Nexus

**Evidence-Grounded Patient History Retrieval and Temporal Intelligence for Fertility Clinics**

FertiLens Nexus helps authorized fertility-clinic staff find relevant patient history, trace findings directly to original source documents, identify inconsistencies between medical records, and review cycle changes over time.

---

## 1. Product Capabilities & Highlights

- **Overview Dashboard:** Live metrics derived from actual state (Patients Indexed, Documents Indexed, Timeline Events, Pending Discrepancies, Attention Queue, Recent Ingestions, and System Audit Stream). Clicking any metric navigates to the relevant filtered page.
- **Patient Directory (`/patients`):** Searchable by patient name or clinical identifier (`FL-1001`, `FL-1002`, `FL-1003`). Tracks record status, last encounter dates, indexed document counts, and unresolved flag indicators.
- **Longitudinal Patient History (`/patients/:id`):**
  - Clinical header with demographic and protocol parameters.
  - Case synthesis distinguishing between extracted provider notes and evidence-grounded summaries.
  - Interactive tabs: **Chronological Timeline**, **Indexed Documents**, **Past Documented Events**, **Current Findings & Unresolved**, **Planned Next Steps**, and **Review Discrepancies**.
  - Reversible chronological sorting (oldest first or newest first) with event category filtering (Consultation, Laboratory, Ultrasound, Medication, Procedure).
  - Explicit distinction between planned and completed procedures.
- **Document Repository (`/documents`):**
  - Filterable by keyword, patient, category, and processing status.
  - Drag-and-drop PDF intake modal with MIME validation, 50MB file size ceiling, and browser SHA-256 cryptographic hashing to identify duplicates.
  - Primary document metadata inspector and built-in clinical document viewer.
- **Evidence-Grounded Search (`/evidence`):**
  - Clinical queries across indexed patient records (e.g., *"latest AMH result"*, *"embryology report"*, *"planned procedure"*).
  - Multi-mode engine (Hybrid BM25 + Vector, Semantic, Keyword).
  - Ground-truth evidence cards with verbatim excerpts, document title, page numbers, record dates, and copyable citations.
  - **Critical Evidence Rule:** Never fabricates source pages, laboratory values, or dates. Transparently reports if no supporting evidence exists.
- **Discrepancy Review Queue (`/reviews`):**
  - Surfaces planted clinical inconsistencies:
    1. **Biomarker Discordance (AMH):** Conflicting baseline AMH values (0.82 ng/mL vs 2.45 ng/mL) across two laboratories.
    2. **Missing Requested Record:** Prior HSG pelvic imaging requested from outside clinic but absent in indexed records.
    3. **Planned Procedure Without Completion Note:** Egg retrieval planned for Feb 26 with embryo culture report present, but surgical operative discharge summary unindexed.
    4. **Patient Identity Match Requiring Confirmation:** External fax matching patient DOB but listing maiden surname without hyphenation.
    5. **Duplicate Document Requiring Review:** Identical document ingested twice flagged via cryptographic SHA-256 hash collision.
  - Allows staff to review side-by-side evidence, document reconciliation rationale, and transition statuses (`Needs Review`, `Reviewed`, `Resolved`, `Reopen`).
  - Automatically updates shared counts, audit logs, and persistent state.
- **System Audit Trail (`/activity`):**
  - Cryptographically ordered operational log of document ingestions, duplicate detections, evidence searches, and clinician reconciliations.
- **Role-Aware Simulation & Settings (`/settings`):**
  - Interactive DEMO role switcher simulating access for:
    - *Clinic Administrator* (Full clinical administration & audit visibility)
    - *Fertility Specialist* (History, timeline, evidence search, review reconciliation)
    - *Embryologist* (Laboratory & embryology records focus)
    - *Nurse / Clinical Coordinator* (Encounter prep & requested records follow-up)
    - *Records Officer* (Document intake, duplicate review, identity matching)
  - One-click demo state reset restoring pristine seeded data.
  - Responsible AI & privacy guardrail disclaimers.

---

## 2. Operating Modes: Standalone Demo vs. Backend-Connected

FertiLens Nexus is architected with a unified service layer (`src/services/api.ts`):

1. **Standalone Demo Mode (Active when no backend is running):**
   - Self-contained in the browser using pre-seeded synthetic data.
   - All state updates (review resolutions, staff notes, uploaded document records, and activity logs) persist across page reloads via `localStorage`.
   - Labeled clearly with **"STANDALONE DEMO"** and **"DEMO — SYNTHETIC DATA ONLY"** badges in the top bar.
2. **Backend-Connected Mode (FastAPI):**
   - Automatically probes `VITE_API_BASE_URL` (default: `http://127.0.0.1:8000`).
   - If a FastAPI backend is running with endpoints (`/api/health`, `/api/patients`, `/api/documents`, `/api/search`, `/api/reviews`, `/api/activity`), requests route seamlessly through the network.
   - Real binary PDFs are served from disk via `/api/documents/{id}/file`.

---

## 3. Technology Stack

- **Framework:** React 19, TypeScript
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS 4 with healthcare color system (Deep navy, warm slate, muted teal accents, amber warning states, red conflict indicators)
- **Icons:** Lucide React
- **Routing:** React Router 7

---

## 4. Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### Production Build & Verification

```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

The production output is generated in `dist/`.

---

## 5. Deployment Guide (Netlify / Vercel)

### Netlify Deployment
1. **Build Command:** `npm run build`
2. **Publish Directory:** `dist`
3. **Environment Variables:**
   - `VITE_API_BASE_URL`: Leave blank for Standalone Demo Mode, or set to your live FastAPI backend URL (e.g., `https://api.fertilens.example.com`).
4. **SPA Fallback:** Vite is configured with `index.html` fallback. For Netlify, ensure `public/_redirects` contains:
   ```
   /*    /index.html   200
   ```

### Vercel Deployment
1. Import the repository with root set to `frontend`.
2. Framework Preset: **Vite**.
3. Output Directory: `dist`.
4. Deploy!

---

## 6. Privacy & Synthetic Data Statement

All patient names (*Elena Rostova*, *Marcus & Chloe Vance*, *Sarah Chen-Kowalski*), IDs (*FL-1001*, *FL-1002*, *FL-1003*), laboratory values, ultrasound scans, and embryology records are **completely synthetic and fictional**. They are provided solely for clinical operations simulation. FertiLens Nexus does not automate medical diagnosis or treatment plans.
