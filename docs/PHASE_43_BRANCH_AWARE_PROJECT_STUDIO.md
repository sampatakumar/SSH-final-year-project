# Phase 43: Branch-Aware Project Studio & Evidence Portfolio

**Repository**: `/home/sampatakumar/Projects/projects/ssh_expand/SSH_integrated_Project`  
**Active Branch**: `expand-test`  
**Starting Commit**: `22d5a0c` (Phase 42 Baseline)  
**Protected Main Baseline**: `e9d89a5898f5c3c28062e9346b339b9b84f7ae90` (strictly preserved, untouched)  
**Date**: October 2026  
**Commit Message**: `feat(phase-43): add branch-aware project studio`

---

## 1. Executive Summary & Objective

Phase 43 transforms Smart Skill Hub's (SSH) multi-branch foundation established in Phase 42 into a tangible, production-ready **Project Studio & Evidence Portfolio**.

Rather than limiting project workflows to software development (CSE/IT), students across **all academic streams** (Mechanical, Electrical & Electronics, Civil, Chemical, Biotechnology, Business/MBA, Finance/B.Com, Arts & Humanities, Nursing & Allied Health, and Computer Science) can:
1. Discover and start curated, discipline-specific project blueprints aligned with their academic branch, degree level, and target career roles.
2. Advance through structured, ordered milestones without being locked into artificial rigid paths.
3. Submit heterogeneous project deliverables (technical reports, CAD drawings, schematic diagrams, mass balance sheets, construction plans, market research decks, clinical reflections, data tables, and code repositories).
4. Receive deterministic, rubric-based evaluation scores across weighted dimensions (technical correctness, reasoning quality, completeness, documentation, domain skills, and reflection) against a clear 70% threshold.
5. Safely manage their review lifecycle (`available` → `in_progress` → `submitted` → `changes_requested` / `completed` → `archived`).
6. Curate an evidence-backed public/private portfolio with student-controlled privacy toggles.
7. Seamlessly bridge completed project achievements into their existing Resume Builder showcase without disrupting existing resume layouts.
8. Receive context-aware guidance from the AI Mentor based on active milestone progress, missing deliverables, and rubric feedback.

---

## 2. Architecture Decisions & Design Principles

### 2.1 Schema & Data Separation
- **`ProjectTemplate`**: Stores immutable or versioned project blueprints authored for specific disciplines. Each template includes metadata, learning objectives, prerequisites, ordered milestones, required deliverables, evidence guidelines, canonical skill tags, and a weighted evaluation rubric.
- **`StudentProject`**: Represents an individual student's persistent working copy of a project blueprint. Tracks current milestone index, deliverable submissions (with content, URLs, file metadata), written explanations, evaluation outcomes (dimension scores, overall score, feedback, timestamp, evaluator), portfolio visibility (`portfolioVisibility`, default `false`), and resume sync status (`syncedToResume`).

### 2.2 Strict State Machine
Project state transitions are strictly governed on the backend:
- `startProject`: Instantiates a student project in `in_progress`.
- `updateMilestoneProgress`: Updates milestone statuses (`pending`, `in_progress`, `completed`, `skipped`) and auto-advances `currentMilestoneIndex`.
- `saveProjectDeliverables`: Persists draft deliverables and written explanations while remaining `in_progress`.
- `submitProjectForReview`:
  - If required deliverables are present, scores the submission via the rubric engine.
  - If score ≥ 70%, transitions status to `completed` and sets `completedAt`.
  - If score < 70% or required deliverables are missing, transitions status to `changes_requested` and returns constructive feedback for revision.
  - Direct frontend transition to `completed` is blocked; completion is solely achievable through rubric evaluation.
- `archiveProject`: Allows archiving from any terminal or active state.

### 2.3 Evidence & Deliverable Storage Integrity
- Deliverables accept text notes, external URLs (GitHub, Figma, Google Drive, public datasets), and uploaded files.
- File uploads are processed using Multer memory storage with a 10MB limit and safe MIME type filtering (`image/*`, `application/pdf`, text/plain, CAD/doc files), rejecting executables, scripts, or unsafe extensions.
- Ownership checks (`project.owner.toString() === studentId.toString()`) guard every read, write, submission, and visibility endpoint.
- File contents are never executed on the host, adhering strictly to the `CODING_EXECUTION_ENABLED=false` safeguard.

### 2.4 Evidence Integrity Classification
To maintain high credibility and avoid inflating student achievements:
1. **Self-Reported Evidence**: Deliverable links, preliminary draft files, and written explanations uploaded by the student. Clearly designated as student-submitted.
2. **Rubric-Assessed Work**: Submissions graded by SSH's deterministic rubric engine. Each dimension contains an objective weight, score, and constructive evaluation rationale. Recorded with `evaluator: "Deterministic Rubric Engine (Phase 43)"`.
3. **Independently Verified Results**: Reserved for cryptographic test suite assertions (such as coding sandbox tests or external proctored assessments). Guided studio projects do not falsely claim automated compiler verification or external accreditation.

### 2.5 Capability Registry Integration
- In `backend/src/modules/academic/services/branchCapabilityRegistry.service.js`, the capability key `PROJECT_STUDIO: "project_studio"` was registered with label `"Project Studio & Portfolio Evidence"`.
- Set to `AVAILABLE` across all 8 branch groups: `CSE_IT`, `MECH_CORE`, `ECE_EEE`, `CIVIL_INFRA`, `CHEM_MATERIALS`, `BIO_HEALTH`, `MGMT_COMMERCE`, and `ARTS_HUMANITIES`.
- Specialized simulation engines (`CAD_PORTFOLIO`, `CIRCUIT_EXERCISES`, `CLINICAL_SIMULATION`, etc.) remain explicitly reported as `PLANNED` or `EXPERIMENTAL` to avoid misleading students regarding interactive simulation tools.

---

## 3. Curated Project Templates Catalog

Ten rich, production-grade project blueprints were authored in `projectTemplatesCatalog.js`, each with concrete milestones, specific deliverables, and 100-point rubrics:

| Template ID | Discipline / Branch | Title | Milestones | Primary Deliverables | Required Skills |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mech-gearbox-design` | Mechanical (`mech`, `auto`) | Two-Stage Industrial Reduction Gearbox Design & Analysis | 4 | Load calculations, CAD assembly/drawings, FEA stress report, BOM | CAD, Mechanical Design, FEA, Manufacturing Drawings |
| `ece-iot-smart-meter` | ECE / EEE (`ece`, `ee`, `eee`) | Smart IoT Energy Meter with Real-Time MQTT Telemetry | 4 | Schematic & PCB layout, Firmware repo/hex, Telemetry dashboard, Calibration report | Embedded Systems, IoT, PCB Design, MQTT |
| `civil-retaining-wall` | Civil (`civil`, `env_eng`) | Reinforced Concrete Cantilever Retaining Wall Design & Stability Analysis | 4 | Geotechnical & soil calculations, Structural design sheet, AutoCAD rebar detailing, BOQ & cost estimate | Structural Analysis, Reinforced Concrete, AutoCAD, Quantity Surveying |
| `chem-distillation-column` | Chemical (`chem_eng`, `petro`) | Continuous Binary Ethanol-Water Distillation Column Design | 4 | Process flow diagram (PFD), McCabe-Thiele balance sheets, Column sizing/hydraulic datasheet, HAZOP risk assessment | Process Engineering, Mass Balance, Chemical Engineering, HAZOP |
| `bio-pcr-diagnostic` | Biotechnology (`biotech`, `bioinfo`) | Development of a Multiplex PCR Assay for Pathogen Detection | 4 | Primer design & validation dossier, Protocol SOP & master mix, Gel electrophoresis analysis, Assay validation report | Molecular Biology, PCR, Bioinformatics, Assay Validation |
| `mgmt-b2b-market-expansion` | Business / MBA (`mba`, `bba`) | B2B SaaS Market Expansion Strategy & Go-To-Market Plan | 4 | Market opportunity & TAM deck, Competitor positioning matrix, GTM strategy & unit economics, Exec pitch deck | Market Research, Business Strategy, Financial Modeling, Presentation |
| `fin-equity-research-report` | Finance / B.Com (`bcom`, `mcom`, `fin_tech`) | Comprehensive Equity Research & DCF Valuation Analysis | 4 | 3-Statement financial model (Excel), DCF & multiples valuation, Industry & moat analysis, Investment thesis note | Financial Modeling, Valuation, Equity Research, Accounting |
| `arts-digital-heritage-archive` | Arts / Humanities (`history`, `english`, `journalism`) | Public Digital Humanities Archive & Historiographical Narrative | 4 | Primary source corpus curation, Historiographical essay, Interactive timeline/archive link, Public audience reflection | Historical Research, Digital Humanities, Critical Analysis, Content Strategy |
| `health-clinical-case-study` | Nursing / Allied Health (`nursing`, `physio`, `pharm`) | Complex Post-Operative Sepsis Care Plan & Evidence-Based Reflection | 4 | Patient assessment & triage note, SBAR interprofessional handover, Evidence-based nursing care plan, Reflective practice journal | Clinical Assessment, Nursing Care Plans, Patient Safety, Evidence-Based Practice |
| `cse-microservices-ecommerce` | Computer Science (`cse`, `it`, `ai_ds`) | High-Throughput Event-Driven Microservices Platform | 4 | Architecture design & OpenAPI spec, GitHub repository, Containerized deployment & Docker compose, Load test report & benchmarks | System Design, Node.js, Microservices, Docker |

---

## 4. Evaluation Rubric & Scoring Logic

The evaluation engine (`projectRubricEvaluation.service.js`) validates student submissions against six standard dimensions (weights sum to 100):
1. **Technical Correctness & Methodology** (25%): Scientific rigor, mathematical accuracy, engineering conventions, code or clinical validity.
2. **Quality of Reasoning & Critical Analysis** (20%): Depth of justification, evaluation of alternatives, sensitivity or risk considerations.
3. **Completeness & Alignment with Deliverables** (20%): Presence and substantive completion of all required deliverables.
4. **Documentation, Clarity & Professional Standards** (15%): Organization, visual diagrams, labeling, bibliography, and presentation polish.
5. **Demonstration of Target Domain Skills** (10%): Active practical application of designated branch skills.
6. **Reflection, Iteration & Learning Synthesis** (10%): Self-awareness, acknowledged assumptions, limitations, and future improvements.

### Scoring Calculation
- Checks deliverable completeness across all required deliverables.
- Multiplies score percentages by dimension weights:
  $$\text{Total Score} = \sum (\text{Dimension Score} \times \text{Weight})$$
- Passing threshold: **70%**.
- Generates detailed, itemized feedback for each dimension.
- If incomplete or below 70%, provides clear revision guidance and transitions state to `changes_requested`.

---

## 5. Portfolio & Resume Integration

### 5.1 Evidence Portfolio
- Completed projects can be surfaced on the student's Evidence Portfolio tab (`EvidencePortfolioView.tsx`).
- Controlled via a toggle (`togglePortfolioVisibility` API): `portfolioVisibility: true/false`.
- Displays project title, branch tag, completion date, verified rubric score badge, skills tags, written summary, and links to all submitted deliverables.
- Uncompleted projects are barred from public portfolio showcase.

### 5.2 Resume Showcase Sync
- When a project reaches `completed` status, the student can click **"Add to Resume Showcase"** (`syncToResumeShowcase` API).
- This creates or updates a corresponding entry in the existing `Project` collection (`modules/resume`) with `source: "manual"`, setting the title, summary, skills, and deliverable links.
- **Zero-Disruption Guarantee**: Does not overwrite the user's active resume templates or PDF formatting; it simply enriches the student's available project assets library for inclusion in resumes.
- Existing manual project entry workflows for CSE/IT students are preserved in full via `ManualResumeProjectsTab.tsx`.

---

## 6. AI Mentor & Student Context Integration

- **`smart-mentor-context.service.js`**:
  - Gathers student's active project data: projects in progress, current milestone, completed projects, missing deliverables, and latest rubric scores.
  - Adds a structured summary block to the mentor context:
    ```
    Project Studio Overview:
    - In-Progress Projects: Two-Stage Industrial Reduction Gearbox Design & Analysis (Milestone 2/4)
    - Completed Projects: 1 (Smart IoT Energy Meter with Real-Time MQTT Telemetry, Score: 85%)
    - Active Deliverable Gaps: Load calculations, CAD assembly/drawings
    ```
  - Appends actionable recommendations to `unifiedNextActions` (e.g. submitting pending deliverables or revising work under `changes_requested`).
- **`smart-mentor.service.js`**:
  - Injects Rule 12 into system prompt: "PROJECT STUDIO GUIDANCE: When advising students on active projects, refer to their specific current milestones, required deliverables, and rubric dimensions."
- **`smart-mentor-local.service.js`**:
  - Implements local intent classification for `project_studio_guidance`.
  - Generates deterministic, branch-tailored guidance for milestone completion and deliverable preparation when cloud LLM is offline.

---

## 7. Frontend User Experience

The `/dashboard/projects` route was upgraded to a four-tab Project Studio:
1. **Project Workspace** (`ActiveProjectWorkspace.tsx`):
   - Active project progress banner with percentage complete.
   - Milestone stepper with status indicators (`pending`, `in_progress`, `completed`).
   - Expandable milestone details, instructions, and checklist items.
   - Deliverable submission forms (links, text descriptions, file uploads).
   - Written explanations narrative box.
   - Live rubric evaluation score banner with dimension-by-dimension breakdown.
   - Action buttons: "Save Progress" and "Submit for Review".
2. **Blueprint Catalog** (`ProjectCatalogView.tsx`):
   - Discipline category filter chips (Engineering, Computing, Business, Science, Health, Humanities).
   - Difficulty selector and text search.
   - Detailed blueprint cards showing branch tags, estimated hours, milestones count, and skill badges.
   - "View Blueprint" modal displaying full curriculum, prerequisites, deliverables, and rubric breakdown.
   - "Start Project" action button.
3. **Evidence Portfolio** (`EvidencePortfolioView.tsx`):
   - Completed project cards with rubric score badges.
   - Public/private portfolio visibility toggle.
   - "Sync to Resume Showcase" button with synced confirmation indicator.
   - Clickable deliverable links and skill tags.
4. **Resume Showcase** (`ManualResumeProjectsTab.tsx`):
   - Preserves 100% backward compatibility for custom project entries, GitHub imports, and existing resume workflows.

---

## 8. Verification & Test Results

### 8.1 Backend Test Results
- **Phase 43 Suite**: `backend/test/phase43.project-studio.test.js`
  - **21 passed** (100% pass rate)
  - Tests verify: template querying, branch filtering, project lifecycle state transitions, milestone progression, deliverable validation, 70% rubric passing logic, feedback generation, portfolio visibility toggling, resume showcase synchronization, and unauthorized access blocking.
- **Phase 42 Multi-Branch Regression Suite**: `backend/test/phase42.multi-branch.test.js`
  - **21 passed**
- **Phase 41 Mentor Context Suite**: `backend/test/phase41.cross-module-mentor.test.js`
  - **15 passed**
- **Full Backend Regression Suite**:
  - **68 test files passed (68 total)**
  - **903 tests passed (903 total)**
  - Zero failures across all existing modules (Coding, Resume, Portfolios, EduTube, Analytics, Mentor, Academic).

### 8.2 Frontend Test Results
- **Phase 43 Suite**: `frontend/src/test/phase43.project-studio-frontend.test.tsx`
  - **14 passed** (100% pass rate)
  - Tests verify: tab switching, catalog rendering, blueprint modal, active project milestone tracker, deliverable entry, written explanations, submission feedback banner, portfolio toggle, and legacy project preservation.
- **Navigation Links Suite**: `frontend/src/test/navigation.links.test.tsx`
  - **4 passed**
- **Phase 42 Multi-Branch Frontend Suite**: `frontend/src/test/phase42.multi-branch-frontend.test.tsx`
  - **5 passed**
- **Full Frontend Regression Suite**:
  - **49 test files passed (49 total)**
  - **338 tests passed (338 total)**
  - Zero test failures across the entire frontend suite.

### 8.3 Frontend Production Build
- Command: `npm run build`
- Completed cleanly in **8.19 seconds**.
- Zero TypeScript errors, zero bundler warnings, zero asset resolution issues.

---

## 9. Known Limitations & Roadmap Context

1. **Deterministic Rubric Assessment vs. Subject Matter Expert Review**:
   - The current rubric engine deterministically verifies deliverable presence, length, and structured keywords against criteria weights.
   - It does not replace deep human peer-review or licensed professional engineering certification.
2. **Interactive Simulation Engines**:
   - CAD viewers, SPICE circuit simulators, finite element solvers, and wet-lab apparatus remain catalogued as `PLANNED` in the Capability Registry.
   - Phase 43 supports student submission and presentation of artifacts generated from external tools (SolidWorks, MATLAB, SPICE, AutoCAD, Excel) rather than executing simulation code in-browser.
3. **Disciplines Requiring Further Blueprints**:
   - Law & Legal Studies, Agricultural Sciences, Architecture, and Performing Arts can be expanded with additional blueprints in subsequent content phases using the existing `ProjectTemplate` schema.
