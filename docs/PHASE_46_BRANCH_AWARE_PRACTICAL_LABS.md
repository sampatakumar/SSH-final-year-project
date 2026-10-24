# Phase 46: Branch-Aware Practical Learning Labs & Interactive Practice Framework

## 1. Executive Summary

Phase 46 introduces the **Branch-Aware Practical Learning Labs & Interactive Practice Framework** to Smart Skill Hub. This framework provides students across all ten canonical academic discipline families with discipline-tailored, interactive exercises that emphasize real-world engineering calculations, clinical reasoning, structured analysis, and decision trade-offs.

All evaluations are conducted **authoritatively on the server** with deterministic numerical tolerances ($\pm 1\%\text{--}2\%$), unit constraints, rounding standards, and transparent rubrics. Verified lab attempts automatically feed into the **Phase 45 Evidence Normalization Engine** and **Adaptive Learning Pathways**, providing actionable remediation or advancement recommendations while enriching the **Smart Mentor** context.

---

## 2. Architecture & System Design

```
+--------------------------------------------------------------------------------------------------+
|                                    STUDENT USER INTERFACE                                         |
|                                                                                                  |
|   +--------------------------+  +--------------------------+  +-------------------------------+   |
|   |    Practical Labs        |  |   Interactive            |  |    Attempt History &          |   |
|   |    Catalog & Filters     |  |   Workspace (Inputs)     |  |    Step-by-Step Solutions     |   |
|   |    (/dashboard/labs)     |  |   (Numbers, Radios)      |  |    & Actionable Next Steps    |   |
|   +-------------+------------+  +------------+-------------+  +---------------+---------------+   |
+-----------------|----------------------------|--------------------------------|------------------+
                  | (Fetch Catalog)            | (Submit Answers)               | (Inspect Attempt)
                  v                            v                                v
+--------------------------------------------------------------------------------------------------+
|                                     BACKEND API & SERVICES                                       |
|                                                                                                  |
|   +------------------------------------+      +----------------------------------------------+   |
|   |  PracticalLabService               |      |  Authoritative Catalog (20 Starter Labs)     |   |
|   |  - getLabCatalog (Sanitized)       |<---->|  - 10 Discipline Families                    |   |
|   |  - getLabById (Sanitized)          |      |  - Numerical Tolerances & Units              |   |
|   |  - submitLabAttempt (Scoring)      |      |  - Hidden Accepted Answers & Explanations    |   |
|   +-----------------+------------------+      +----------------------------------------------+   |
|                     |                                                                            |
|                     v                                                                            |
|   +------------------------------------+      +----------------------------------------------+   |
|   |  Deterministic Evaluator           |      |  Persistence Models                          |   |
|   |  - Tolerances (±1-2%)              |----->|  - PracticalLabAttempt                       |   |
|   |  - NaN / Non-Finite Rejection      |      |  - LearningActivityRecord (Roadmap)          |   |
|   |  - Scenario Decision Matching      |      +-----------------------+----------------------+   |
|   +------------------------------------+                              |                          |
|                                                                       v                          |
|   +------------------------------------+      +----------------------------------------------+   |
|   |  Phase 45 Evidence Normalization   |<-----|  Adaptive Learning Pathway                   |   |
|   |  - sourceType: "practical_lab"     |      |  - Diagnosed Gap -> Practical Lab Action     |   |
|   |  - confidence: 0.90                |      |  - Links directly to /dashboard/labs         |   |
|   +-----------------+------------------+      +----------------------------------------------+   |
|                     |                                                                            |
|                     v                                                                            |
|   +------------------------------------------------------------------------------------------+   |
|   |  Smart Mentor Unified Context & Local NLP Fallback Engine                                |   |
|   |  - Rule 15: Grounded practical lab guidance & attempt-aware explanations                 |   |
|   |  - Instant offline fallback (<10ms) without hallucination                                |   |
|   +------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Implemented Starter Activities by Academic Discipline (20 Activities)

Across 10 academic discipline families, 20 starter activities are implemented:

| Family | Lab ID | Lab Title | Type | Key Skills Evaluated |
| :--- | :--- | :--- | :--- | :--- |
| **1. CSE / IT** | `cse-lab-algo-complexity` | Algorithmic Complexity & Execution Tracing Lab | Numerical & Multiple-Choice | Algorithms, Data Structures, Time Complexity |
| **1. CSE / IT** | `cse-lab-api-rate-limiter` | Distributed Rate Limiter & Token Bucket Lab | Numerical & Trade-off | System Design, Distributed Systems, Redis |
| **2. Mechanical** | `mech-lab-stress-strain` | Tensile Stress, Strain & Factor of Safety Lab | Numerical Calculation | Engineering Mechanics, Statics, Materials Science |
| **2. Mechanical** | `mech-lab-gear-ratio` | Spur Gear Train Kinematics & Torque Multiplier Lab | Numerical Calculation | Machine Design, Kinematics, Mechanical Power |
| **3. ECE / EEE** | `ece-lab-circuit-thevenin` | Thévenin Equivalent Circuit & Maximum Power Transfer | Numerical Calculation | Circuit Analysis, Electric Circuits, Power Transfer |
| **3. ECE / EEE** | `ece-lab-opamp-filter` | Active Low-Pass Filter Design & Cutoff Frequency | Numerical & Reasoning | Analog Electronics, Filter Design, Op-Amps |
| **4. Civil** | `civil-lab-beam-bending` | Simply Supported Beam Bending & Maximum Moment | Numerical Calculation | Structural Analysis, Mechanics of Solids |
| **4. Civil** | `civil-lab-concrete-mix` | Concrete Mix Design & Water-Cement Ratio Lab | Numerical Calculation | Construction Materials, Concrete Technology |
| **5. Chemical** | `chem-lab-mass-balance` | Steady-State Evaporator Mass Balance Lab | Numerical Calculation | Mass Balance, Separation Processes |
| **5. Chemical** | `chem-lab-cstir-reactor` | Continuous Stirred Tank Reactor (CSTR) Kinetics | Numerical Calculation | Chemical Reaction Engineering, Kinetics |
| **6. Biotechnology** | `biotech-lab-pcr-primer` | PCR Primer Design & Melting Temperature ($T_m$) Lab | Numerical & Scenario | Molecular Biology, PCR, Genetics |
| **6. Biotechnology** | `biotech-lab-enzyme-kinetics` | Michaelis-Menten Enzyme Kinetics & $V_{\max}$ Lab | Numerical Calculation | Biochemistry, Enzyme Kinetics |
| **7. Business / MBA** | `mba-lab-breakeven` | Cost-Volume-Profit & Break-Even Optimization Lab | Numerical Calculation | Business Strategy, Managerial Accounting |
| **7. Business / MBA** | `mba-lab-marketing-roi` | Customer Lifetime Value (CLV) & CAC Ratio Lab | Numerical & Scenario | Marketing Analytics, Unit Economics |
| **8. Finance / B.Com** | `finance-lab-dcf-valuation` | Discounted Cash Flow (DCF) & Enterprise Value Lab | Numerical Calculation | Financial Modeling, Corporate Valuation |
| **8. Finance / B.Com** | `finance-lab-liquidity-ratios` | Corporate Liquidity & Working Capital Analysis Lab | Numerical & Scenario | Financial Statement Analysis, Liquidity |
| **9. Arts / Humanities** | `arts-lab-fallacy-identification` | Formal Argumentation & Fallacy Detection Lab | Scenario Decision | Critical Thinking, Logic, Argumentation |
| **9. Arts / Humanities** | `arts-lab-source-criticism` | Historical Primary Source Criticism & Bias Lab | Scenario Decision | Historiography, Primary Source Analysis |
| **10. Nursing / Health** | `nursing-lab-sbar-communication` | SBAR Clinical Handoff & Patient Safety Case Lab | Scenario Decision | Clinical Communication, Patient Safety |
| **10. Nursing / Health** | `nursing-lab-dosage-calculation` | Pediatric Weight-Based Medication Dosage Lab | Numerical Calculation | Clinical Math, Pediatric Nursing |

---

## 4. Input & Evaluation Models

### 4.1 Numerical Calculation Exercises
- **Validation**: Server-side parsing and finite validation; non-finite, `NaN`, `Infinity`, empty, or malformed strings are immediately rejected with zero points and informative feedback.
- **Tolerances**: Explicit tolerance ranges (typically $\pm 1\%$ to $\pm 2\%$) are applied using:
  $$\Delta_{\text{allowed}} = |A_{\text{accepted}} \times \text{tolerance}|$$
  $$|V_{\text{submitted}} - A_{\text{accepted}}| \le \Delta_{\text{allowed}} + \epsilon$$
- **Units & Rounding**: Units are specified (e.g. `MPa`, `kN`, `mL`, `Hz`), and expected decimal precision is explicitly documented in the task interface.

### 4.2 Scenario Decisions & Trade-Off Analyses
- Discrete options evaluate student reasoning under conflicting engineering or management constraints (e.g. cache latency vs consistency, material safety vs weight, pediatric dosing safety).
- Immediate access to solution explanations and remediation guidance upon submission.

### 4.3 Answer-Key Protection
- Client-facing endpoints (`GET /api/v1/academic/labs` and `GET /api/v1/academic/labs/:labId`) execute `sanitizeLabForClient(lab)`, which strictly strips `acceptedAnswer`, `correctOptionId`, and `tolerance` fields.
- Correct answers exist only in the server-side catalog and evaluation service.

---

## 5. Attempt Persistence & Deduplication

Attempts are stored in the MongoDB `PracticalLabAttempt` collection:
- `owner`: Student ID with verified ownership checks.
- `labId` and `labVersion`: Versioned records prevent silent score overwrites when catalog definitions evolve.
- `serverScore`, `maxScore`, `percentage`, `isPassing`, and `masteryLevel` (`Mastered` $\ge 85\%$, `Competent` $\ge 70\%$, `Needs Remediation` $< 70\%$).
- `taskResults`: Item-by-item breakdown of submitted values, points earned, unit, solution explanation, and remediation guidance.
- Synchronized upsert into `LearningActivityRecord` for deduplicated continuous roadmap tracking.

---

## 6. Phase 45 Evidence Normalization & Adaptive Pathway Integration

1. **Evidence Normalization**:
   - `PracticalLabAttempt` is queried as source #7 in `evidenceNormalizationService.getNormalizedStudentEvidence`.
   - Mapped with `sourceType: "practical_lab"`, `confidence: 0.90` (objective server-evaluated practical exercise), and linked canonical skills.
2. **Adaptive Pathway**:
   - When `adaptiveLearningPathwayService` diagnoses a skill gap that matches a published practical lab, it generates an actionable `practical_lab` item linking directly to `/dashboard/labs?labId=...`.
3. **Smart Mentor**:
   - `smartMentorContextService` gathers `practicalLabs` summary (attempts count, average score, latest lab result, skills evaluated).
   - Rule 15 in `smartMentor.service.js` enforces attempt-grounded guidance without inventing scores or simulating hardware.
   - `smartMentorLocalService` provides instantaneous local NLP fallback for `practical_lab_guidance`.

---

## 7. Security Controls & Safeguards

- **Ownership Enforcement**: `getAttemptById` enforces `req.user._id === attempt.owner`; cross-student access is rejected with `403 Forbidden`.
- **Zero Client Trust**: All scores, percentages, and mastery levels are computed server-side.
- **Sandbox Preservation**: `CODING_EXECUTION_ENABLED=false` is preserved. No untrusted code execution is permitted or enabled.
- **Answer Key Security**: Answers are sanitized from all catalog and lab detail responses.

---

## 8. Test Validation & Quality Assurance

### 8.1 Backend Tests (`phase46.practical-labs.test.js`)
- **Status**: PASSED
- **Test Count**: 20 passed (20 total)
- **Coverage**:
  1. 10-discipline coverage & 20 starter activities
  2. Answer key sanitization on catalog and detail
  3. Numerical scoring tolerances and non-finite input rejection
  4. Scenario decision evaluation
  5. Attempt lifecycle, persistence, and ownership enforcement
  6. Phase 45 evidence normalization integration
  7. Adaptive pathway recommendations
  8. Smart Mentor grounding and offline NLP fallback
  9. Security & `CODING_EXECUTION_ENABLED=false` preservation

### 8.2 Backend Regression Tests (Phases 40–45)
- **Status**: PASSED
- **Test Count**: 117 passed (117 total) across:
  - `phase45.adaptive-pathway.test.js` (24/24 passed)
  - `phase44.assessment-center.test.js` (15/15 passed)
  - `phase43.project-studio.test.js` (21/21 passed)
  - `phase42.multi-branch.test.js` (21/21 passed)
  - `phase41.cross-module-mentor.test.js` (15/15 passed)
  - `phase40.competency-badges.test.js` (21/21 passed)

### 8.3 Frontend Tests (`phase46.practical-labs-frontend.test.tsx` & `navigation.links.test.tsx`)
- **Status**: PASSED
- **Phase 46 Tests**: 9 passed (9 total)
- **Navigation Links Tests**: 6 passed (6 total)

### 8.4 Full Frontend Test Suite
- **Status**: PASSED
- **Test Count**: 52 passed test files (376 passed tests, 0 failed)

### 8.5 Production Build
- **Command**: `npm run build` in `frontend/`
- **Result**: Successfully built in 7.46s with zero errors (`dist/assets/PracticalLabsPage-C7x0i4uZ.js` generated).

---

## 9. Domain-Specific Limitations & Educational Disclaimers

1. **Educational Simulation**: Practical labs model engineering, physical, and medical systems under explicit idealized assumptions (e.g. pure uniaxial tension, linear elastic behavior, lumped parameter circuits, steady-state mass balances).
2. **Professional Certification**: Platform exercises and scores reflect internal Smart Skill Hub learning objectives and do not replace certified licensure, accredited clinical supervision, or professional structural sign-offs.
3. **No Dynamic Emulation**: The system does not claim to run full SPICE circuit solvers, dynamic FEA meshing, CFD fluid solvers, or laboratory pipetting robots. Calculations are evaluated deterministically against established engineering equations.

---

## 10. Future Opportunities (Post-Phase 46)

1. Interactive graphical parameter sliders for real-time formula sensitivity visualization.
2. Multi-step branching clinical decision trees for Allied Health scenarios.
3. Exportable lab calculation sheets with formatted LaTeX steps for student portfolios.
