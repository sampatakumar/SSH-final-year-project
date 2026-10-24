# Phase 49: Multi-Branch Career Pathway Studio

## Executive Overview
Phase 49 connects Smart Skill Hub's existing multi-branch learning capabilities (Assessment Center, Practical Learning Labs, Project Studio Blueprints, Coding Sandboxes, and Spaced Revision) to transparent, explainable, evidence-based career planning across all 10 supported academic discipline families.

Rather than defaulting to software engineering or treating computer science as the sole career pathway, Phase 49 provides tailored career tracks across engineering, science, business, commerce, humanities, and healthcare, with explicit distinctions between educational preparation and statutory/clinical licensure requirements.

---

## 1. Existing Architecture Reused

Smart Skill Hub Phase 49 strictly reuses existing infrastructure without duplicate parallel systems:

1. **Academic Taxonomy & Branch Normalization**:
   - Reused `academicCatalog.js` (`INITIAL_ACADEMIC_BRANCHES`, `INITIAL_CAREER_ROLES`, and `INITIAL_BRANCH_ROLE_MAPPINGS`) and `academicNormalization.service.js` for student branch detection.
2. **Deterministic Evidence Normalization**:
   - Reused `evidenceNormalizationService.getNormalizedStudentEvidence(ownerId)` aggregating Assessment Attempts (0.95 veracity tier), Coding Submissions (0.95), Practical Labs (0.90), Historical Assessments (0.90), Project Deliverables (0.85), Quiz Checkpoints (0.80), and Spaced Revision (0.75).
3. **Prerequisite Dependency Graph**:
   - Reused `DISCIPLINE_PREREQUISITE_GRAPH` from `skillGapDiagnosis.service.js` to ensure preparation plans prioritize prerequisite competencies before higher-level coursework.
4. **Platform Activity Catalogs**:
   - Reused `PRACTICAL_LAB_CATALOG` (20 branch-specific interactive calculation labs).
   - Reused `ASSESSMENTS_CATALOG` (12 standardized domain assessments).
   - Reused `INITIAL_PROJECT_TEMPLATES` (12 structured milestone project blueprints).
5. **Unified Smart Mentor Context**:
   - Reused `smartMentorContextService.getUnifiedUserContext(ownerId)` to ingest career pathway diagnosis, readiness metrics, and platform limitations directly into mentor guidance prompts.
6. **JWT Authentication & Authorization**:
   - Reused `verifyFirebaseToken` and `optionalFirebaseToken` from `auth.middleware.js` to enforce strict student ownership and private evidence isolation.

---

## 2. New & Changed Components

### Backend Modules
- **`backend/src/modules/career/constants/careerPathwayCatalog.js`**: Canonical multi-branch catalog defining 18+ comprehensive roles spanning all 10 discipline families with core skills, proficiency thresholds, prerequisite requirements, linked platform activities, and statutory notes.
- **`backend/src/modules/career/services/careerPathway.service.js`**:
  - `getCareerRoles({ branch, roleFamily, search, includeCrossDisciplinary })`: Branch-relevance ranking and cross-disciplinary mobility analysis.
  - `getRoleById(roleId)`: Enriched role specification with resolved platform activities.
  - `evaluateRoleReadiness(ownerId, roleId)`: Deterministic explainable readiness calculation distinguishing demonstrated, partial, unassessed, gap, stale, and conflicting evidence.
  - `compareRoles(ownerId, roleId1, roleId2)`: Side-by-side gap and readiness comparison identifying shared vs unique competencies.
  - `generateRolePreparationPlan(ownerId, roleId)`: Prioritized, deduplicated learning plan linking directly to existing SSH activities.
- **`backend/src/modules/career/controllers/careerPathway.controller.js`**: REST controller endpoints for role discovery, readiness evaluation, comparison, and preparation plans.
- **`backend/src/modules/career/routes/careerPathway.routes.js`**: Public discovery and verified learner routes mounted at `/api/v1/career/pathways` and `/api/v1/career`.
- **`backend/src/modules/gaps/benchmarks/roleRequirements.js`**: Added backward-compatible entries and canonical aliases for non-CSE engineering, science, business, arts, and healthcare roles.
- **`backend/src/modules/mentor/services/smart-mentor-context.service.js`**: Integrated `careerPathwayContext` into unified mentor context.
- **`backend/src/app.js`**: Registered `/api/v1/career/pathways` route.

### Frontend Components
- **`frontend/src/modules/career/types/careerPathway.types.ts`**: TypeScript definitions for roles, readiness diagnosis, comparisons, and preparation plans.
- **`frontend/src/modules/career/services/careerPathway.api.ts`**: Frontend API client connecting to backend career endpoints.
- **`frontend/src/modules/career/components/RoleCard.tsx`**: Responsive card with degree match badges, core skills preview, activity counts, and compare toggle.
- **`frontend/src/modules/career/components/RoleDetailModal.tsx`**: Accessible modal with tabs for requirements, live verified evidence diagnosis, linked SSH activities, and statutory limitations.
- **`frontend/src/modules/career/components/RoleComparisonModal.tsx`**: Side-by-side track comparator with shared skill detection, readiness meters, and alignment summaries.
- **`frontend/src/modules/career/components/PreparationPlanModal.tsx`**: Prioritized roadmap with direct launch links to Practical Labs, Assessment Center, and Project Studio.
- **`frontend/src/pages/CareerPathwayStudioPage.tsx`**: Main student portal with search, discipline tabs, floating comparison drawer, and loading/error states.
- **`frontend/src/App.tsx` & `frontend/src/lib/dashboard-links.ts`**: Registered route `/dashboard/career-pathways` and added sidebar navigation link with `Compass` icon.

---

## 3. Supported Role Families & Actual Coverage

All 10 academic discipline families have first-class representation:

| # | Discipline Family | Canonical Roles | Branch Alignment | Primary Linked Labs & Assessments |
|---|---|---|---|---|
| 1 | **Computer Science & IT** | Frontend Developer, Backend Developer, QA Automation Engineer | `cse`, `it`, `csbs`, `bca`, `mca` | `cse-lab-algo-complexity`, `cse-software-architecture` |
| 2 | **Mechanical Engineering** | Mechanical Design Engineer, Manufacturing & Production Engineer | `mech`, `aero`, `auto`, `ipe`, `diploma-mech` | `mech-lab-stress-strain`, `mech-eng-mechanics`, `mech-cad-gearbox-design` |
| 3 | **ECE & EEE** | Embedded Systems Engineer, Electrical Power Systems Engineer | `ece`, `eee`, `eie`, `robotics` | `ece-lab-circuit-thevenin`, `ece-digital-electronics`, `eee-power-converter-analysis` |
| 4 | **Civil Engineering** | Structural Design Engineer, Construction Planning & Site Engineer | `civil`, `diploma-civil` | `civil-lab-beam-bending`, `civil-structural-fundamentals`, `civil-structural-framing-bim` |
| 5 | **Chemical Engineering** | Chemical Process Engineer | `chem` | `chem-lab-mass-balance`, `chem-mass-energy-balances`, `chem-distillation-column-mass-balance` |
| 6 | **Biotechnology** | Biotechnology Research Associate, Bioinformatics Analyst | `biotech`, `cse` | `biotech-lab-pcr-primer`, `bio-molecular-genetics`, `biotech-bioinformatics-pipeline` |
| 7 | **Business & MBA** | Business Systems Analyst, Operations & Supply Chain Analyst | `mba`, `bba`, `bcom` | `mba-lab-breakeven`, `mgmt-business-analysis`, `bba-market-expansion-strategy` |
| 8 | **Commerce & Finance** | Financial Analyst (Valuation), Financial Accountant & Statutory Auditor | `bcom`, `mcom`, `finance` | `finance-lab-dcf-valuation`, `fin-accounting-fundamentals`, `bcom-financial-statement-audit` |
| 9 | **Arts & Humanities** | Content Strategist & Technical Writer, Corporate Communications Specialist | `ba-gen`, `ma-gen` | `arts-lab-source-criticism`, `arts-critical-reasoning`, `arts-digital-media-campaign` |
| 10 | **Nursing & Allied Health** | Clinical Research Coordinator, Clinical Staff Nurse Track | `nursing-gen`, `allied-health-gen` | `nursing-lab-sbar-communication`, `health-clinical-pharmacology`, `nursing-clinical-case-reflection` |

---

## 4. Role Catalog Schema Contract

Every career role strictly adheres to the schema:
```typescript
interface CareerRole {
  roleId: string;
  title: string;
  roleFamily: string;
  disciplineCategory: string;
  branchSlugs: string[];
  crossDisciplinaryAccessible: boolean;
  transferableSkills: string[];
  mobilityRationale: string;
  description: string;
  experienceLevel: "Entry-Level";
  coreSkills: Array<{
    skill: string;
    importance: "critical" | "high" | "medium";
    minProficiency: string;
    targetScore: number;
  }>;
  recommendedSkills: Array<{
    skill: string;
    importance: "medium" | "low";
  }>;
  prerequisiteCompetencies: string[];
  relevantEvidenceTypes: string[];
  suggestedLabIds: string[];
  suggestedAssessmentIds: string[];
  suggestedProjectIds: string[];
  portfolioExpectations: string[];
  unassessableCompetencies: string[];
  regulatoryNotes: string | null;
  catalogSource: "SSH_CANONICAL_V1";
  validationStatus: "curated";
}
```

---

## 5. Evidence Sources & Evaluation Semantics

### Deterministic Veracity Tiers Reused
- **0.95**: Objective Automated Grading (Assessment Center, Coding Sandbox execution)
- **0.90**: Server-Evaluated Interactive Calculations (Practical Labs, Verified historical assessments)
- **0.85**: Structured Rubric-Based Milestone Evaluations (Project Studio Deliverables)
- **0.80**: Formative Checkpoint Quiz Evaluations (EduTube Checkpoints)
- **0.75**: Spaced Retrieval Practice Recall (Spaced Revision Sessions)

### Strict Evidence Categorization
- **Demonstrated Skills**: Verified evidence exists with latest score $\ge$ target score (typically $\ge 70\%$).
- **Partially Demonstrated Skills**: Verified evidence exists with score between $40\%$ and $69\%$.
- **Unassessed Skills**: NO verified evidence recorded yet. **NEVER scored as zero**. Tracked explicitly as unassessed to avoid penalizing learners who simply have not attempted an activity.
- **Active Skill Gaps**: Demonstrated score tested below $40\%$, requiring immediate remediation.
- **Stale Evidence**: Verified evidence with timestamp older than 60 days, flagged for spaced revision review.
- **Conflicting Evidence**: Divergence exceeding 25 points between historical high score and recent attempt, surfaced for educator review.
- **Missing Prerequisites**: Unmet prerequisite dependencies flagged before advanced coursework.
- **Unassessable Competencies**: Field competencies (e.g. sterile surgical fields, heavy CNC mill handling, warehouse forklift operation) explicitly identified as requiring accredited physical practice.

---

## 6. Readiness Calculation & Methodology

### Transparent Formula
For a target role with $N$ core skills, let:
- $D$ = count of demonstrated core skills ($\ge 70\%$)
- $P$ = count of partially demonstrated core skills ($40\% - 69\%$)
- $w_i$ = importance weight of skill $i$ (Critical: 1.0, High: 0.85, Medium: 0.70)
- $S_i$ = latest verified percentage score for skill $i$

$$\text{Coverage Ratio } C = \frac{D + 0.5 \times P}{N}$$
$$\text{Quality Ratio } Q = \frac{\sum_{i \in (D \cup P)} w_i \times (S_i / 100)}{\sum_{i \in \text{Core}} w_i}$$

$$\text{Heuristic Readiness Index} = \text{round}(C \times 40 + Q \times 60) \in [0, 100]$$

When no evidence exists ($D + P = 0$), the readiness index is $0$ and band is `"Unassessed"`.

### Readiness Bands
- **85% – 100%**: Strong Alignment
- **70% – 84%**: Substantially Evidenced
- **45% – 69%**: Developing Competency
- **1% – 44%**: Early Preparation
- **0%**: Unassessed

### Non-Negotiable Methodological Disclaimer
> *"Internal heuristic readiness index for formative learning guidance only; does NOT represent a statistically validated employment probability, placement guarantee, or hiring prediction."*

---

## 7. Recommendation & Preparation Plan Logic

Preparation plans are generated with strict prioritization:
1. **Immediate (Foundation)**: Missing prerequisite competencies before advanced tasks.
2. **High (Remediation)**: Re-attempting active gap skills (tested $<40\%$) via targeted Practical Labs.
3. **Recommended (Practice)**: Hands-on interactive calculation labs (`PRACTICAL_LAB_CATALOG`) for unassessed core skills.
4. **Recommended (Validation)**: Objective knowledge validation tests (`ASSESSMENTS_CATALOG`).
5. **Portfolio Synthesis**: Capstone milestone projects (`INITIAL_PROJECT_TEMPLATES`) producing rubric artifacts.
6. **Maintenance (Spaced Revision)**: Refreshing stale evidence older than 60 days.

### Deduplication & Idempotence
Plans use unique activity and skill keys (`activityType:activityId`). Repeated queries are strictly idempotent and do not create duplicate activity records.

---

## 8. Branch-Specific Validation

| Discipline Family | Verified Primary Role | Cross-Disciplinary Mobility Policy |
|---|---|---|
| **Mechanical** | Mechanical Design Engineer | Transferable to QA Automation or Data Analysis; blocked from Regulated Nursing. |
| **ECE / EEE** | Embedded Systems Engineer | High synergy with Software & IoT; primary in hardware and firmware. |
| **Civil** | Structural Design Engineer | Direct structural tracks; cross-disciplinary BIM modeling. |
| **Chemical** | Chemical Process Engineer | Primary distillation and kinetics; transferable math modeling. |
| **Biotechnology** | Biotechnology Research Associate | Direct lab tracks; cross-disciplinary bioinformatics for CS learners. |
| **Business / MBA** | Business Systems Analyst | High cross-disciplinary mobility across operations, product, and analysis. |
| **Commerce / Finance** | Financial Analyst | Primary accounting and DCF valuation; transferable from quantitative engineering. |
| **Arts / Humanities** | Content Strategist | Primary technical writing, rhetoric, and critical reasoning; cross-disciplinary UX. |
| **Nursing & Allied Health** | Clinical Staff Nurse Track | **Strictly non-transferable** without accredited degree; statutory clinical licensing disclaimers enforced. |

---

## 9. Privacy, Authorization & Data Integrity

1. **Strict Student Isolation**: Readiness evaluations, preparation plans, and role comparisons authenticate `req.user._id` via verified Firebase JWT. Learners cannot inspect or alter another user's readiness data.
2. **Authoritative Server Grading**: Client requests cannot supply self-asserted readiness scores. Readiness is computed dynamically from server-verified database evidence.
3. **Read-Only Catalog Access**: Catalog inspection endpoints are public or optional-token to personalize branch relevance without leaking private student records.
4. **No Sensitive PII Duplication**: Resume and portfolio documents remain in their canonical stores and are not copied or persisted in career pathway schemas.

---

## 10. Test Results

### Backend Test Execution
Command:
```bash
npm test -- test/phase49.career-pathway.test.js
```
Result: **17 passed (17 tests), 100% pass rate in 28ms**.

Regression Suite:
```bash
npm test -- test/phase40.competency-badges.test.js test/phase41.cross-module-mentor.test.js test/phase42.multi-branch.test.js test/phase43.project-studio.test.js test/phase44.assessment-center.test.js test/phase45.adaptive-pathway.test.js test/phase46.practical-labs.test.js test/phase47.quality-assurance.test.js test/phase48.educational-correctness.test.js test/phase49.career-pathway.test.js
```
Result: **222 passed (222 tests), 10 test files passed, 0 failures**.

### Frontend Test Execution
Command:
```bash
npm test -- src/test/phase49.career-pathway-frontend.test.tsx src/test/navigation.links.test.tsx src/test/phase42.multi-branch-frontend.test.tsx src/test/phase41.cross-module-frontend.test.tsx src/test/phase38.adaptive-frontend.test.tsx
```
Result: **28 passed (28 tests), 5 test files passed, 0 failures**.

### Production Frontend Build
Command:
```bash
npm run build
```
Result: **Zero errors, production bundle generated successfully in 7.49s**. Output includes `CareerPathwayStudioPage-DyBiajZR.js` (42.67 kB).

---

## 11. Known Limitations & Items for Subject-Matter Review

1. **Statutory Clinical Authorizations**:
   - Software-based simulation and dosage calculation tests evaluate theoretical and computational understanding only. They cannot grant statutory RN licensure, hospital credentialing, or clinical practicing rights. State Nursing Council registration remains mandatory.
2. **Professional Engineer (PE / SE) Licensure**:
   - Structural stamping and high-voltage grid dispatch require regional statutory certifications and supervised post-degree professional work experience.
3. **Wet-Lab Bench Techniques**:
   - Wet-lab chemistry, sterile cell culture pipetting, and chromatography physical column packing cannot be physically evaluated by browser software and require physical laboratory facilities.
