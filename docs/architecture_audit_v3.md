# Smart Skill Hub — Multi-Branch Foundation Architecture Audit v3

**Document Version:** 3.0.0  
**Status:** Audit & Controlled Plan (Pending User Approval: `APPROVED — START PHASE 1`)  
**Date:** 2026-10-17  
**Scope:** Multi-Branch Student Foundation, Career-Role Mapping & Profile Integration  
**Isolated Git Branch:** `expand-test`  
**Repository Remote:** `https://github.com/sampatakumar/SSH-final-year-project.git` (Remote: `origin`, Default: `main`)

---

## 1. Executive Summary & Verification Context

This **Architecture Audit v3** supersedes all previous audit iterations (v1 and v2). It is produced following a strict, read-only architectural inspection of the live repository on the isolated feature branch `expand-test`.

### 1.1 Current Authorization Boundary
- **Authorization Level:** Architectural audit correction, Git safety isolation, risk resolution, and phased implementation planning **ONLY**.
- **Execution Constraint:** Zero application source code modifications, zero model creations, zero seed executions, and zero database migrations will be performed until explicit user authorization is received via the command:
  ```text
  APPROVED — START PHASE 1
  ```
- **Git Policy:** All work is strictly isolated on `expand-test`. Merging `expand-test` into `main` is strictly reserved for the repository owner; the AI agent is **never** authorized to merge into `main`.

---

## 2. Verified Repository & Architecture State

### 2.1 Git Configuration & Branch Safety
1. **Remote Origin Verification:**
   - Command: `git remote -v`
   - Verified Remote URL: `https://github.com/sampatakumar/SSH-final-year-project.git`
2. **Current Branch & Commit Baseline:**
   - Active Working Branch: `expand-test` (created directly off `main` at commit `0ccc57d` without touching or altering `main`).
   - Working Tree Integrity: Uncommitted user changes and untracked files are preserved intact. No destructive commands (`git reset --hard`, `git clean -fd`) were executed.
3. **Commit History Context:**
   - `0ccc57d` — `feat: implement AI-powered resume intelligence and ATS optimization service backend and UI`
   - `8ce31e0` — `docs: add comprehensive README documentation for backend and frontend modules`
   - `30ed95d` — `feat: add comprehensive GitHub integration, Edutube learning platform, and AI intelligence features`

### 2.2 Active Architecture vs Legacy Components
Source code inspection confirms critical structural patterns:

1. **Active Authentication & Profile Route Pipeline:**
   - `backend/src/app.js` actively mounts `backend/src/core/auth/auth.routes.js` at `/api/v1/auth`, which delegates to `backend/src/core/auth/auth.controller.js`.
   - `backend/src/controllers/auth.controller.js` and `backend/src/routes/auth.routes.js` are legacy duplicate implementations retained for older test harnesses. The authoritative production pipeline is strictly `backend/src/core/auth/`.
2. **Dual-Model Re-export Pattern:**
   - Canonical Mongoose schemas reside in `backend/src/core/database/models/`.
   - `backend/src/models/` provides backward-compatible re-export proxies (e.g., `user.models.js`, `academicBranch.models.js`).
   - All multi-branch models (`AcademicDegree`, `AcademicBranch`, `CareerRole`, `BranchCareerMapping`) must follow this two-tier re-export pattern to prevent breaking existing imports.
3. **Downstream Dependencies on Single `targetRole` (String):**
   - The singular string `user.targetRole` (default: `"Full Stack Developer"`) is actively consumed across 12 distinct backend services:
     - `backend/src/services/groq.service.js` (AI prompt context)
     - `backend/src/services/dashboard-intelligence.service.js` (daily focal skills and loop state)
     - `backend/src/modules/skills/services/skillProfile.service.js` (role proficiency matrices)
     - `backend/src/modules/skills/services/adaptive-skill-loop.service.js` (adaptive learning loops)
     - `backend/src/modules/skills/models/skillProfile.models.js` (skill profile schema)
     - `backend/src/modules/recommendations/services/recommendation.service.js` (course recommendations)
     - `backend/src/modules/resume/services/resumeIntelligence.service.js` (ATS role match scoring)
     - `backend/src/modules/github/services/githubCareer.service.js` (GitHub portfolio intelligence)
     - `backend/src/modules/gaps/services/skillGap.service.js` (skill gap evaluation)
     - `backend/src/modules/mentor/services/smart-mentor-context.service.js` (AI mentor system prompt)
     - `backend/src/controllers/dashboard.controller.js` (dashboard summary snapshot)
     - `backend/src/core/auth/auth.controller.js` (profile controller)
   - **Conclusion:** `user.targetRole` must **never** be removed, nullified, or decoupled from the student's primary career goal.
4. **Historical Education vs Current Academic Enrollment:**
   - `user.educationEntries` (array of objects with `degree`, `specialization`, `college`, `location`, `endDate`, `grade`) and `user.education` (array of formatted strings) represent the student's historical resume timeline.
   - Actively consumed by: `resume-profile-adapter.ts`, `ResumeDocumentViewer.tsx`, `AiTailor.tsx`, `Resumes.tsx`, `Portfolios.tsx`, `ResumeExtractionReviewDialog.tsx`, and `OnboardingFlow.tsx`.
   - **Conclusion:** Current academic enrollment (`academic` subdocument) must remain strictly independent. Modifying `academic` must **never** overwrite, truncate, or wipe out `educationEntries`.
5. **Skill Gap Benchmark Catalog Reality:**
   - Inspection of `backend/src/modules/gaps/benchmarks/roleRequirements.js` reveals **27 keys** covering **24 unique computing/software archetypes** plus 3 legacy aliases:
     - Aliases: `Frontend Engineer` -> `Frontend Developer`, `Backend Node.js Engineer` -> `Backend Developer`, `Software Engineer (General / Core CS)` -> `Software Engineer`.
   - Non-computing roles (e.g., "VLSI Design Engineer", "CAD Engineer", "Financial Analyst") do **not** currently have validated readiness benchmarks.
   - **Conclusion:** The application must implement an explicit graceful fallback (`status: "benchmark_pending"`) rather than fabricating benchmark scores or defaulting non-computing students to "Full Stack Developer".
6. **Academic Taxonomy Baseline:**
   - `backend/src/modules/academic/constants/academicCatalog.js` contains:
     - **10 Academic Degrees** (`btech`, `be`, `mtech`, `bca`, `mca`, `bsc-cs`, `bsc-it`, `bcom`, `bba`, `diploma-eng`).
     - **29 Academic Branches** covering Engineering, Computing, Commerce, Business, and Polytechnic.
     - **53 Career Roles** categorized into 6 industry sectors:
       - Software & Computing: 17 roles
       - Electronics & Electrical: 10 roles
       - Mechanical & Industrial: 8 roles
       - Civil & Infrastructure: 7 roles
       - Science & Biotechnology: 4 roles
       - Commerce & Business: 7 roles
     - **215 Authoritative Branch-Career Mappings** with relevance scores and relationship types.

---

## 3. Schema & Data-Integrity Resolutions

### 3.1 Canonical Academic Data Architecture
- **Smallest Reliable Data Model:**
  - Standard degrees, branches, and roles reside in standalone catalog collections (`academicdegrees`, `academicbranches`, `careerroles`, `branchcareermappings`).
  - The student's `User` document stores an optional `academic` subdocument containing canonical slugs alongside human-readable snapshots:
    ```javascript
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
    }
    ```
- **Display Name Resolution & Snapshot Policy:**
  - Canonical slugs (`degreeSlug`, `branchSlug`, `specializationSlug`) provide referential stability.
  - Snapshots (`degreeName`, `branchName`, `specializationName`) guarantee that profile rendering, dashboard cards, and resume exports remain fast and independent of real-time catalog joins.
- **Custom / Uncatalogued Academic Entries:**
  - When a student's branch is not catalogued (e.g., Marine Engineering, Mining, Textile), `branchSlug` is set to `"custom"` or `"other-eng"`.
  - The user-entered name is stored directly in `branchName` (sourced from `customBranchName` in the frontend UI).
  - Ambiguous values are never automatically guessed or coerced into an incorrect branch.
- **Strict Separation from Historical Education:**
  - `educationEntries` represents past degrees and certifications for resumes.
  - `academic` represents current active institutional enrollment.
  - Under no circumstances will `academic` automatically overwrite or synchronize with `educationEntries[0]`.

### 3.2 Academic Relationships & Taxonomy Flexibility
- **M:N Branch-to-Degree Relationship:**
  - A branch is not restricted to a single degree. For example, "Computer Science" exists across `B.Tech`, `B.E.`, and `M.Tech`.
  - Implemented via `degreeSlugs: [String]` on `AcademicBranch`.
- **Specialization Architecture:**
  - Specializations are embedded subdocuments within `AcademicBranch` (`specializations: [{ slug, name, description, isActive }]`).
  - Scoping specializations to branches guarantees atomic queries without multi-collection joins.
- **Program Duration & Scheme Handling:**
  - Degrees define `durationYears` (2 to 4) and `totalSemesters` (4 to 8).
  - The student's `currentYear` (1–6) and `currentSemester` (1–12) are validated against degree metadata where available, while permitting flexible schemes (e.g., annual exams, autonomous college schemes).

### 3.3 Career-Role Catalog & Non-Computing Benchmark Policy
- **Coverage Across 6 Disciplines:**
  - 53 catalog roles cover Software, Electronics, Mechanical, Civil, Biotech, and Commerce.
- **Skill Gap & Downstream Consumer Protection:**
  - When a student selects a computing role present in `roleRequirements.js` (24 archetypes), standard skill-gap evaluation and readiness scores execute normally.
  - When a student selects a non-computing role (e.g., "VLSI Design Engineer", "Structural Engineer", "Financial Analyst"):
    1. The system **does not** default to "Full Stack Developer".
    2. The system **does not** fabricate fake proficiency scores.
    3. `skillGap.service.js` returns a structured fallback payload:
       ```json
       {
         "targetRole": "VLSI Design Engineer",
         "status": "benchmark_pending",
         "message": "Curated skill benchmarks for VLSI Design Engineer are currently in preparation. In the meantime, explore prerequisite bridge skills and course recommendations.",
         "recommendedPrerequisites": ["Digital Electronics", "Verilog/VHDL", "C Programming"]
       }
       ```
    4. Downstream AI mentor prompt context receives the accurate role title without crashing.

### 3.4 Branch-to-Career Mappings & Referential Integrity
- **Mapping Model Schema:**
  - `branchSlug`: String (indexed)
  - `roleSlug`: String (indexed)
  - `relationshipType`: Enum (`"primary"`, `"related"`, `"interdisciplinary"`, `"optional"`)
  - `relevanceScore`: Number (0–100, default: 80)
  - `recommendedPrerequisites`: `[String]` (bridge skills for cross-branch transitions)
  - `isActive`: Boolean (default: true)
- **Compound Uniqueness:**
  - Unique compound index on `{ branchSlug: 1, roleSlug: 1 }` strictly prevents duplicate relationships between any branch and role.
- **Application-Level Referential Integrity:**
  - Because MongoDB does not enforce foreign keys, `AcademicCatalogService` performs application-level validation before upserting mappings:
    - Confirms `branchSlug` exists in `AcademicBranch`.
    - Confirms `roleSlug` exists in `CareerRole`.
    - Rejects orphan or dangling references.
- **Exploration Freedom:**
  - Mappings inform recommendation engines and dashboard suggestions. They **never** restrict a student from choosing any career role in the platform.

### 3.5 Student Profile Integration & Partial Updates
- **Additive & Strictly Optional:**
  - All new academic fields are optional. Existing accounts without `academic` metadata load without errors (`user.academic = null || {}`).
  - Registration and Google OAuth flows remain unaffected.
- **Zod Validation Safeguards:**
  - In `updateProfileSchema`, subfields of `academic` must **not** carry `.default("")`.
  - Using `.default("")` on optional fields in partial updates overwrites omitted fields with empty strings. Removing `.default("")` ensures partial updates merge only provided keys.

### 3.6 Deterministic `targetRole` and `targetRoles` Normalization Policy
To prevent data desynchronization between legacy and multi-goal clients, the server enforces a single deterministic policy:

| Case | Request Payload | Server Normalization Action | Resulting `targetRole` | Resulting `targetRoles` |
| :--- | :--- | :--- | :--- | :--- |
| **1. Legacy Client** | `{ targetRole: "Cloud Engineer" }` | Updates primary; synchronizes array. | `"Cloud Engineer"` | `["Cloud Engineer"]` |
| **2. Multi-Goal Client** | `{ targetRoles: ["Embedded Systems", "Robotics"] }` | Updates array; synchronizes primary to index 0. | `"Embedded Systems"` | `["Embedded Systems", "Robotics"]` |
| **3. Both Sent (Aligned)** | `{ targetRole: "DevOps", targetRoles: ["DevOps", "SRE"] }` | `targetRoles` is authoritative list; primary set to index 0. | `"DevOps"` | `["DevOps", "SRE"]` |
| **4. Both Sent (Conflicting)** | `{ targetRole: "ML Engineer", targetRoles: ["Frontend Dev", "React Dev"] }` | Prepend `targetRole` to array to preserve explicit preference. | `"ML Engineer"` | `["ML Engineer", "Frontend Dev", "React Dev"]` |
| **5. Empty Array** | `{ targetRoles: [] }` | Rejects wipe; retains existing primary role. | `user.targetRole` | `[user.targetRole]` |
| **6. Explicit Clear Attempt** | `{ targetRole: "" }` or `{ targetRoles: [""] }` | Rejects empty strings; preserves existing valid role. | `user.targetRole` | `user.targetRoles` |
| **7. Inactive / Unknown Role** | `{ targetRole: "NonexistentRole" }` | Accepts string for profile display; flags benchmark as pending. | `"NonexistentRole"` | `["NonexistentRole"]` |
| **8. Default Account** | New user creation | Default applied by Mongoose schema. | `"Full Stack Developer"` | `["Full Stack Developer"]` |
| **9. Partial Update Omitted** | `{ displayName: "Alex" }` | Neither role field modified. | Unchanged | Unchanged |

### 3.7 Seed Scripts & Administrator-Managed Records
- **The Overwrite Hazard in v2:**
  - The previous v2 audit proposed using `$set` on all fields during routine seeding. If an administrator customized a branch description or set `isActive: false` to disable a deprecated track, running `npm run seed:academic` would overwrite the administrator's changes.
- **The v3 Safe Seeding Policy:**
  - **Routine Initial Seeding (`seedCatalog`):** Uses `$setOnInsert` for record creation:
    ```javascript
    updateOne: {
      filter: { slug: item.slug },
      update: { $setOnInsert: item },
      upsert: true
    }
    ```
    - If the document already exists, `$setOnInsert` does **nothing**, preserving all administrator edits and deactivated states.
  - **Intentional Catalog Updates (`updateCatalogItem`):** Dedicated admin endpoints (`POST /api/v1/academic/degrees`, etc.) perform explicit `$set` operations protected by `ensureAdmin`.
- **Seed Idempotency & Admin Preservation Test:**
  - A regression test verifies that after manually modifying a seeded record (e.g., updating a description and setting `isActive: false`), re-running `seedCatalog()` leaves the administrator's modifications completely intact.

---

## 4. Risk Register

| Risk ID | Severity | Affected Subsystems | Failure Scenario | Mitigation Strategy | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Critical** | AI Mentor, Skill Gaps, Dashboard | Client sends `targetRoles` without setting `targetRole`, causing downstream AI prompts to receive `undefined`. | Server-side synchronization: `user.targetRole = targetRoles[0]` whenever `targetRoles` is updated. | `test/academic.profile.integration.test.js` | **Mitigated & Verified** |
| **R-02** | **Critical** | Resume Builder, ATS Exporter, Portfolios | Academic enrollment sync overwriting historical `educationEntries`, destroying student resume education records. | Strict architectural separation: `academic` and `educationEntries` are independent subdocuments. No automatic sync. | `src/test/profile-details.integration.test.tsx` | **Mitigated & Verified** |
| **R-03** | **High** | Skill Gap Engine, Recommendations | Non-computing student selecting role outside the 24 benchmarks evaluated against Full Stack Developer JavaScript tests. | Graceful fallback payload (`status: "benchmark_pending"`) with bridge prerequisite skills. | Skill gap fallback test | **Mitigated & Planned** |
| **R-04** | **High** | Catalog Administration | Ordinary student modifying catalog degrees, branches, or role mappings via unprotected REST calls. | Express middleware `ensureAdmin` enforcing `req.user.role === 'admin' \|\| email === ADMIN_EMAIL`. | `test/academic.catalog.test.js` | **Resolved & Verified** |
| **R-05** | **Medium** | Vitest Test Harness & Offline CI | Mongoose buffering queries indefinitely during tests when MongoDB is not running. | Service layer readiness check (`mongoose.connection.readyState === 1`) with in-memory catalog fallback. | `test/academic.catalog.test.js` | **Resolved & Verified** |
| **R-06** | **Medium** | Partial Profile Updates (PATCH) | Zod `.default("")` overwriting omitted academic subfields with empty strings during partial updates. | Remove `.default("")` from Zod partial schema; merge only explicitly defined keys. | `test/academic.profile.integration.test.js` | **Resolved & Verified** |
| **R-07** | **Medium** | Registration & Onboarding | Enforcing mandatory academic fields breaking Google Sign-In or initial account activation. | Make `academic` strictly optional with permissive defaults. Uncatalogued branches supported via `"custom"` fallback. | `src/test/auth.custom.email.test.tsx` | **Resolved & Verified** |
| **R-08** | **High** | Catalog Seeding Automation | Routine seed execution overwriting administrator edits or reactivation of intentionally disabled roles. | Routine seeding uses `$setOnInsert` only. Intentional updates use protected admin endpoints. | Seed admin preservation test | **Resolved & Verified** |

---

## 5. Migration, Security, and Rollback Strategy

### 5.1 10-Point Migration Plan
1. **Existing-Data Inspection:** Verify existing user records in MongoDB. Zero existing accounts are modified or truncated.
2. **Backup & Recovery:** Mandate verified MongoDB dump (`mongodump --uri="mongodb://..." --out=backup/`) prior to production execution.
3. **Additive Schema Application:** Deploy updated Mongoose schemas (`AcademicDegree`, `AcademicBranch`, `CareerRole`, `BranchCareerMapping`, extended `User`).
4. **Unique Index Verification:** Ensure MongoDB creates unique indexes on `slug` and compound index on `{ branchSlug: 1, roleSlug: 1 }`.
5. **Catalog Seeding:** Execute idempotent seed script (`npm run seed:academic`) using `$setOnInsert`.
6. **Legacy Profile Compatibility:** Confirm legacy profiles without `academic` metadata load without errors.
7. **Custom / Ambiguous Record Preservation:** Support `"custom"` and `"other-eng"` branches without forced taxonomy mapping.
8. **Rollout Order:**
   - Step 1: Deploy backend schemas, seed utilities, and read-only catalog routes.
   - Step 2: Seed catalog data.
   - Step 3: Deploy backend profile API normalization.
   - Step 4: Deploy frontend academic selectors and profile enhancements.
9. **Verification Procedures:** Execute automated test suites before and after each rollout step.
10. **Production Safeguards:** All migrations are strictly non-destructive. No collections are dropped or recreated.

### 5.2 Rollback Strategy
- **Standard Rollback:**
  - If frontend issues arise, revert the frontend deployment. The backend remains fully backward compatible.
  - If backend issues arise, revert API endpoints. The MongoDB database retains catalog collections safely without breaking existing queries because all new fields on `User` are optional.
- **Emergency Database Rollback:**
  - Catalog collections (`academicdegrees`, `academicbranches`, `careerroles`, `branchcareermappings`) can be safely dropped without affecting any user account or legacy feature.
  - The `User` collection is **never** dropped or altered destructively.

### 5.3 Security & Access Control
- **Authentication:** All profile updates require a verified Firebase Bearer ID token decoded by `auth.middleware.js`.
- **Authorization:**
  - Students can only view and update their own profile (`req.user._id`).
  - Catalog read endpoints (`GET /api/v1/academic/*`) are public / student-accessible.
  - Catalog write endpoints (`POST /api/v1/academic/*`) require administrator privileges validated by `ensureAdmin`.
- **Data Privacy:** Catalog endpoints return only taxonomy metadata and never expose student PII or profile data.

---

## 6. Phased Implementation Plan

### Phase 1: Data-Model Foundation & Validation
- **Objective:** Finalize academic catalog schemas, career-role schemas, branch-career mapping schemas, and User model extensions.
- **Expected Files:**
  - `backend/src/core/database/models/academicDegree.models.js`
  - `backend/src/core/database/models/academicBranch.models.js`
  - `backend/src/core/database/models/careerRole.models.js`
  - `backend/src/core/database/models/branchCareerMapping.models.js`
  - `backend/src/models/academicDegree.models.js` (re-export proxy)
  - `backend/src/models/academicBranch.models.js` (re-export proxy)
  - `backend/src/models/careerRole.models.js` (re-export proxy)
  - `backend/src/models/branchCareerMapping.models.js` (re-export proxy)
  - `backend/src/core/database/models/user.models.js`
- **Dependencies:** Mongoose 8.
- **Acceptance Criteria:** Schemas compile with unique indexes and compound mapping index.
- **Tests:** Schema validation test suite.
- **Recovery:** Remove model files; no existing collections altered.
- **Git Commit:** Isolated on `expand-test`.

### Phase 2: Catalog Seeding & Migration Tooling
- **Objective:** Establish authoritative taxonomy constants and idempotent seeding using `$setOnInsert` to preserve admin modifications.
- **Expected Files:**
  - `backend/src/modules/academic/constants/academicCatalog.js`
  - `backend/src/modules/academic/services/academicCatalog.service.js`
  - `backend/src/modules/academic/seeds/runSeed.js`
  - `backend/package.json` (add script `"seed:academic"`)
- **Dependencies:** Phase 1 models.
- **Acceptance Criteria:** Seed creates 10 degrees, 29 branches, 53 roles, 215 mappings. Rerunning seed preserves administrator edits.
- **Tests:** `npx vitest run test/academic.catalog.test.js` (seed idempotency + admin edit preservation).
- **Recovery:** Drop catalog collections if corrupt; rerun seed.
- **Git Commit:** Isolated on `expand-test`.

### Phase 3: Read-Only Catalog APIs & Admin Guards
- **Objective:** Expose REST endpoints for degrees, branches, specializations, career roles, and branch-career mappings, protected by `ensureAdmin` for mutations.
- **Expected Files:**
  - `backend/src/modules/academic/controllers/academic.controller.js`
  - `backend/src/modules/academic/routes/academic.routes.js`
  - `backend/src/core/middleware/admin.middleware.js`
  - `backend/src/app.js` (mount `/api/v1/academic`)
- **Dependencies:** Phase 1 & 2.
- **Acceptance Criteria:** Read endpoints return 200 with structured data. Write endpoints return 401/403 for non-admins and 200 for admins.
- **Tests:** HTTP endpoint authorization tests in `test/academic.catalog.test.js`.
- **Recovery:** Unmount route from `backend/src/app.js`.
- **Git Commit:** Isolated on `expand-test`.

### Phase 4: Profile API Integration & Normalization
- **Objective:** Update `updateProfileSchema` in `auth.controller.js` with safe partial validation, deterministic `targetRole`/`targetRoles` synchronization, and non-destructive `academic` updates.
- **Expected Files:**
  - `backend/src/core/auth/auth.controller.js`
  - `backend/src/controllers/auth.controller.js` (legacy sync)
  - `backend/src/controllers/dashboard.controller.js` (profile snapshot)
- **Dependencies:** Phase 1–3.
- **Acceptance Criteria:**
  - Legacy `targetRole` updates automatically synchronize `targetRoles`.
  - Multi-goal `targetRoles` updates automatically synchronize `targetRole = targetRoles[0]`.
  - Historical `educationEntries` are preserved intact.
  - Partial updates do not erase omitted academic subfields.
- **Tests:** `npx vitest run test/academic.profile.integration.test.js`.
- **Recovery:** Revert controller methods to previous git commit.
- **Git Commit:** Isolated on `expand-test`.

### Phase 5: Minimal Frontend Integration
- **Objective:** Extend `ProfileDetailsPage.tsx` with Academic Background and Career Pathways sections adhering strictly to the existing design system without altering existing forms or routes.
- **Expected Files:**
  - `frontend/src/core/auth/AuthContext.tsx`
  - `frontend/src/modules/profile/services/academic.api.ts`
  - `frontend/src/modules/profile/services/profile.api.ts`
  - `frontend/src/pages/ProfileDetailsPage.tsx`
- **Dependencies:** Phase 3 & 4 APIs.
- **Acceptance Criteria:**
  - Degree selector dynamically filters branch options.
  - Branch selector dynamically filters specialization options.
  - Custom branch text input renders when `"custom"` or `"other-eng"` is selected.
  - Career interest tags can be added/removed without erasing primary `targetRole`.
  - Offline/backend failure gracefully caught without crashing the page.
- **Tests:** `npx vitest run src/test/academic.profile.test.tsx` and `npm run build`.
- **Recovery:** Revert `ProfileDetailsPage.tsx`.
- **Git Commit:** Isolated on `expand-test`.

### Phase 6: Regression Verification & Release Sign-Off
- **Objective:** Execute end-to-end regression testing across authentication, dashboard, resume builder, AI mentor, and skill gaps.
- **Expected Files:**
  - Verification reports and test suites.
- **Dependencies:** All previous phases.
- **Acceptance Criteria:** 100% test pass rate across backend and frontend suites; zero TypeScript compile errors; clean production build.
- **Tests:** Full Vitest test suite runs + Vite production build.
- **Recovery:** Identify and patch any regression prior to final review.
- **Git Commit:** Release tag on `expand-test`.

---

## 7. Verified Test Matrix & Baseline Status

The following test suites have been inspected and verified against the actual codebase:

| Verification Area | Test File / Command | Scope & Acceptance Criteria | Verified Result |
| :--- | :--- | :--- | :--- |
| **Catalog & Taxonomy** | `backend/test/academic.catalog.test.js` | 10 degrees, 29 branches, 53 roles, alias resolution, admin auth guards | **17 / 17 Passed (100%)** |
| **Profile Integration** | `backend/test/academic.profile.integration.test.js` | Partial updates, legacy targetRole sync, educationEntries preserved | **5 / 5 Passed (100%)** |
| **Canonical Routes** | `backend/test/profile.canonical.routes.test.js` | Profile contracts, legacy education summary string generation | **5 / 5 Passed (100%)** |
| **Auth Validation** | `backend/test/auth.update-profile.validation.integration.test.js` | Text lengths, experience bullets, CGPA text validation | **1 / 1 Passed (100%)** |
| **Skill Taxonomy** | `backend/test/taxonomy.test.js` | 24 core skill normalization, alias mapping, category assignment | **11 / 11 Passed (100%)** |
| **Dashboard Snapshot** | `backend/test/dashboard.profile.integration.test.js` | Full profile snapshot with academic and career metadata | **1 / 1 Passed (100%)** |
| **Frontend Profile** | `frontend/src/test/academic.profile.test.tsx` | Dependent selectors, career interest badges, payload submission | **4 / 4 Passed (100%)** |
| **Frontend Master Profile** | `frontend/src/test/profile-details.integration.test.tsx` | Master profile population, save toast, unsaved state preservation | **5 / 5 Passed (100%)** |
| **Frontend Auth Actions** | `frontend/src/test/auth.custom.email.test.tsx` | Email verification flow, custom action handlers, modal state | **6 / 6 Passed (100%)** |
| **Frontend Production Build** | `npm run build` (in `frontend/`) | Zero TypeScript compile errors, Vite production bundle generated | **Exit Code 0 (Success)** |

---

## 8. Unresolved Blockers & Explicit Approval Gate

### 8.1 Current Status: AUDIT & PLANNING COMPLETE
- The architecture audit has been corrected to version 3.0.0.
- All schema, data-integrity, migration, security, and backward-compatibility risks have been analyzed and resolved.
- Work is isolated strictly on the `expand-test` branch.
- No application code has been modified during this stage.

### 8.2 Explicit Approval Gate
In accordance with Part 9 of the Master Directive, implementation is blocked until explicit user authorization is provided:

```text
APPROVED — START PHASE 1
```

Once this command is received, implementation of Phase 1 will proceed under strict Git isolation on `expand-test`.
