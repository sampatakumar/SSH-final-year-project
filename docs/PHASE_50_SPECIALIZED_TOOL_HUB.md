# Phase 50: Specialized Multi-Branch AI Tool Hub & First Functional Tool Set

## 1. Overview & Architecture

Phase 50 establishes a centralized, discipline-aware **Specialized Academic Tool Hub** within Smart Skill Hub. The system provides functional, domain-appropriate tools for students across all 10 canonical academic discipline families, solving domain problems rather than acting as a generic chatbot with cosmetic label changes:

1. **Computer Science & IT**: Seamless catalog integration and discovery for existing enterprise tools (Resume AI Studio, Interactive Coding Sandbox, and GitHub Intelligence Reviewer).
2. **Mechanical Engineering**: Deterministic stress/strain calculations, factor of safety structural checks, gear train ratios with efficiency, Euler-Bernoulli beam bending, and design review checklists.
3. **ECE & EEE**: Series and parallel DC equivalent impedance, voltage divider rule, current divider rule, and Thévenin equivalent network with maximum power transfer verification.
4. **Civil Engineering**: Structural concrete volume calculations (slab, footing, beam, retaining wall), nominal mix batch proportions (1:1.5:3, 1:2:4, 1:1:2, 1:3:6), dry shrinkage factor (1.54), material wastage allowance, and editable Bill of Quantities (BOQ) cost worksheets.
5. **Chemical Engineering**: Continuous steady-state binary distillation mass balances with complete mass conservation checks, and ideal constant-density CSTR reactor space-time sizing.
6. **Biotechnology & Life Sciences**: Oligonucleotide sequence GC% content, Wallace Rule & salt-adjusted Marmur-Doty melting temperatures ($T_m$), molecular weight, and structured research hypotheses ($H_0$, $H_1$, positive/negative controls, statistical test recommendations).
7. **Business & Management (MBA)**: Break-even volume & revenue, margin of safety % buffer, Customer Acquisition Cost (CAC) and Lifetime Value (LTV) unit economics multiples, and strategic SWOT analysis matrix.
8. **Commerce & Finance**: Balance sheet working capital & liquidity ratios (Current & Quick Acid-Test ratios), profitability margins (Gross, Net, Return on Equity), and 3-period Discounted Cash Flow (NPV) capital budgeting models.
9. **Arts, Media & Humanities**: Exact deterministic bibliographic citation formatter (APA 7th, MLA 9th, Chicago 17th Notes & Bibliography), in-text parenthetical and narrative citations, and thesis statement contestability critique.
10. **Nursing & Allied Health**: Pediatric/adult medication dosage calculations with step-by-step dimensional analysis, standardized SBAR clinical handover builder, and non-negotiable educational practice disclaimers.
11. **Cross-Disciplinary / Shared**: Shared Project & Report Reviewer providing formative academic evaluation (strengths, missing sections/evidence gaps, technical questions, actionable improvements) across Technical Reports, Lab Writeups, Capstone Proposals, Business Cases, and Research Drafts.

---

## 2. Canonical Tool Registry

Located at `backend/src/modules/tools/constants/toolRegistry.js`:

| Tool ID | Display Name | Academic Discipline | Execution Mode | Route |
| :--- | :--- | :--- | :--- | :--- |
| `cse-resume-ai` | Resume AI Studio | Computer Science & IT | Hybrid AI / Det. | `/dashboard/resumes` (Reused) |
| `cse-coding-platform` | Interactive Coding Sandbox | Computer Science & IT | Deterministic | `/dashboard/coding` (Reused) |
| `cse-github-reviewer` | GitHub Intelligence Reviewer | Computer Science & IT | Hybrid AI / Det. | `/dashboard/github` (Reused) |
| `mech-calc` | Mechanical Engineering Calculation & Review | Mechanical Engineering | Deterministic | `/dashboard/tools/mech-calc` |
| `ece-circuits` | Circuit Analysis Learning Studio | ECE & EEE | Deterministic | `/dashboard/tools/ece-circuits` |
| `civil-boq` | Quantity Estimation & BOQ Assistant | Civil Engineering | Deterministic | `/dashboard/tools/civil-boq` |
| `chem-process` | Chemical Process Calculation Studio | Chemical Engineering | Deterministic | `/dashboard/tools/chem-process` |
| `biotech-research` | Biotechnology Research & Sequence Assistant | Biotechnology | Hybrid AI / Det. | `/dashboard/tools/biotech-research` |
| `business-kpi` | Business Case & Unit Economics Analyzer | Business & Management | Hybrid AI / Det. | `/dashboard/tools/business-kpi` |
| `finance-accounting` | Financial Statement & Accounting Practice Studio | Commerce & Finance | Deterministic | `/dashboard/tools/finance-accounting` |
| `arts-writing` | Research Writing & Critical Analysis Studio | Arts & Humanities | Hybrid AI / Det. | `/dashboard/tools/arts-writing` |
| `nursing-study` | Clinical Study & Dosage Arithmetic Assistant | Nursing & Allied Health | Deterministic | `/dashboard/tools/nursing-study` |
| `report-reviewer` | Shared Project & Report Reviewer | Cross-Disciplinary / Shared | Hybrid AI / Det. | `/dashboard/tools/report-reviewer` |

---

## 3. Deterministic vs. AI-Assisted Processing Boundaries

To protect academic and professional integrity, all mathematical, dimensional, and physical calculations are executed with **100% deterministic mathematical engines** rather than language model hallucinations:
- **Numerical Engines**: Normal stress $\sigma = F/A$, strain $\epsilon = \Delta L/L_0$, Factor of Safety $FoS = \sigma_{yield}/\sigma_{applied}$, gear ratios $i = N_2/N_1$, beam bending $\sigma = (M \cdot y)/I$, Ohm's Law and parallel equivalents $1/R_{eq} = \sum 1/R_i$, Thévenin maximum power $P_{max} = V_{th}^2 / (4 R_{th})$, concrete dry volumetric batching $V_{dry} = V_{wet} \times 1.54 \times (1 + \text{waste}\%)$, distillation balance $D = F(x_F - x_B)/(x_D - x_B)$, CSTR space time $\tau = X_A / [k(1 - X_A)]$, Wallace Rule $T_m = 2(A+T) + 4(G+C)$, break-even volume $FC / (P - VC)$, CAC/LTV ratio, liquidity/profitability ratios, discounted NPV, bibliographic citation strings, and pediatric dosage volume $V = \text{Dose} / \text{Conc}$.
- **Hybrid AI Reasoning**: Used for qualitative document feedback (SWOT extraction, research hypothesis organization, argument critique, and technical report reviewing) through `AIOrchestratorService` with Groq primary and offline rule-based heuristic fallback if unconfigured.

---

## 4. Privacy, Ownership, and Portfolio Persistence

- Activity records are persisted in `ToolActivityRecord` (`user`, `toolId`, `toolDisplayName`, `academicDiscipline`, `inputParameters`, `resultData`, `executionMode`, `status`, `isSavedToPortfolio`, `portfolioMetadata`).
- Strict user ownership is enforced on all history endpoints (`/api/v1/tools/history/my-activity`, `/api/v1/tools/history/:recordId/portfolio`).
- Private calculations remain private by default; artifacts are only added to a student's public portfolio upon explicit user toggle.

---

## 5. Safety, Regulatory, and Professional Limitations

Non-negotiable educational boundaries are displayed across workspaces and returned in API payloads:
1. **Mechanical Engineering**: Educational calculation only. Does NOT replace professional mechanical design certification, finite element validation, or stamping by a licensed Professional Engineer (PE).
2. **ECE & EEE**: Ideal lumped-parameter DC model. Does not model high-frequency RF parasitics, transient harmonics, or high-voltage arc-flash protective tripping.
3. **Civil Engineering**: Educational estimation only. Does not represent guaranteed vendor pricing or certified construction bidding schedules.
4. **Chemical Engineering**: Idealized steady-state solution model. Does not model runaway reactions or provide operational plant control.
5. **Biotechnology**: Research education only. Not for clinical diagnostic use, therapeutic guidance, or medical pathology interpretation.
6. **Commerce & Finance**: Educational learning tool. Does not constitute licensed investment advisory, tax planning, or statutory financial auditing.
7. **Nursing & Allied Health**: CRITICAL CLINICAL NOTICE: FOR EDUCATIONAL PRACTICE ONLY. Must NOT be used for live patient dosing, actual clinical triage, or prescribing. Does not substitute for institutional hospital protocols or licensed nursing verification.

---

## 6. Verification and Test Results

### Backend Tests
- Command: `npx vitest run test/phase4*.test.js test/phase50*.test.js`
- Result: **11 passed test files, 255 passed tests, 0 failed, 0 skipped**.
- Full test suite for Phase 50 (`backend/test/phase50.tools-hub.test.js`): **33/33 tests passed (100%)**.

### Frontend Tests
- Command: `npx vitest run src/test/phase4*.test.tsx src/test/phase50*.test.tsx src/test/navigation.links.test.tsx`
- Result: **12 passed test files, 107 passed tests, 0 failed, 0 skipped**.
- Full test suite for Phase 50 (`frontend/src/test/phase50.tools-hub-frontend.test.tsx`): **8/8 tests passed (100%)**.

### Production Build
- Command: `npm run build` in `frontend/`
- Result: **Built cleanly in 7.30s (0 errors)**.
