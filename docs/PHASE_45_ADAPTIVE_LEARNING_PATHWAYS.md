# Phase 45: Adaptive Learning Pathways & Evidence-to-Mastery Engine

**Repository**: `/home/sampatakumar/Projects/projects/ssh_expand/SSH_integrated_Project`  
**Active Branch**: `expand-test`  
**Starting Commit**: `7f0aa0c` (Phase 44 Baseline: `7f0aa0cb216d533e7f99de8d7cc4dd84895b8200`)  
**Protected Main Baseline**: `e9d89a5898f5c3c28062e9346b339b9b84f7ae90` (strictly preserved, untouched)  
**Date**: October 2026  
**Commit Message**: `feat(phase-45): add adaptive learning pathways`  
**Coding Execution**: `CODING_EXECUTION_ENABLED=false` (strictly preserved)  

---

## 1. Executive Summary & Objective

Phase 45 introduces the **Adaptive Learning Pathways & Evidence-to-Mastery Engine** for Smart Skill Hub (SSH).

The primary objective is to complete the continuous, reliable learning-improvement cycle:
$$\text{ASSESS} \longrightarrow \text{DIAGNOSE} \longrightarrow \text{PLAN} \longrightarrow \text{LEARN} \longrightarrow \text{PRACTICE} \longrightarrow \text{REASSESS} \longrightarrow \text{MEASURE IMPROVEMENT}$$

Rather than creating an isolated feature or adding decorative task checklists, Phase 45 unifies existing capabilities across the platform:
1. **Multi-Source Evidence Normalization**: Ingests and normalizes student performance records from Phase 44 Assessment Center attempts, Phase 43 Project Studio deliverables, coding challenge submissions, spaced-revision schedules, and formal skill history.
2. **Deterministic Skill-Gap Diagnosis**: Evaluates real evidence against discipline benchmarks and target roles, calculating an explicit, transparent learning priority score without assuming missing evidence equals zero performance.
3. **Personalized Learning Action Planner**: Produces high-value, branch-aware recommendations spanning EduTube lessons, spaced retrieval practice, prerequisite remediation, project blueprints, reassessments, and mentor explanations.
4. **Evidence-Based Mastery Progression**: Empirically compares initial vs. reassessment attempts on comparable learning objectives, computing verified score deltas ($\Delta_{\text{score}}$) without making exaggerated claims of permanent mastery or unverified causation.
5. **Cross-Module Roadmap & Smart Mentor Integration**: Keeps roadmap milestones deduplicated and synced, while enriching Smart Mentor prompts with grounded learning pathway context and local offline guidance.

---

## 2. Integration Map & Baseline Architecture

### 2.1 Reused Subsystems
- **Assessment Center (`branchAssessment.models.js`, `assessmentAttempt.models.js`, `assessmentCenter.service.js`)**: Authoritative source of discipline assessment attempts and topic breakdowns across 10 academic families.
- **Project Studio (`projectTemplate.models.js`, `studentProject.models.js`, `projectStudio.service.js`)**: Source of applied project deliverables, milestones, and portfolio artifacts.
- **Skill History & Taxonomy (`learnerSkillAssessmentHistory.models.js`, `skillTaxonomy.service.js`, `skillAliases.js`)**: Canonical skill representations, alias dictionaries, and formal evidence logs.
- **Spaced Revision (`spacedRevisionSchedule.models.js`, `spacedRevision.service.js`)**: Performance-informed retrieval practice schedules.
- **EduTube & Verified Course Catalogs (`edutube-search.service.js`, verified courses)**: Real educational video playlists and lectures matched by canonical skills and discipline tags without URL fabrication.
- **Smart Mentor (`smart-mentor-context.service.js`, `smart-mentor.service.js`, `smart-mentor-local.service.js`)**: Proactive advice, rule-based system prompts, and offline regex NLP guidance.

### 2.2 Dedicated Phase 45 Additions
- **Evidence Normalization Service**: `backend/src/modules/skills/services/evidenceNormalization.service.js`
- **Skill-Gap Diagnosis Service**: `backend/src/modules/skills/services/skillGapDiagnosis.service.js`
- **Adaptive Learning Pathway Service**: `backend/src/modules/recommendations/services/adaptiveLearningPathway.service.js`
- **Controller & Routes**:
  - `backend/src/modules/recommendations/controllers/recommendations.controller.js`
  - `backend/src/modules/recommendations/routes/recommendations.routes.js`
- **Frontend Adaptive Pathway Module**:
  - `frontend/src/modules/roadmap/types/adaptivePathway.types.ts`
  - `frontend/src/modules/roadmap/components/AdaptivePathwayView.tsx`
  - Extended `frontend/src/modules/roadmap/LearningRoadmapPage.tsx` with dual tabs ("Adaptive Pathway & Mastery Engine" vs "Milestone Checklist")
  - `frontend/src/lib/api.ts` SmartSkillApi client methods

---

## 3. Evidence Normalization & Integrity Design

Student evidence from disparate systems is retrieved with safe database connection guards and normalized into a unified, typed schema:

```typescript
interface NormalizedEvidenceItem {
  evidenceId: string;
  canonicalSkill: string;
  sourceType: "assessment_attempt" | "coding_submission" | "project_deliverable" | "spaced_revision" | "quiz_checkpoint";
  status: "demonstrated_knowledge" | "inferred_proficiency" | "self_reported" | "insufficient_evidence";
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: string;
  confidence: number; // 0.0 - 1.0 based on objectivity of source
  version?: number;
  metadata?: Record<string, any>;
}
```

### Evidence Status Distinctions:
1. **Demonstrated Knowledge**: Server-graded objective assessments ($\ge 70\%$) or automated sandbox test passes (`confidence = 0.95`).
2. **Inferred Proficiency**: Project deliverable reviewed against structured rubrics or consistent spaced retrieval (`confidence = 0.75`).
3. **Self-Reported**: Stated in profile or resume without platform evaluation (`confidence = 0.30`).
4. **Insufficient Evidence**: No valid attempts on record. **Crucial Rule**: Absence of evidence is not penalized as failure; it is marked `unassessed` with neutral diagnostic priority ($S_{\text{gap}} = 50$).

---

## 4. Deterministic Diagnosis & Priority Scoring Formula

For each evaluated skill $s$, the learning priority score $P(s) \in [0, 100]$ is computed deterministically:

$$P(s) = 0.35 \cdot S_{\text{role}}(s) + 0.35 \cdot S_{\text{gap}}(s) + 0.15 \cdot S_{\text{recency}}(s) + 0.15 \cdot S_{\text{prereq}}(s)$$

Where:
- **$S_{\text{role}}(s)$ (Career & Discipline Importance)**:
  - Critical role skill: 100
  - Core role/academic skill: 80-85
  - Secondary/discovered skill: 60-65
- **$S_{\text{gap}}(s)$ (Demonstrated Deficiency Magnitude)**:
  - For demonstrated evidence: $\max(0, 100 - \text{score})$ (e.g., scoring 40% gives gap 60).
  - For unassessed skills: 50 (neutral diagnostic need, avoids penalizing absence of evidence as failure).
- **$S_{\text{recency}}(s)$ (Temporal Urgency & Retention Health)**:
  - For `needs_remediation`: Fresh failure ($\le 7$ days) has urgency 85; 8-30 days = 65; older = 45.
  - For `demonstrated_mastery` / `competent`: Fresh pass = 20; older than 30 days = 70 (spaced repetition review due).
  - For unassessed: Neutral 50.
- **$S_{\text{prereq}}(s)$ (Prerequisite Readiness Factor)**:
  - Unassessed dependent skill with missing prerequisites: 25 (deprioritizes jumping ahead without foundation).
  - Skill whose prerequisites are all verified: 75 (primed to learn).
  - Foundational skill with no prerequisites: 50.

---

## 5. Multi-Discipline Academic Coverage (10 Disciplines Validated)

The multi-discipline prerequisite dependency graph and catalog cover 10 major academic branches:

| # | Discipline Family | Canonical Branch | Sample Target Role | Canonical Prerequisite & Benchmark Skills |
|---|---|---|---|---|
| 1 | **CSE / IT** | `cse` / `it` | Full Stack Developer | Variables & Loops $\to$ Arrays $\to$ Data Structures $\to$ Algorithms; JavaScript, HTML/CSS $\to$ React |
| 2 | **Mechanical Engineering** | `mech` | CAD/CAM Engineer | Calculus, Physics $\to$ Engineering Mechanics $\to$ Statics $\to$ Machine Element Design $\to$ SolidWorks |
| 3 | **ECE / EEE** | `ece` / `eee` | Embedded Systems Engineer | Physics $\to$ Circuit Analysis $\to$ Digital Electronics $\to$ Embedded C; Boolean Algebra |
| 4 | **Civil Engineering** | `civil` | Structural Design Engineer | Engineering Mechanics $\to$ Structural Analysis $\to$ Reinforced Concrete, AutoCAD |
| 5 | **Chemical Engineering** | `chem` | Process Engineer | Chemistry, Calculus $\to$ Mass Balance $\to$ Thermodynamics $\to$ Process Engineering |
| 6 | **Biotechnology** | `biotech` | Bioinformatics Specialist | Cell Biology, Biochemistry $\to$ Molecular Biology $\to$ Bioinformatics, PCR |
| 7 | **Business / MBA** | `mba` | Business Intelligence Analyst | Microeconomics $\to$ Business Strategy; Data Concepts $\to$ Power BI, Tableau |
| 8 | **Finance / B.Com** | `finance` | Financial Analyst | Accounting Basics $\to$ Financial Modeling $\to$ Valuation, Corporate Finance |
| 9 | **Arts / Humanities** | `arts` | Technical Writer / Researcher | Formal Logic, Academic Writing $\to$ Critical Analysis $\to$ Historical Research |
| 10 | **Nursing / Allied Health** | `nursing` | Clinical Nurse Specialist | Anatomy & Physiology $\to$ Clinical Assessment $\to$ Patient Safety, Pharmacology |

---

## 6. Learning Action Generation & Resource Matching

The planner synthesizes concrete, branch-aware action items:
- **`review_objective`**: Focus on specific topics scored below 70% in Assessment Center.
- **`edutube_lesson`**: Real, verified university courses and lectures matched by canonical skill and discipline stream (zero hallucinated URLs).
- **`spaced_revision`**: Performance-informed retrieval practice session.
- **`practice_activity`**: Hands-on problem solving or coding challenge in Docker sandbox.
- **`reassessment`**: Retake/reassess on comparable learning objectives in Assessment Center.
- **`project_studio`**: Apply demonstrated knowledge on Phase 43 guided project blueprints.
- **`mentor_guidance`**: Ask Smart Mentor for structured concept breakdowns.

---

## 7. Evidence-Based Mastery Progression

When a student reassesses a skill after completing learning activities:
1. Locate previous valid assessment attempt for the same or comparable learning objectives.
2. Verify comparability: only attempts with identical source types (e.g. `assessment_attempt` vs `assessment_attempt`) and comparable objectives are evaluated.
3. Calculate verified score delta:
   $$\Delta_{\text{score}} = \text{reassessmentPercentage} - \text{initialPercentage}$$
4. Transparent reporting:
   - "Score increased by +25% on comparable assessment. Demonstrated measurable knowledge improvement."
   - Honest disclaimers: Score gains represent performance on specific test objectives; practical competency requires verified project deliverables. Incompatible attempts are rejected from score delta calculations.

---

## 8. Smart Mentor & Local Guidance Integration

1. **Context Injection**: `smart-mentor-context.service.js` injects the `learningPathway` summary block (`cycleStage`, `priorityGapsCount`, `masteredCount`, `primaryNextStep`).
2. **Rule 14 in System Prompt**: `smart-mentor.service.js` instructs the AI mentor to interpret diagnosed gaps, explain why specific actions were planned, and guide students through prerequisite sequences without hallucinating credentials.
3. **Deterministic Local NLP**: `smart-mentor-local.service.js` handles `learning_pathway_guidance` queries offline when LLM credentials are unavailable.

---

## 9. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/recommendations/pathway` | Returns normalized diagnosis, cycle stage, primary next step, prioritized actions, and progression history | Yes (Firebase token) |
| `GET` | `/api/v1/recommendations/pathway/progression` | Returns comparable assessment score deltas and progression metrics | Yes (Firebase token) |
| `POST` | `/api/v1/recommendations/pathway/action/:actionId/complete` | Idempotently marks a pathway action as completed in `LearningActivityRecord` | Yes (Firebase token) |

---

## 10. Security, Privacy & Integrity Controls

- **Authentication & Ownership**: All pathway endpoints enforce `verifyFirebaseToken` and verify `req.user._id` ownership. Students can never view or manipulate another student's learning evidence.
- **Server-Side Scoring Authority**: All diagnostic scores, cycle stages, and score deltas are computed exclusively on the server. Client-submitted scores are strictly ignored.
- **Answer Key Protection**: Authoritative answer keys are never transmitted to the frontend during review or reassessment.
- **Idempotency**: Repeated requests or duplicate milestone updates do not create redundant database entries.
- **Safeguard Invariant**: `CODING_EXECUTION_ENABLED=false` is strictly preserved.

---

## 11. Test Results & Validation Evidence

### 11.1 Backend Unit & Integration Tests
File: `backend/test/phase45.adaptive-pathway.test.js`
- Total tests: **24 passed (0 failed)**
- Duration: 669 ms
- Coverage:
  - 1. Evidence Normalization Engine (2 tests)
  - 2. Skill-Gap Diagnosis Engine (3 tests)
  - 3. Personalized Learning Action Planner (3 tests)
  - 4. Mastery Progression & Comparable Improvement Engine (2 tests)
  - 5. Smart Mentor Learning Pathway Integration (2 tests)
  - 6. Multi-Discipline Academic Coverage (10 major disciplines) (10 tests)
  - 7. Security, Privacy & Data Integrity (2 tests)

### 11.2 Backend Regression Tests
- `test/phase44.assessment-center.test.js`: **15 passed**
- `test/phase43.project-studio.test.js`: **21 passed**
- `test/phase42.multi-branch.test.js`: **21 passed**
- `test/phase41.cross-module-mentor.test.js`: **15 passed**
- `test/phase40.competency-badges.test.js`: **21 passed**
- Total regression tests verified: **93 passed (0 failed)**

### 11.3 Frontend Unit & Integration Tests
File: `frontend/src/test/phase45.adaptive-pathway-frontend.test.tsx`
- Total tests: **7 passed (0 failed)**
- Duration: 1.13 s
- Coverage:
  - 7-stage learning loop pipeline rendering and active stage highlighting
  - Primary Recommended Next Step hero card with time estimate and CTA
  - Personalized action plan cards with direct links to Assessment Center, EduTube, and Project Studio
  - Pathway action completion via `SmartSkillApi.completePathwayAction`
  - Diagnosed academic competencies table with transparent scores and prerequisites
  - Comparable mastery progression history with verified score deltas
  - `LearningRoadmapPage` tab switcher between Adaptive Pathway and Milestone Checklist

### 11.4 Full Frontend Suite
- **51 test files passed (51 passed, 0 failed)**
- **366 tests passed (366 passed, 0 failed)**
- Duration: 11.17 s

### 11.5 Frontend Production Build
- Command: `npm run build`
- Output: `✓ built in 7.14s` with zero TypeScript or asset bundling errors.

---

## 12. Known Limitations & Features Not Implemented

1. **Psychometric Item Response Theory (IRT)**: The current engine uses deterministic benchmark-weighted scoring. Full 2-parameter or 3-parameter IRT modeling is deferred to future psychometric enhancements.
2. **Dynamic Question Generator from Textbooks**: Reassessments draw from the curated Assessment Center question bank with topic-level variations rather than generating untested algorithmic questions on the fly.
3. **Automatic Project Studio Deliverable Grading**: Project deliverables require mentor/faculty review or rubric self-evaluation; they are not auto-graded by AI in this phase to prevent false positives.
4. **Cloud Execution**: `CODING_EXECUTION_ENABLED=false` remains enforced for staging safety; live Docker execution requires a dedicated mTLS runner VM.

---

## 13. Safeguard Invariant Confirmations

- **Git Branch**: Confirmed strictly `expand-test`.
- **Protected Main Baseline**: `e9d89a5898f5c3c28062e9346b339b9b84f7ae90` remains 100% untouched.
- **Git Push / Deployment**: Zero remote pushes, zero deployments, zero cloud provisioning.
- **Sandbox Security**: `CODING_EXECUTION_ENABLED=false` strictly preserved.
- **Phase Boundary**: Phase 46 has NOT started. Work stops after Phase 45 completion.
