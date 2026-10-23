# Phase 42: Multi-Branch Foundation & Branch-Aware Student Profiles

**Repository**: `/home/sampatakumar/Projects/projects/ssh_expand/SSH_integrated_Project`  
**Active Branch**: `expand-test`  
**Starting Commit**: `58688d6` (Phase 41 Baseline)  
**Protected Main Baseline**: `e9d89a5898f5c3c28062e9346b339b9b84f7ae90` (strictly preserved, untouched)  
**Final Commit**: `feat(phase-42): establish multi-branch student foundation`  
**Date**: October 2026  

---

## 1. Executive Summary & Audit Baseline

Phase 42 establishes a unified, extensible multi-branch foundation for Smart Skill Hub (SSH), expanding its architecture beyond Computer Science & Engineering (CSE) to support students across:
1. **Engineering & Technology** (Computer Science Engineering, Information Technology, AI & Machine Learning, Data Science, Mechanical Engineering, Electrical & Electronics Engineering, Electronics & Communication Engineering, Civil Engineering, Chemical Engineering, Biotechnology, Industrial & Production Engineering, Aerospace Engineering, Automobile Engineering, Robotics & Automation).
2. **Business & Commerce** (BBA, MBA, B.Com, M.Com).
3. **Arts & Humanities** (BA, MA).
4. **Healthcare & Life Sciences** (B.Sc Nursing, Allied Health Sciences).

### Baseline Architecture & Component Audit
- **Database Schemas & Models**:
  - `User` (`backend/src/core/database/models/user.models.js`): Contains `academic` subdocument (`degreeSlug`, `degreeName`, `branchSlug`, `branchName`, `specializationSlug`, `specializationName`, `stream`, `currentYear`, `currentSemester`, `institution`, `academicScheme`). Standardized by adding `graduationYear` and `isConfigured`.
  - `AcademicDegree` (`backend/src/core/database/models/academicDegree.models.js`): Stores degree metadata, duration, semesters, stream. Expanded `stream` enum to include `"Arts & Humanities"` and `"Healthcare & Life Sciences"`.
  - `AcademicBranch` (`backend/src/core/database/models/academicBranch.models.js`): Stores branch metadata, aliases, specializations, degree relationships, plus `relevantSkillCategories` and `relatedRoleSlugs`.
  - `CareerRole` (`backend/src/core/database/models/careerRole.models.js`): Stores career roles with `coreSkills` and `prerequisiteSkills`. Expanded `category` enum to include `"Healthcare & Clinical"` and `"Arts & Humanities"`.
  - `BranchCareerMapping` (`backend/src/core/database/models/branchCareerMapping.models.js`): Associates branches to career roles with relationship types (`primary`, `related`, `interdisciplinary`, `optional`) and relevance scores.
- **Services & Normalization**:
  - `academicCatalogService` (`backend/src/modules/academic/services/academicCatalog.service.js`): Centralized service for catalog seeding, degree/branch listing, options bundle, and branch capability inspection.
  - `academicNormalization.service.js` (`backend/src/modules/academic/services/academicNormalization.service.js`): Idempotent normalization engine resolving degrees, branches, aliases, streams, and data quality states without database lockouts or forced CSE defaults.
  - `branchCapabilityRegistry.service.js` (`backend/src/modules/academic/services/branchCapabilityRegistry.service.js`): Central registry tracking 10 core student platform capabilities with statuses (`AVAILABLE`, `UNAVAILABLE_CONFIG`, `PLANNED`, `UNSUPPORTED`).
  - `skillTaxonomy.service.js` & `skillTaxonomy.js`: Canonical skills taxonomy supporting software, electrical, electronics, mechanical, civil, finance/BI, biotechnology, clinical, and arts/media categories.
  - `career-competency-alignment.service.js`: Domain-specific skill requirement resolver, cross-disciplinary mapper, and evidence analyzer that evaluates non-software roles without artificial GitHub zero penalties.
  - `smart-mentor-context.service.js`: Assembles student context with normalized academic profile, discipline family, and branch capabilities.
  - `smart-mentor.service.js` & `smart-mentor-local.service.js`: AI Mentor prompt rules and local NLP engine handling academic discipline guidance and capability boundaries.
- **Frontend Components**:
  - `AcademicBackgroundStep.tsx` (`frontend/src/modules/onboarding/components/`): Onboarding step for degree, branch, specialization, year, semester, graduation year, and career goal multi-selection.
  - `academic.api.ts` (`frontend/src/modules/profile/services/`): API contract for fetching academic options and branch capabilities (`getBranchCapabilities`).

---

## 2. Canonical Academic Branch Catalog Design

The academic catalog is centralized in `backend/src/modules/academic/constants/academicCatalog.js` and served via `academicCatalogService`.

### Initial Discipline Coverage
- **Engineering & Technology**:
  - `cse` (Computer Science & Engineering)
  - `it` (Information Technology)
  - `aiml` (Artificial Intelligence & Machine Learning)
  - `ds` (Data Science)
  - `mech` (Mechanical Engineering)
  - `eee` (Electrical & Electronics Engineering)
  - `ece` (Electronics & Communication Engineering)
  - `civil` (Civil Engineering)
  - `chem` (Chemical Engineering)
  - `biotech` (Biotechnology)
  - `ipe` (Industrial & Production Engineering)
  - `aero` (Aerospace Engineering)
  - `auto` (Automobile Engineering)
  - `robotics` (Robotics & Automation)
- **Business & Commerce**:
  - `bba-gen` (Business Administration - BBA)
  - `mba-gen` (Business Administration - MBA)
  - `bcom-gen` (Commerce & Accounting - B.Com)
  - `mcom-gen` (Commerce & Finance - M.Com)
- **Arts & Humanities**:
  - `ba-gen` (Arts & Humanities - BA)
  - `ma-gen` (Arts & Humanities - MA)
- **Healthcare & Life Sciences**:
  - `nursing-gen` (Nursing - B.Sc Nursing)
  - `allied-health-gen` (Allied Health Sciences)
- **General / Fallback**:
  - `other-gen` (General & Interdisciplinary Studies)

### Alias Resolution Table
The catalog maps common aliases, abbreviations, and informal inputs to canonical slugs:
- `"comp sci"`, `"computer science"`, `"cs"`, `"cse"` → `cse`
- `"info tech"`, `"information technology"`, `"it"` → `it`
- `"ai & ml"`, `"ai/ml"`, `"aiml"` → `aiml`
- `"data science"`, `"ds"` → `ds`
- `"mechanical"`, `"mechanical engineering"`, `"mech"`, `"me"` → `mech`
- `"electronics and communication"`, `"electronics & communication"`, `"ece"` → `ece`
- `"electrical and electronics"`, `"electrical & electronics"`, `"eee"` → `eee`
- `"civil"`, `"civil engineering"`, `"ce"` → `civil`
- `"chemical"`, `"chemical engineering"`, `"chem"` → `chem`
- `"biotechnology"`, `"biotech"`, `"bt"` → `biotech`
- `"industrial"`, `"production"`, `"ipe"` → `ipe`
- `"aerospace"`, `"aeronautical"`, `"aero"` → `aero`
- `"automobile"`, `"automotive"`, `"auto"` → `auto`
- `"robotics"`, `"mechatronics"` → `robotics`
- `"business administration"`, `"bba"` → `bba-gen`
- `"mba"` → `mba-gen`
- `"commerce"`, `"accounting"`, `"b.com"`, `"bcom"` → `bcom-gen`
- `"m.com"`, `"mcom"` → `mcom-gen`
- `"arts"`, `"humanities"`, `"ba"` → `ba-gen`
- `"ma"` → `ma-gen`
- `"nursing"`, `"b.sc nursing"`, `"bsc nursing"` → `nursing-gen`
- `"allied health"`, `"physiotherapy"`, `"medical lab"` → `allied-health-gen`

---

## 3. Student Academic Profile Standardization & Data Quality

### Profile Schema Extensions
In `User.academic`:
- `degreeSlug`: Canonical degree identifier (e.g. `"btech"`, `"mba"`, `"bsc-nursing"`).
- `degreeName`: Canonical display name.
- `branchSlug`: Canonical branch identifier (e.g. `"mech"`, `"ece"`, `"nursing-gen"`).
- `branchName`: Canonical branch display name.
- `specializationSlug`: Optional specialization slug.
- `specializationName`: Optional specialization display name.
- `stream`: Academic discipline category (`"Engineering"`, `"Business & Commerce"`, `"Arts & Humanities"`, `"Healthcare & Life Sciences"`).
- `currentYear`: 1 to 6 (supports multi-year professional degrees).
- `currentSemester`: Optional 1 to 12. Non-semester programs leave this null.
- `institution`: College or university name.
- `graduationYear`: Year of graduation (2000–2040).
- `isConfigured`: Boolean flag indicating whether the profile has been deliberately saved by the student.

### Data Quality Tiers
- **Verified / Institution-Confirmed**: Reserved for cryptographically hashed badge criteria, server-graded sandbox challenges, and checkpoint quizzes.
- **Student-Provided**: Academic background (degree, branch, institution, semester, graduation year) and self-reported skills are explicitly tagged as student-provided data.
- **Inferred**: GitHub repository languages, estimated career readiness scores, and AI recommendations.
- **Missing / Unconfigured**: When branch information is absent, the system explicitly marks it as `isConfigured: false` rather than guessing or defaulting to CSE.

---

## 4. Backward Compatibility & Migration Behavior

### Safe Lazy Normalization
Rather than executing a risky, blocking database migration across thousands of legacy records, SSH employs **lazy, idempotent normalization**:
1. When a user profile is loaded or saved (`academicNormalization.service.js`), legacy fields (`stream`, `branch`, `degree`) are mapped through alias resolution.
2. If `branchSlug` is missing but legacy `branch` is present, it resolves to the canonical slug.
3. If `branchSlug` is unknown, it preserves the original value and assigns `disciplineFamily: "General"` without throwing or crashing.
4. If a user record has no branch information, it remains `isConfigured: false` without defaulting to CSE.
5. Migration/normalization operations are strictly idempotent: `normalizeAcademicProfile(normalizeAcademicProfile(p)) === normalizeAcademicProfile(p)`.

---

## 5. Branch-Aware Career, Skill & Evidence Mappings

### Domain-Specific Competencies
`career-competency-alignment.service.js` and `academicCatalog.js` associate domain-specific requirements for target roles:
- **Mechanical Design Engineer**: SolidWorks, AutoCAD, PTC Creo / CATIA, GD&T, Machine Element Design, FEA Basics.
- **Embedded Systems Engineer**: Embedded C, Microcontrollers, RTOS, PCB Design Basics, ARM Architecture.
- **Business Intelligence Analyst**: Power BI, SQL, Financial Modeling, Business Strategy, Tableau.
- **Registered Nurse**: Clinical Patient Assessment, Pharmacology & Drug Administration, Patient Monitoring & Triage, Medical Informatics & EHR.
- **Content Strategist**: Content Strategy & Copywriting, Technical Writing, Public Relations & Corporate Comm, Digital Media Production.

### Evidence-Aware Assessment & GitHub Contextualization
- Non-software roles (e.g., Mechanical Design Engineer, Civil Site Engineer, Registered Nurse) are **never penalized** for having zero GitHub repositories.
- GitHub analysis is only evaluated when the role's category is `"Software & Computing"` or when software coding is a core requirement.
- Cross-disciplinary goals (e.g. Mechanical student targeting Full Stack Developer or CSE student targeting Product Management) are supported without arbitrary score capping, while clearly identifying the bridge skills required.

---

## 6. Lightweight Branch Capability Registry

The Capability Registry (`backend/src/modules/academic/services/branchCapabilityRegistry.service.js`) manages 10 core capabilities with authoritative statuses:

| Capability Key | Label | Computing (CSE/IT) | Mechanical | ECE/EEE | Business | Healthcare |
|---|---|---|---|---|---|---|
| `CODING_PRACTICE` | Interactive Coding Sandbox | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **UNSUPPORTED** |
| `GITHUB_ANALYSIS` | GitHub Repository Analysis | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **UNSUPPORTED** |
| `CAD_PORTFOLIO` | CAD Engineering Portfolio | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** |
| `CIRCUIT_EXERCISES` | Circuit Simulation & SPICE | **UNSUPPORTED** | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** | **UNSUPPORTED** |
| `EMBEDDED_SYSTEMS_PRACTICE` | Embedded Systems & RTOS | **UNSUPPORTED** | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** | **UNSUPPORTED** |
| `ENGINEERING_SIMULATION` | FEA / CFD Engineering Sim | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** |
| `RESEARCH_PORTFOLIO` | Research & Paper Portfolio | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** | **AVAILABLE** |
| `BUSINESS_CASE_STUDIES` | Business Case Studies | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** |
| `FINANCIAL_ANALYSIS` | Financial Modeling Exercises | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** | **PLANNED** | **UNSUPPORTED** |
| `HEALTHCARE_LEARNING_ASSESSMENT` | Clinical Learning Assessment | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** | **UNSUPPORTED** | **PLANNED** |

**Status Definitions**:
- `AVAILABLE`: Implemented, tested, and actively usable in SSH.
- `UNAVAILABLE_CONFIG`: Implemented but disabled due to runtime environment configuration.
- `PLANNED`: Feature planned for future phases; students are guided to relevant study materials without broken UI links.
- `UNSUPPORTED`: Not relevant or applicable to this academic discipline.

Endpoint: `GET /api/v1/academic/branches/:branchSlug/capabilities`

---

## 7. AI Mentor Integration

### Context Enrichment
`smart-mentor-context.service.js` injects:
- Student's degree, branch, specialization, year, semester, and institution.
- Discipline family (e.g. `"Engineering & Technology"`, `"Business & Commerce"`, `"Healthcare & Life Sciences"`).
- Branch capability summary (`availableCount`, `plannedCount`).

### System Prompt Operational Rules (Rule 7)
The system prompt in `smart-mentor.service.js` enforces:
1. Ground domain advice within their verified branch and academic discipline when available.
2. If academic background is unconfigured, state that it is unconfigured when asked and NEVER invent or fabricate an academic discipline.
3. For Mechanical students: focus on mechanical design, CAD/SolidWorks, thermodynamics, and manufacturing. Do not push React/coding or penalize for 0 GitHub repos unless pursuing a software role.
4. For ECE/EEE students: focus on embedded systems, microcontrollers, VLSI, and circuit fundamentals.
5. For Business/Commerce students: focus on financial modeling, business analytics, operations, and Power BI.
6. For Healthcare/Nursing students: focus on clinical patient assessment, pharmacology, triage, and healthcare informatics.
7. Support cross-disciplinary mobility with bridge skills.
8. Only cite capabilities marked `AVAILABLE`. For `PLANNED` tools, explicitly inform the student that simulation engines are planned for future phases.

### Local NLP Intent Classification
`smart-mentor-local.service.js` adds:
- `academic_branch_guidance`: Inquiries regarding branch-specific recommendations, engineering focus, and discipline roadmaps.
- `branch_capabilities`: Inquiries regarding supported tools, CAD simulators, circuits, or coding environments for the student's branch.

---

## 8. Academic Branch Coverage Matrix

| Branch / Academic Discipline | Catalog Support | Profile Support | Career Mapping Coverage | Available Specialized Tools | Remaining Feature Work |
|---|---|---|---|---|---|
| **Computer Science & Engineering (CSE)** | Full Canonical | Full Canonical | 100% (Full-Stack, DevOps, AI, Mobile, Security) | Coding Sandbox, GitHub Analysis, EduTube, Competency Matrix | Fully functional baseline |
| **Information Technology (IT)** | Full Canonical | Full Canonical | 100% (Cloud, Security, Full-Stack, QA) | Coding Sandbox, GitHub Analysis, EduTube, Competency Matrix | Fully functional baseline |
| **AI & Machine Learning (AIML)** | Full Canonical | Full Canonical | 100% (AI Engineer, Data Scientist, ML Engineer) | Coding Sandbox, GitHub Analysis, EduTube, Competency Matrix | Model evaluation sandbox (future) |
| **Data Science (DS)** | Full Canonical | Full Canonical | 100% (Data Scientist, BI Analyst, Data Engineer) | Coding Sandbox, GitHub Analysis, EduTube, Competency Matrix | Notebook execution engine (future) |
| **Mechanical Engineering (MECH)** | Full Canonical | Full Canonical | 100% (Mechanical Design, CAD, Manufacturing) | EduTube, Spaced Revision, Research Portfolio | CAD viewer / 3D model sandbox (Phase 43+) |
| **Electronics & Communication (ECE)** | Full Canonical | Full Canonical | 100% (Embedded Systems, VLSI, Hardware) | EduTube, Spaced Revision, Coding Sandbox | Web SPICE / circuit simulator (future) |
| **Electrical & Electronics (EEE)** | Full Canonical | Full Canonical | 100% (Power Electronics, EV Powertrain, Control) | EduTube, Spaced Revision, Coding Sandbox | Circuit & power system simulator (future) |
| **Civil Engineering (CIVIL)** | Full Canonical | Full Canonical | 100% (Structural Design, BIM, Site Engineering) | EduTube, Spaced Revision, Research Portfolio | BIM / structural viewer (future) |
| **Chemical Engineering (CHEM)** | Full Canonical | Full Canonical | 100% (Process Engineer, Plant Ops) | EduTube, Spaced Revision, Research Portfolio | Process flow simulator (future) |
| **Biotechnology (BIOTECH)** | Full Canonical | Full Canonical | 100% (Bioinformatics, Bioprocess, Clinical Trials) | EduTube, Spaced Revision, Research Portfolio | Molecular docking / BLAST viewer (future) |
| **Industrial & Production (IPE)** | Full Canonical | Full Canonical | 100% (Supply Chain, Quality, Operations) | EduTube, Spaced Revision, Research Portfolio | Lean / Operations workflow runner (future) |
| **Aerospace Engineering (AERO)** | Full Canonical | Full Canonical | 100% (Aerodynamics, Propulsion, Avionics) | EduTube, Spaced Revision, Research Portfolio | Aerodynamics simulation module (future) |
| **Automobile Engineering (AUTO)** | Full Canonical | Full Canonical | 100% (Automotive Chassis, EV Systems) | EduTube, Spaced Revision, Research Portfolio | Vehicle dynamics simulator (future) |
| **Robotics & Automation (ROBOTICS)**| Full Canonical | Full Canonical | 100% (Robotics Engineer, Mechatronics, ROS) | Coding Sandbox, EduTube, Spaced Revision | ROS / robotics visualizer (future) |
| **Business Administration (BBA/MBA)**| Full Canonical | Full Canonical | 100% (Business Analyst, Marketing, HR, Ops) | EduTube, Spaced Revision, Research Portfolio | Case study interactive solver (future) |
| **Commerce & Finance (B.Com/M.Com)** | Full Canonical | Full Canonical | 100% (Financial Analyst, Tax Consultant, Audit) | EduTube, Spaced Revision, Research Portfolio | Financial statement analyzer (future) |
| **Arts & Humanities (BA/MA)** | Full Canonical | Full Canonical | 100% (Content Strategist, Corporate Comm, PR) | EduTube, Spaced Revision, Research Portfolio | Writing / editorial review sandbox (future) |
| **Healthcare & Nursing (NURSING)** | Full Canonical | Full Canonical | 100% (Registered Nurse, Clinical Coordinator) | EduTube, Spaced Revision, Research Portfolio | Clinical scenario simulation engine (future) |
| **Allied Health Sciences** | Full Canonical | Full Canonical | 100% (Medical Lab Tech, Physical Therapist) | EduTube, Spaced Revision, Research Portfolio | Clinical diagnosis case studies (future) |

---

## 9. Verification & Test Execution Results

### 1. Phase 42 Backend Test Suite
Command: `npm test -- phase42` (in `backend/`)
- **Status**: PASSED (100%)
- **Test Files**: 1 passed (1)
- **Tests**: 21 passed (21)
- **Coverage Areas**:
  - Minimum required disciplines across Engineering, Business, Arts, Healthcare.
  - Undergraduate and postgraduate degree entries.
  - Safe alias resolution.
  - Unknown/invalid branch handling.
  - Profile normalization backward compatibility (no forced CSE).
  - Normalization idempotency.
  - Domain-specific requirements for Mechanical Design, ECE Embedded, and BI Analyst.
  - Cross-disciplinary career mobility without arbitrary penalties.
  - Branch capability registry availability checks.
  - AI Mentor local NLP intent classification (`academic_branch_guidance`, `branch_capabilities`).
  - System prompt multi-branch rule grounding.

### 2. Phase 42 Frontend Test Suite
Command: `npm test -- phase42` (in `frontend/`)
- **Status**: PASSED (100%)
- **Test Files**: 1 passed (1)
- **Tests**: 5 passed (5)
- **Coverage Areas**:
  - Multi-branch catalog rendering across Engineering, Business, Arts, and Healthcare streams.
  - Degree-to-branch cascading logic.
  - Branch capabilities API client.
  - Graduation year and academic progression inputs.
  - CSE regression protection: specializations, roles, and onboarding continue to work without regression.

### 3. Full Backend Test Suite
Command: `npm test` (in `backend/`)
- **Status**: PASSED (100%)
- **Test Files**: 67 passed (67)
- **Tests**: 882 passed (882)
- **Failures / Errors**: 0

### 4. Full Frontend Test Suite
Command: `npm test` (in `frontend/`)
- **Status**: PASSED (100%)
- **Test Files**: 48 passed (48)
- **Tests**: 324 passed (324)
- **Failures / Errors**: 0

### 5. Frontend Production Bundle Build
Command: `npm run build` (in `frontend/`)
- **Status**: PASSED (Exit code 0, completed in 7.86s)

---

## 10. Known Limitations & Configuration Requirements

1. **Specialized Branch Modules**: Phase 42 establishes the catalog, profile schema, normalization, capability registry, and AI Mentor context. Specialized simulation engines (e.g., 3D CAD parametric model viewer, SPICE circuit solver, interactive business case runner, clinical patient simulator) are marked as `PLANNED` and will be implemented in dedicated future phases.
2. **Coding Execution Restriction**: `CODING_EXECUTION_ENABLED=false` remains strictly enforced in staging.
3. **Database Seeding**: The canonical catalog is available in-memory through `INITIAL_ACADEMIC_DEGREES` and `INITIAL_ACADEMIC_BRANCHES`. Running `academicCatalogService.seedAcademicCatalog()` will populate the MongoDB collections when permanent persistence is desired.

---

## 11. Files Changed

### Backend Modifications
- `backend/src/core/database/models/academicDegree.models.js`: Expanded stream enum.
- `backend/src/core/database/models/careerRole.models.js`: Expanded category enum.
- `backend/src/core/database/models/academicBranch.models.js`: Added `relevantSkillCategories` and `relatedRoleSlugs`.
- `backend/src/core/database/models/user.models.js`: Added `graduationYear` and `isConfigured` fields.
- `backend/src/shared/taxonomy/skillTaxonomy.js`: Added BIOTECH, CLINICAL, and ARTS_MEDIA categories and skills.
- `backend/src/shared/taxonomy/skillAliases.js`: Added microcontrollers alias.
- `backend/src/modules/academic/constants/academicCatalog.js`: Added MBA, M.Com, BA, MA, B.Sc Nursing, Allied Health degrees, branches, roles, and branch-role mappings.
- `backend/src/modules/academic/services/academicNormalization.service.js` (NEW): Normalization and alias resolution service.
- `backend/src/modules/academic/services/branchCapabilityRegistry.service.js` (NEW): Central capability registry service.
- `backend/src/modules/academic/services/academicCatalog.service.js`: Added capability retrieval and exposed definitions in options bundle.
- `backend/src/modules/academic/controllers/academic.controller.js` & `routes/academic.routes.js`: Added `GET /api/v1/academic/branches/:branchSlug/capabilities`.
- `backend/src/core/auth/auth.controller.js`: Added graduationYear validation and applied profile normalization.
- `backend/src/modules/mentor/services/career-competency-alignment.service.js`: Branch-aware role resolution and evidence filtering.
- `backend/src/modules/mentor/services/smart-mentor-context.service.js`: Ingests normalized academic profile and branch capabilities.
- `backend/src/modules/mentor/services/smart-mentor.service.js`: Updated system prompt rule 7 with multi-branch guidance.
- `backend/src/modules/mentor/services/smart-mentor-local.service.js`: Intent classification for branch guidance and capabilities.
- `backend/src/services/dashboard-intelligence.service.js`: Exposes normalized academic subdocument.
- `backend/test/phase42.multi-branch.test.js` (NEW): 21 comprehensive backend unit and integration tests.

### Frontend Modifications
- `frontend/src/lib/api.ts`: Added academic subdocument to DashboardIntelligenceData.overview.
- `frontend/src/modules/profile/services/academic.api.ts`: Added `BranchCapabilitiesResponse` and `getBranchCapabilities` endpoint.
- `frontend/src/modules/onboarding/components/AcademicBackgroundStep.tsx`: Added Graduation Year input and stream tracking.
- `frontend/src/modules/skills/components/SpacedRevisionWidget.tsx`: Added teardown guard for async unmount.
- `frontend/src/test/phase42.multi-branch-frontend.test.tsx` (NEW): 5 frontend tests covering catalog loading, cascading, capabilities, and CSE regression protection.

---

## 12. Observations & Future Directions (Non-Decisional)

*The following points are architectural observations for consideration by the project owner and principal architect:*
1. **Phase 43 (Specialized Branch Modules - CAD & Mechanical)**: A dedicated 3D CAD previewer (using WebGL / Three.js or STL/STEP viewer) would allow Mechanical Engineering students to build an engineering design portfolio without requiring GitHub repos.
2. **Phase 44 (Hardware & Embedded Simulation)**: WebAssembly-based SPICE circuit simulators or micro-controller emulators (e.g. Wokwi integration) could provide ECE/EEE students with hands-on labs similar to the Docker coding sandbox.
3. **Phase 45 (Business Case & Analytics Platform)**: Interactive spreadsheet and business scenario simulators could serve BBA/MBA/B.Com students for financial modeling and business case competitions.
