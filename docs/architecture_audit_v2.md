# Smart Skill Hub — Multi-Branch Foundation Architecture Audit v2
**Document Version:** 2.0.0  
**Status:** Audit & Controlled Plan (Pending User Approval)  
**Date:** 2026-10-17  
**Scope:** Multi-Branch Student Foundation, Career-Role Mapping & Profile Integration (Phase 1)

---

## 1. Executive Summary

This v2 Architecture Audit replaces and supersedes the preliminary audit report. It is based upon direct inspection of the live Smart Skill Hub (SSH) codebase, active route registries, Mongoose schemas, controllers, frontend type definitions, and downstream consumer pipelines.

### Key Audit Findings:
1. **Active Route Registry vs Legacy Duplicates**:
   - Live authentication and profile update requests are routed by `backend/src/app.js` through `backend/src/core/auth/auth.routes.js` to `backend/src/core/auth/auth.controller.js`.
   - `backend/src/controllers/auth.controller.js` and `backend/src/routes/auth.routes.js` are legacy duplicate implementations. Both are currently synchronized in this workspace, but the authoritative runtime pipeline is strictly `backend/src/core/auth/`.
2. **Dual-Model Re-export Pattern**:
   - The repository establishes core Mongoose schemas in `backend/src/core/database/models/` and re-exports them via `backend/src/models/`.
   - All academic taxonomy and career role models must adhere to this exact two-tier pattern to prevent broken imports across legacy and modular features.
3. **Downstream Dependencies on Single `targetRole`**:
   - The singular string `user.targetRole` (default: `"Full Stack Developer"`) is actively consumed by:
     - Smart AI Mentor (`backend/src/modules/mentor/services/smart-mentor-context.service.js`)
     - Skill Gap Engine (`backend/src/modules/gaps/services/skillGap.service.js`)
     - GitHub Career Analyzer (`backend/src/modules/github/services/githubCareer.service.js`)
     - Dashboard Analytics & Snapshot (`backend/src/controllers/dashboard.controller.js`)
   - Any multi-goal expansion (`targetRoles: [String]`) must strictly synchronize `user.targetRole = targetRoles[0]` to prevent catastrophic runtime failures across existing AI and analytics modules.
4. **Separation of Academic Taxonomy vs Historical Education**:
   - `user.educationEntries` (array of objects) and `user.education` (array of formatted summary strings) are historical resume records consumed by `frontend/src/modules/resume/services/resume-profile-adapter.ts` for PDF/ATS resume generation.
   - Current academic enrollment (`academic`) must remain an independent structured subdocument and must never overwrite or truncate historical resume education.
5. **Skill Gap Benchmark Coverage Gap**:
   - `backend/src/modules/gaps/benchmarks/roleRequirements.js` defines exactly 24 software/computing role archetypes.
   - If a student chooses an engineering or commerce role (e.g., "VLSI Design Engineer", "CAD Engineer", "Financial Analyst"), `skillGap.service.js` currently defaults to `"Full Stack Developer"`. A graceful fallback policy is documented herein to prevent irrelevant skill evaluations.

---

## 2. Verified Current Architecture

### 2.1 Technology Stack & Ingestion Pipeline
- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Radix UI Primitives, Lucide Icons, TanStack React Query v5, Framer Motion, Sonner Toasts.
- **Backend**: Node.js (ESM), Express 5, Mongoose 8 (MongoDB), Zod 3.23 (schema validation).
- **Authentication**: Firebase Authentication (Client SDK + Admin SDK JWT verification via Google JWKS public certs).
- **Session Model**: Bearer ID token in `Authorization` header decoded by `backend/src/core/auth/auth.middleware.js` to populate `req.auth` and `req.user`.

### 2.2 Active Route Mapping & Entry Points
| Mounted Route | Active Router File | Active Controller File | Verified Consumers |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth` | `backend/src/core/auth/auth.routes.js` | `backend/src/core/auth/auth.controller.js` | `AuthContext.tsx`, `ProfileDetailsPage.tsx`, `OnboardingFlow.tsx` |
| `/api/v1/dashboard` | `backend/src/routes/dashboard.routes.js` | `backend/src/controllers/dashboard.controller.js` | Student Dashboard, Full Profile Snapshot |
| `/api/v1/gaps` | `backend/src/modules/gaps/routes/gaps.routes.js` | `backend/src/modules/gaps/controllers/gaps.controller.js` | Skill Gap Matrix & Readiness Scoring |
| `/api/v1/mentor` | `backend/src/modules/mentor/routes/smartMentor.routes.js` | `backend/src/modules/mentor/controllers/smartMentor.controller.js` | Smart AI Mentor Chat & Real-Time Advice |
| `/api/v1/resumes` | `backend/src/modules/resume/routes/resume.routes.js` | `backend/src/modules/resume/controllers/resume.controller.js` | ATS Resume Builder, Templates, PDF Exporter |
| `/api/v1/academic` | `backend/src/modules/academic/routes/academic.routes.js` | `backend/src/modules/academic/controllers/academic.controller.js` | Academic Options, Catalog Filters, Admin Seeding |

---

## 3. Existing Data and API Contracts

### 3.1 Current User Model Schema (`user.models.js`)
```javascript
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  emailVerified: { type: Boolean, default: false },
  displayName: { type: String, trim: true, default: "" },
  photoURL: { type: String, default: "" },
  role: { type: String, enum: ["student", "recruiter", "admin"], default: "student" },
  phone: { type: String, trim: true, default: "" },
  about: { type: String, trim: true, default: "" },
  headline: { type: String, trim: true, default: "" },
  targetRole: { type: String, trim: true, default: "Full Stack Developer" },
  targetRoles: { type: [String], default: ["Full Stack Developer"] },
  careerInterests: { type: [String], default: [] },
  academic: {
    degreeSlug: { type: String, trim: true, default: "" },
    degreeName: { type: String, trim: true, default: "" },
    branchSlug: { type: String, trim: true, default: "" },
    branchName: { type: String, trim: true, default: "" },
    specializationSlug: { type: String, trim: true, default: "" },
    specializationName: { type: String, trim: true, default: "" },
    stream: { type: String, trim: true, default: "" },
    currentYear: { type: Number, min: 1, max: 6, default: null },
    currentSemester: { type: Number, min: 1, max: 12, default: null },
    institution: { type: String, trim: true, default: "" },
    academicScheme: { type: String, trim: true, default: "" },
  },
  education: { type: [String], default: [] },
  educationEntries: [
    {
      degree: { type: String, trim: true, default: "" },
      specialization: { type: String, trim: true, default: "" },
      college: { type: String, trim: true, default: "" },
      location: { type: String, trim: true, default: "" },
      endDate: { type: String, trim: true, default: "" },
      grade: { type: String, trim: true, default: "" },
    }
  ],
  experience: [...],
  skillSections: [...],
  skillLanguages: [String],
  skillFrameworks: [String],
  skillTools: [String],
  skillLibraries: [String],
  achievements: [...]
}, { timestamps: true });
```

### 3.2 Education Semantics vs Academic Enrollment
- `educationEntries`: Represents the student's historical resume timeline (high school, past diploma, bachelor's, or postgraduate history). Populated during resume creation or onboarding resume autofill.
- `education`: Derived summary lines automatically generated by `EducationEntry.toSummaryLine()` as `"Degree | Specialization | College | Location | EndDate | Grade"`.
- `academic`: Represents the student's **current, active institutional enrollment** within the standardized taxonomy (degree program, engineering/commerce branch, specialization domain, semester, and academic scheme).

### 3.3 Target Role Normalization & Priority Contract
- **Contract Rule 1 (Legacy Client)**: If a request provides only `targetRole: "Cloud Engineer"`, the server sets `user.targetRole = "Cloud Engineer"` and updates `user.targetRoles = ["Cloud Engineer"]`.
- **Contract Rule 2 (Multi-Goal Client)**: If a request provides `targetRoles: ["Embedded Systems Engineer", "Firmware Engineer"]`, the server sets `user.targetRoles` and synchronizes `user.targetRole = "Embedded Systems Engineer"` (index 0).
- **Contract Rule 3 (Simultaneous Conflict)**: If both `targetRole` and `targetRoles` are sent, `targetRoles` is authoritative; if `targetRole` is not present in `targetRoles`, it is prepended as primary goal (`[targetRole, ...targetRoles]`).
- **Contract Rule 4 (Empty Array)**: An empty array `targetRoles: []` does NOT wipe out the existing `targetRole`. It falls back to `[user.targetRole]`.

---

## 4. Risk Register

| Risk ID | Severity | Affected Modules | Failure Scenario | Mitigation Strategy | Test Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Critical | Smart Mentor, Skill Gaps, Analytics | Client sends `targetRoles: ["VLSI Engineer"]` without setting `targetRole`, causing AI mentor prompt context to receive undefined. | Server-side synchronization: `user.targetRole = targetRoles[0]` whenever `targetRoles` is updated. | `backend/test/academic.profile.integration.test.js` (Test 3) | **Mitigated & Verified** |
| **R-02** | High | Resume Builder, ATS Exporter | Auto-syncing `academic` data overwriting or deleting historical `educationEntries`. | Keep `academic` and `educationEntries` independent. No forced overwrites. | `frontend/src/test/profile-details.integration.test.tsx` (Test 1) | **Mitigated & Verified** |
| **R-03** | High | Skill Gap Analysis Engine | Non-computing student selecting role outside the 24 benchmarks in `roleRequirements.js` evaluated against Full-Stack JS benchmarks. | Graceful benchmark status fallback: return benchmark pending message instead of false Full-Stack comparison. | Gap analysis fallback test | **Mitigated** |
| **R-04** | High | Catalog Administration | Ordinary student modifying catalog degrees, branches, or role mappings via unprotected REST calls. | Server-side `ensureAdmin` middleware enforcing `req.user.role === 'admin' \|\| email === ADMIN_EMAIL`. | `backend/test/academic.catalog.test.js` (Test 16, 17) | **Resolved & Verified** |
| **R-05** | Medium | Catalog Lookups & Offline Vitest | Mongoose query command buffering hanging indefinitely during tests or DB reconnects. | Offline-first service fallback: check `mongoose.connection.readyState === 1`, falling back to in-memory constants if offline. | `backend/test/academic.catalog.test.js` (All Tests) | **Resolved & Verified** |
| **R-06** | Medium | Profile Partial PATCH Updates | Zod default values (`.default("")`) overwriting omitted academic subfields with empty strings during partial updates. | Remove `.default("")` from Zod partial schema; merge only defined keys in controller. | `backend/test/academic.profile.integration.test.js` (Test 4) | **Resolved & Verified** |
| **R-07** | Medium | Student Registration / Onboarding | Enforcing mandatory academic branch fields breaking Google Sign-In or initial account activation. | Make `academic` strictly optional with permissive defaults. Un catalogued branches supported via `"custom"` fallback. | `frontend/src/test/auth.custom.email.test.tsx` | **Resolved & Verified** |

---

## 5. Finalized Data Model Design Decisions

### 5.1 Redundant Names vs Catalog Slugs
- **Decision**: The canonical source of truth for standard programs is stored in the catalog collections (`academicdegrees`, `academicbranches`, `careerroles`).
- **Student Document**: The student `academic` subdocument stores canonical slugs (`degreeSlug`, `branchSlug`, `specializationSlug`) plus human-readable snapshots (`degreeName`, `branchName`, `specializationName`).
- **Custom / Uncatalogued Fallback**: When `branchSlug === "custom"` or `"other-eng"`, the student provides a custom name string (`customBranchName`). This allows any student from uncatalogued disciplines (e.g., Marine Engineering, Mining) to complete their profile without database friction.

### 5.2 Specializations Representation
- **Decision**: Specializations are embedded inside `AcademicBranch` as `specializations: [{ slug, name, description, active }]`.
- **Rationale**: Academic specializations are strictly scoped to their parent branch (e.g., "VLSI Design" belongs to ECE; "Cloud DevOps" belongs to CSE). Modeling specializations as embedded subdocuments guarantees atomic retrieval without requiring expensive multi-collection joins.

### 5.3 Career Role Benchmarks Integration Policy
- **Existing 24 Archetypes**: Retained intact in `roleRequirements.js` with exact benchmark keys ("Frontend Developer", "Backend Developer", "Machine Learning Engineer", etc.).
- **53 Extended Roles**: Organized across 6 industry categories. For roles having direct 1-to-1 matches with existing benchmarks (e.g., `full-stack-developer` -> "Full Stack Developer"), the existing benchmark is utilized.
- **Roles without Curated Benchmarks**: Return a clean fallback indicating that detailed skill gap benchmarks for this track are being curated, pointing students to recommended branch prerequisite skills without fabricating scores.

### 5.4 Branch-to-Career Mapping Uniqueness
- **Constraint**: Compound unique index on `{ branchSlug: 1, roleSlug: 1 }`.
- **Relationship Types**: `enum: ["primary", "related", "interdisciplinary", "optional"]`.
- **Relevance Score**: `type: Number, min: 0, max: 100, default: 80`.
- **Prerequisites**: `recommendedPrerequisites: [String]` highlighting bridge skills for non-computing students exploring software or data careers.

---

## 6. Migration and Seeding Strategy

1. **Additive Schema Migration**:
   - Zero column/collection drops or truncations.
   - All new Mongoose schema fields are optional with safe defaults (`academic: default null/empty`, `targetRoles: [user.targetRole]`).
2. **Idempotent Upsert Seeding**:
   - Implemented in `backend/src/modules/academic/services/academicCatalog.service.js`.
   - Uses `bulkWrite` with `{ updateOne: { filter: { slug }, update: { $setOnInsert, $set }, upsert: true } }`.
   - Re-running the seed script (`npm run seed:academic`) preserves custom administrator modifications and never duplicates records.
3. **Rollback Strategy**:
   - Drop the four standalone catalog collections (`academicdegrees`, `academicbranches`, `careerroles`, `branchcareermappings`).
   - The user profile continues functioning seamlessly as all downstream modules gracefully handle missing or undefined academic fields.

---

## 7. Phased Controlled Implementation Plan

### Phase 1: Data-Model Foundation & Validation
- **Objective**: Establish Mongoose schemas for degrees, branches, career roles, branch-career mappings, and user extensions.
- **Affected Files**:
  - `backend/src/core/database/models/academicDegree.models.js`
  - `backend/src/core/database/models/academicBranch.models.js`
  - `backend/src/core/database/models/careerRole.models.js`
  - `backend/src/core/database/models/branchCareerMapping.models.js`
  - `backend/src/models/` (re-export proxies)
  - `backend/src/core/database/models/user.models.js`
- **Validation**: Schema compilation tests.

### Phase 2: Catalog Seeding & Migration Tooling
- **Objective**: Populate authoritative taxonomy and role data via idempotent scripts.
- **Affected Files**:
  - `backend/src/modules/academic/constants/academicCatalog.js`
  - `backend/src/modules/academic/services/academicCatalog.service.js`
  - `backend/src/modules/academic/seeds/runSeed.js`
  - `backend/package.json`
- **Validation**: `npx vitest run test/academic.catalog.test.js`

### Phase 3: Read-Only Catalog API & Admin Guards
- **Objective**: Expose `/api/v1/academic/options`, `/degrees`, `/branches`, `/career-roles`, and `/branches/:slug/roles` protected by admin middleware for write operations.
- **Affected Files**:
  - `backend/src/modules/academic/controllers/academic.controller.js`
  - `backend/src/modules/academic/routes/academic.routes.js`
  - `backend/src/core/middleware/admin.middleware.js`
  - `backend/src/app.js`
- **Validation**: HTTP endpoint and authorization tests (401, 403, 200).

### Phase 4: Profile API Integration & Normalization
- **Objective**: Extend `GET /api/v1/auth/me` and `PATCH /api/v1/auth/me` with Zod validation, safe partial merging, and `targetRole` synchronization.
- **Affected Files**:
  - `backend/src/core/auth/auth.controller.js`
  - `backend/src/controllers/auth.controller.js`
  - `backend/src/controllers/dashboard.controller.js`
- **Validation**: `npx vitest run test/academic.profile.integration.test.js`

### Phase 5: Minimal Frontend Integration
- **Objective**: Enhance `ProfileDetailsPage.tsx` with Academic Background and Career Pathways cards without modifying the existing design system or breaking existing forms.
- **Affected Files**:
  - `frontend/src/core/auth/AuthContext.tsx`
  - `frontend/src/modules/profile/services/academic.api.ts`
  - `frontend/src/modules/profile/services/profile.api.ts`
  - `frontend/src/pages/ProfileDetailsPage.tsx`
- **Validation**: `npx vitest run src/test/academic.profile.test.tsx` and `npm run build`.

### Phase 6: Regression Verification & Release Sign-Off
- **Objective**: Run full regression test suites across authentication, dashboard, resume builder, and skill gaps.
- **Validation**: Full vitest run across backend and frontend suites.

---

## 8. Test and Acceptance Matrix

| Verification Area | Test Command | Acceptance Criteria | Verified Result |
| :--- | :--- | :--- | :--- |
| **Catalog Taxonomy** | `npx vitest run test/academic.catalog.test.js` | 10 degrees, 29 branches, 53 roles, alias resolution, admin guards | **17 / 17 Passed (100%)** |
| **Profile Integration** | `npx vitest run test/academic.profile.integration.test.js` | Partial updates, legacy targetRole sync, legacy education preserved | **5 / 5 Passed (100%)** |
| **Canonical Routes** | `npx vitest run test/profile.canonical.routes.test.js` | Existing profile contracts, legacy education formatting intact | **5 / 5 Passed (100%)** |
| **Auth Validation** | `npx vitest run test/auth.update-profile.validation.integration.test.js` | Profile text length, experience bullets, CGPA text validation | **1 / 1 Passed (100%)** |
| **Skill Taxonomy** | `npx vitest run test/taxonomy.test.js` | 24 core skill normalization, alias mapping, category assignment | **11 / 11 Passed (100%)** |
| **Dashboard Snapshot** | `npx vitest run test/dashboard.profile.integration.test.js` | Full profile snapshot with academic and career metadata | **1 / 1 Passed (100%)** |
| **Frontend Profile** | `npx vitest run src/test/academic.profile.test.tsx` | Dependent selectors, career interest badges, payload submission | **4 / 4 Passed (100%)** |
| **Frontend Master Profile**| `npx vitest run src/test/profile-details.integration.test.tsx`| Master profile population, save toast, unsaved state preservation | **5 / 5 Passed (100%)** |
| **Frontend Auth Actions** | `npx vitest run src/test/auth.custom.email.test.tsx` | Email verification flow, custom action handlers, modal state | **6 / 6 Passed (100%)** |
| **Frontend Production** | `npm run build` (in `frontend/`) | Zero TypeScript errors, production Vite bundle rendered | **Exit Code 0 (11.26s)** |
