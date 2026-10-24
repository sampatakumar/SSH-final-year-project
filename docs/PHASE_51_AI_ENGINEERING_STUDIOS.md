# Phase 51: Branch-Specific AI Engineering Studios (Mechanical, ECE/EEE, Civil, and Chemical Engineering)

## 1. Overview & Architecture

Phase 51 elevates the initial calculation tools developed in Phase 50 for the four foundational engineering disciplines into full **AI-Assisted Educational Engineering Studios**:
1. **Mechanical Engineering AI Studio** (`mech-calc`)
2. **ECE/EEE Circuit AI Studio** (`ece-circuits`)
3. **Civil Engineering AI Studio** (`civil-boq`)
4. **Chemical Process AI Studio** (`chem-process`)

Rather than relying on ungrounded language models to perform arithmetic, each studio uses a **dual-engine hybrid architecture**:
- **Deterministic Math Engine**: Computes exact physical, structural, thermodynamic, and electrical equations (authoritative arithmetic).
- **AI Interpretation & Synthesis Engine**: Analyzes engineering problem statements, identifies unspoken assumptions and missing input parameters, explains physical behavior, troubleshoots real-world deviations, highlights safety boundaries, and generates structured report drafts.
- **Verification Pass (`VERIFIED_DETERMINISTIC`)**: Programmatically cross-checks any numerical claims in generated text against the output of the deterministic calculation engine before publishing to the student.

---

## 2. Studio Implementations by Engineering Discipline

### 2.1 Mechanical Engineering AI Studio (`mech-calc`)
- **Deterministic Workflows**:
  - Stress and strain analysis ($\sigma = F/A$, $\epsilon = \Delta L / L_0$).
  - Factor of Safety structural evaluation ($FoS = \sigma_{\text{yield}} / \sigma_{\text{applied}}$) with safety flags ($FoS < 1.0$ yielding danger, $FoS < 1.5$ caution).
  - Multi-stage gear train ratios ($i = \prod (N_{\text{driven}} / N_{\text{driver}})$), output speed, and output torque under mechanical efficiency losses ($\tau_{\text{out}} = \tau_{\text{in}} \cdot i \cdot \eta$).
  - Euler-Bernoulli beam bending maximum stress ($\sigma_{\text{max}} = (M \cdot y) / I$).
  - Interactive design review checklist with weightings.
- **AI Studio Enhancements**:
  - Contextual problem statement ingestion.
  - Identification of critical unstated assumptions (e.g., isotropic material behavior, small deflection theory, negligible thermal gradients, rigid shaft alignment).
  - Missing parameter checklist (e.g., dynamic shock factors, endurance fatigue limits, surface finish, operating temperature).
  - Curriculum links to genuine platform learning artifacts:
    - Practical Lab: `mech-lab-stress-strain` (Tensile Stress-Strain & Modulus Validation Lab)
    - Practical Lab: `mech-lab-gear-ratio` (Compound Gear Train & Torque Transmission Lab)
    - Assessment: `mech-eng-mechanics` (Engineering Mechanics & Strength of Materials Assessment)
    - Project Studio: `mech-cad-gearbox-design` (Industrial Reduction Gearbox CAD Project)

### 2.2 ECE/EEE Circuit AI Studio (`ece-circuits`)
- **Deterministic Workflows**:
  - Series and parallel DC equivalent resistance ($R_{\text{series}} = \sum R_i$, $1/R_{\text{parallel}} = \sum 1/R_i$).
  - Ohm's Law direct calculation ($V = I \cdot R$, $P = V \cdot I$).
  - Voltage divider rule ($V_{\text{out}} = V_{\text{in}} \cdot [R_2 / (R_1 + R_2)]$).
  - Current divider rule ($I_{R1} = I_{\text{total}} \cdot [R_2 / (R_1 + R_2)]$).
  - Thévenin equivalent resistance ($R_{\text{th}}$), open-circuit voltage ($V_{\text{th}}$), and maximum power transfer theorem ($P_{\text{max}} = V_{\text{th}}^2 / [4 R_{\text{th}}]$ when $R_L = R_{\text{th}}$).
- **AI Studio Enhancements**:
  - Physical vs. ideal DC circuit discrepancy troubleshooting:
    - Resistor tolerance variations (e.g., standard $\pm 5\%$ carbon film or $\pm 1\%$ metal film spreads).
    - Internal DC power supply resistance and multimeter shunt burden voltage.
    - Solderless breadboard contact resistance ($0.05\,\Omega$ to $0.2\,\Omega$ per junction) and parasitic track capacitance.
    - Component self-heating and temperature coefficient of resistance ($\Delta R = R_0 \cdot \alpha \cdot \Delta T$).
  - Curriculum links to genuine platform learning artifacts:
    - Practical Lab: `ece-lab-circuit-thevenin` (Thévenin Equivalent & Max Power Transfer Lab)
    - Practical Lab: `ece-lab-opamp-filter` (Active Op-Amp Filter Design & Bode Plot Lab)
    - Assessment: `ece-circuit-analysis` (DC & AC Circuit Analysis Comprehensive Assessment)
    - Project Studio: `ece-iot-sensor-node` (Low-Power Embedded IoT Sensor Node Project)

### 2.3 Civil Engineering AI Studio (`civil-boq`)
- **Deterministic Workflows**:
  - Structural concrete element volume calculations for slabs, footings, rectangular beams, and retaining walls.
  - Nominal batch mix proportions (M20 1:1.5:3, M15 1:2:4, M25 1:1:2, M10 1:3:6).
  - Dry volume shrinkage expansion factor ($1.54$) converting wet placed concrete to dry unmixed constituents.
  - User-configurable material wastage allowance percentage.
  - Material breakdown into cement bags ($50\,\text{kg}$ / $0.0347\,\text{m}^3$), fine aggregate (sand in $\text{m}^3$), and coarse aggregate (gravel in $\text{m}^3$).
  - Unit-priced Bill of Quantities (BOQ) cost worksheet.
- **AI Studio Enhancements**:
  - Explicit scope exclusions and non-included site provisions:
    - Steel reinforcement rebar detailing and Bar Bending Schedule (BBS).
    - Formwork, centering, shuttering, and prop removal staging.
    - Skilled and unskilled labor installation hours.
    - Curing water management, admixtures, and plasticizers.
    - Site batching overhead, transportation, and equipment rental.
  - Curriculum links to genuine platform learning artifacts:
    - Practical Lab: `civil-lab-concrete-mix` (Concrete Mix Design & Slump Cone Testing Lab)
    - Practical Lab: `civil-lab-beam-bending` (Reinforced Beam Flexural Deflection Lab)
    - Assessment: `civil-structural-fundamentals` (Structural Mechanics & Concrete Technology Assessment)
    - Project Studio: `civil-reinforced-concrete-slab` (Residential Multi-Story Slab & Foundation BOQ Project)

### 2.4 Chemical Process AI Studio (`chem-process`)
- **Deterministic Workflows**:
  - Continuous steady-state binary distillation column mass balance with overall and component conservation verification ($F = D + B$, $F \cdot x_F = D \cdot x_D + B \cdot x_B$).
  - Ideal constant-density CSTR reactor space-time ($\tau = X_A / [k(1 - X_A)]$) and required reactor volume ($V = \tau \cdot v_0$) for first-order liquid-phase kinetics.
  - Chemical conversion and product concentration stoichiometry ($C_A = C_{A0} \cdot (1 - X)$, $\Delta C = C_{A0} \cdot X$).
- **AI Studio Enhancements**:
  - Identification of thermodynamic non-idealities and VLE deviations:
    - Non-ideal vapor-liquid equilibrium (activity coefficients $\gamma_i \ne 1$, azeotropes, pressure-dependent volatility).
    - Exothermic reaction thermal runaways and CSTR cooling jacket heat transfer limitations ($Q = U \cdot A \cdot \Delta T_{\text{lm}}$).
    - HazOp preliminary safety notes (overpressure relief valves, runaway interlocks, toxic off-gas scrubbing).
  - Curriculum links to genuine platform learning artifacts:
    - Practical Lab: `chem-lab-mass-balance` (Continuous Distillation Steady-State Balance Lab)
    - Practical Lab: `chem-lab-cstir-reactor` (Isothermal CSTR Residence Time & Conversion Lab)
    - Assessment: `chem-mass-energy-balances` (Principles of Chemical Engineering Calculations Assessment)
    - Project Studio: `chem-distillation-column-sizing` (Packed/Tray Binary Fractionation Column Design Project)

---

## 3. Dual-Engine Architecture & Deterministic Verification

To protect engineering safety and eliminate hallucinated numbers:
1. **Authoritative Deterministic Execution**: Equations are executed in JavaScript math routines in `toolExecution.service.js`. Output numbers, units, and intermediate calculation steps are collected into `calcResults`.
2. **Contextual AI Synthesis**: If enabled (`enableAiInterpretation: true`), problem statements and inputs are passed to `AIOrchestratorService` with registered studio tasks (`MECHANICAL_ENGINEERING_AI_STUDIO`, `ECE_CIRCUIT_AI_STUDIO`, `CIVIL_ENGINEERING_AI_STUDIO`, `CHEMICAL_PROCESS_AI_STUDIO`).
3. **Deterministic Heuristic Fallback**: If external LLM APIs are unconfigured, unreachable, or return authentication errors, local deterministic heuristic generators immediately provide structured domain outputs with zero downtime.
4. **Verification Pass (`verifyEngineeringAiOutput`)**:
   - Parses numerical claims in the synthesized text.
   - Cross-references values against the deterministic engine results.
   - Marks claims with `VERIFIED_DETERMINISTIC` when arithmetic matches within a $1.5\%$ tolerance band.
   - Assigns studio verification status: `VERIFIED_DETERMINISTIC`, `DISCREPANCY_DETECTED`, or `UNVERIFIED_HEURISTIC`.

---

## 4. Shared Engineering Report Builder Component

Implemented in `frontend/src/modules/tools/components/SharedEngineeringReportBuilder.tsx`:
- **Dual Mode UI**:
  - **Preview Tab**: Formatted executive summary, verification badge (`VERIFIED_DETERMINISTIC`), step-by-step arithmetic proof, assumptions, limitations, missing inputs checklist, discipline-specific troubleshooting/deviations, and recommended learning pathway cards.
  - **Edit Draft Tab**: Fully editable report form allowing students to refine the report title, executive summary, methodology, assumptions, limitations, and recommendations.
- **Export & Integration Actions**:
  - **Copy Markdown**: Formats the complete engineering analysis into clean GitHub-flavored markdown and copies to system clipboard.
  - **Download JSON**: Exports the full structured report payload including inputs, deterministic metrics, and AI synthesis.
  - **Save to Portfolio**: Persists the studio report into the student's public/academic portfolio.
  - **Update Saved Report**: Calls `PUT /api/v1/tools/history/:recordId/report` to persist student edits back to MongoDB.

---

## 5. Backend Schema & API Enhancements

### Schema Update (`ToolActivityRecord`)
Extended with studio fields:
```javascript
{
  problemStatement: { type: String, default: "" },
  verificationStatus: {
    type: String,
    enum: ["VERIFIED_DETERMINISTIC", "DISCREPANCY_DETECTED", "UNVERIFIED_HEURISTIC", "NOT_APPLICABLE"],
    default: "NOT_APPLICABLE"
  },
  reportDraft: {
    title: String,
    executiveSummary: String,
    methodology: String,
    assumptions: [String],
    limitations: [String],
    calculatedResults: mongoose.Schema.Types.Mixed,
    equationsUsed: [String],
    recommendations: [String],
    learningLinks: [mongoose.Schema.Types.Mixed],
    isDraftEdited: { type: Boolean, default: false },
    lastEditedAt: Date
  },
  provenance: {
    model: String,
    provider: String,
    isFallback: Boolean,
    verificationPass: Boolean,
    generatedAt: Date
  }
}
```

### Endpoints
- `POST /api/v1/tools/:toolId/execute`
  - Accepts `problemStatement` and `enableAiInterpretation` in addition to tool parameters.
  - Returns `resultData`, `reportDraft`, `verificationStatus`, and `provenance`.
- `PUT /api/v1/tools/history/:recordId/report`
  - Validates user authentication and record ownership.
  - Updates `reportDraft` (`title`, `executiveSummary`, `methodology`, `assumptions`, `limitations`, `recommendations`).
  - Sets `isDraftEdited: true` and `lastEditedAt: new Date()`.

---

## 6. Safety, Professional, and Regulatory Disclaimers

All studio outputs, API responses, and exported reports include prominent regulatory disclaimers:
- **Mechanical Studio**: "Educational engineering study only. Does not replace professional finite element analysis (FEA) or stamping by a licensed Professional Engineer (PE)."
- **ECE/EEE Studio**: "Ideal lumped-element DC model. Does not model high-frequency RF parasitics, transient switching spikes, or arc-flash hazard ratings."
- **Civil Studio**: "Educational quantity estimation only. Does not include structural detailing, rebar bending schedules, or statutory building permit certifications."
- **Chemical Studio**: "Idealized steady-state model for educational study only. Does not account for real-gas non-idealities, azeotropic shifts, or process safety management (PSM) shutdown interlocks."

---

## 7. Verification and Test Results

### Backend Test Suite
- Command: `npx vitest run test/phase50.tools-hub.test.js test/phase51.ai-engineering-studios.test.js`
- Result: **2 passed test files, 51 passed tests, 0 failed, 0 skipped**.
  - Phase 50 regression: **33/33 tests passed (100%)**.
  - Phase 51 studio suite: **18/18 tests passed (100%)**.

### Frontend Test Suite
- Command: `npx vitest run src/test/phase50.tools-hub-frontend.test.tsx src/test/phase51.ai-engineering-studios-frontend.test.tsx`
- Result: **2 passed test files, 15 passed tests, 0 failed, 0 skipped**.
  - Phase 50 regression: **8/8 tests passed (100%)**.
  - Phase 51 studio suite: **7/7 tests passed (100%)**.

### Frontend Production Build
- Command: `npm run build` in `frontend/`
- Result: **Built cleanly in 11.42s (0 errors, 0 warnings)**.
