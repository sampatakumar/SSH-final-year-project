/**
 * SMART SKILL HUB — BRANCH-AWARE ASSESSMENT CATALOG (PHASE 44)
 *
 * Authoritative collection of discipline-specific assessments spanning:
 * 1. Mechanical Engineering
 * 2. Electronics & Electrical Engineering (ECE / EEE)
 * 3. Civil Engineering
 * 4. Chemical Engineering
 * 5. Biotechnology & Bioinformatics
 * 6. Business Administration & MBA
 * 7. Commerce, Accounting & Finance
 * 8. Arts, Humanities & Social Sciences
 * 9. Nursing & Allied Health Sciences
 * 10. Computer Science & Information Technology
 *
 * Each assessment provides:
 * - Stable assessmentId
 * - Canonical branchSlugs and career role mappings
 * - Concrete learning objectives & prerequisites
 * - Structured questions: single_choice, multiple_select, numeric (with tolerance & unit), case_study_response
 * - Authoritative answer keys, explanations, and remediation guidance
 * - Recommended Phase 43 Project Studio blueprints
 */

export const ASSESSMENTS_CATALOG = [
  // =========================================================================
  // 1. MECHANICAL ENGINEERING: ENGINEERING MECHANICS & STATICS
  // =========================================================================
  {
    assessmentId: "mech-eng-mechanics",
    title: "Engineering Mechanics: Statics, Equilibrium & Truss Analysis",
    description:
      "Evaluates core mechanical principles including rigid-body static equilibrium, planar force systems, method of joints for pin-jointed trusses, and friction coefficients.",
    branchSlugs: ["mech", "auto", "ipe", "aero"],
    disciplineCategory: "Engineering & Technology",
    compatibleDegrees: ["btech", "mtech", "diploma"],
    relevantRoleSlugs: ["mechanical-design-engineer", "structural-analysis-engineer", "cad-engineer"],
    relevantSkills: ["Engineering Mechanics", "Statics", "Truss Analysis", "Free Body Diagrams"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Calculate reactions at supports for statically determinate planar structures.",
      "Apply the method of joints to evaluate internal member forces in trusses.",
      "Distinguish between tensile and compressive member states.",
      "Calculate normal forces and impending slip conditions under dry Coulomb friction.",
    ],
    prerequisites: ["Vector algebra", "Newton's laws of motion", "Basic trigonometry"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["mech-gearbox-design"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review vector force resolution along orthogonal axes (ΣFx = 0, ΣFy = 0, ΣMo = 0) and the principle of transmissibility before attempting advanced structural design.",
    questions: [
      {
        questionId: "mech-q1",
        type: "single_choice",
        prompt:
          "A simply supported beam of span L = 6 m carries a concentrated downward load of P = 12 kN at a distance of 2 m from support A. Assuming no horizontal loads, what is the vertical reaction force at support B (RB)?",
        options: [
          { optionId: "a", text: "4 kN" },
          { optionId: "b", text: "6 kN" },
          { optionId: "c", text: "8 kN" },
          { optionId: "d", text: "12 kN" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Equilibrium of Rigid Bodies",
        explanation:
          "Taking moments about support A: ΣMA = 0 => (12 kN * 2 m) - (RB * 6 m) = 0 => 24 = 6*RB => RB = 4 kN. By vertical equilibrium, RA = 12 - 4 = 8 kN.",
        remediationGuidance:
          "Review equilibrium moment balance equations about hinge supports.",
      },
      {
        questionId: "mech-q2",
        type: "multiple_select",
        prompt:
          "Which of the following conditions identify a zero-force member in an ideal planar pin-jointed truss with no external loads applied at the joint? (Select all that apply)",
        options: [
          {
            optionId: "a",
            text: "Two non-collinear members meet at an unloaded joint.",
          },
          {
            optionId: "b",
            text: "Three members meet at an unloaded joint where two are collinear; the third non-collinear member is a zero-force member.",
          },
          {
            optionId: "c",
            text: "Four collinear members meet at a loaded joint.",
          },
          {
            optionId: "d",
            text: "Two collinear members meet at an unloaded joint with equal and opposite internal forces.",
          },
        ],
        correctAnswer: ["a", "b"],
        points: 25,
        topic: "Truss Zero-Force Members",
        explanation:
          "In statics: (1) If two non-collinear members form an unloaded joint, both carry zero force. (2) If three members meet at an unloaded joint and two are collinear, the third transverse member must carry zero force to satisfy equilibrium perpendicular to the collinear pair.",
        remediationGuidance:
          "Study zero-force member inspection rules in Hibbeler or Meriam & Kraige Statics.",
      },
      {
        questionId: "mech-q3",
        type: "numeric",
        prompt:
          "A block weighing W = 250 N rests on a horizontal plane with a static friction coefficient of μs = 0.35. What minimum horizontal force P (in N) is required to cause impending motion?",
        correctAnswer: 87.5,
        tolerance: 1.0,
        unit: "N",
        points: 25,
        topic: "Dry Coulomb Friction",
        explanation:
          "Normal reaction N = W = 250 N. The maximum static friction force before impending slip is Fmax = μs * N = 0.35 * 250 N = 87.5 N. Therefore P >= 87.5 N.",
        remediationGuidance:
          "Revisit the Coulomb dry friction inequality F <= μs * N and normal force resolution.",
      },
      {
        questionId: "mech-q4",
        type: "case_study_response",
        prompt:
          "A cantilever steel bracket attached to an industrial column experiences unexpected plastic deformation at its root. Identify the primary internal resultant stresses developed at the clamped support and specify two engineering modifications to reduce maximum root bending stress.",
        correctAnswer: "bending moment, shear force, increase section modulus, fillet radius, stiffener gusset",
        points: 25,
        topic: "Mechanics of Materials & Failure",
        explanation:
          "At the clamped root, internal resultants include maximum bending moment and transverse shear. Stress can be mitigated by increasing the section modulus (deeper beam or larger flange), welding triangular gusset stiffeners, or introducing a generous transition fillet radius.",
        remediationGuidance:
          "Examine flexure formula σ = M*y/I and stress concentration mitigation at cantilever fixities.",
        rubricCriteria: [
          "Identifies bending moment and shear force as root resultants.",
          "Recommends increasing section modulus (I/c) or beam depth.",
          "Suggests structural gussets, stiffeners, or transition fillets.",
        ],
      },
    ],
  },

  // =========================================================================
  // 2. MECHANICAL ENGINEERING: MATERIALS & MANUFACTURING FUNDAMENTALS
  // =========================================================================
  {
    assessmentId: "mech-materials-mfg",
    title: "Materials Science & Manufacturing Processes Fundamentals",
    description:
      "Covers engineering metallurgy, iron-carbon phase diagrams, heat treatment kinetics, casting defects, and CNC metal machining parameters.",
    branchSlugs: ["mech", "auto", "ipe", "prod"],
    disciplineCategory: "Engineering & Technology",
    compatibleDegrees: ["btech", "mtech", "diploma"],
    relevantRoleSlugs: ["manufacturing-engineer", "materials-engineer", "production-engineer"],
    relevantSkills: ["Materials Science", "Heat Treatment", "Machining", "Manufacturing Processes"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "objective_quiz",
    learningObjectives: [
      "Interpret iron-carbon phase equilibrium reactions (eutectic vs eutectoid).",
      "Explain the microstructural transformation from austenite to martensite upon quenching.",
      "Identify common casting porosity defects and their prevention.",
      "Calculate spindle speed and material removal rate for cylindrical turning operations.",
    ],
    prerequisites: ["Introductory metallurgy", "Basic manufacturing technology"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["mech-gearbox-design"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review the Fe-Fe3C equilibrium phase diagram at 0.76 wt% carbon and cooling rates on TTT (time-temperature-transformation) curves.",
    questions: [
      {
        questionId: "mat-q1",
        type: "single_choice",
        prompt:
          "In the Fe-Fe3C phase equilibrium diagram, at what temperature and carbon concentration does the eutectoid reaction (Austenite -> Ferrite + Cementite / Pearlite) occur?",
        options: [
          { optionId: "a", text: "727 °C and 0.76 wt% C" },
          { optionId: "b", text: "1147 °C and 4.3 wt% C" },
          { optionId: "c", text: "912 °C and 0.022 wt% C" },
          { optionId: "d", text: "1495 °C and 0.17 wt% C" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Iron-Carbon Phase Diagram",
        explanation:
          "The eutectoid reaction occurs at 727 °C and ~0.76 wt% C (or 0.77 wt% depending on reference standard), where gamma-austenite decomposes into lamellar pearlite (alpha-ferrite + Fe3C cementite).",
        remediationGuidance:
          "Contrast the eutectoid (solid-to-solid) reaction with the eutectic reaction at 1147 °C (liquid-to-solid).",
      },
      {
        questionId: "mat-q2",
        type: "multiple_select",
        prompt:
          "Which of the following heat treatment processes are specifically utilized to relieve internal residual stresses in steel without significantly softening the bulk microstructure? (Select all that apply)",
        options: [
          { optionId: "a", text: "Stress relief annealing (550 °C - 650 °C)" },
          { optionId: "b", text: "Full quenching in brine from 850 °C" },
          { optionId: "c", text: "Process annealing below A1" },
          { optionId: "d", text: "Carburizing case hardening" },
        ],
        correctAnswer: ["a", "c"],
        points: 25,
        topic: "Heat Treatment of Steels",
        explanation:
          "Stress relief annealing and subcritical process annealing heat the component below the lower critical temperature A1 (typically 550 - 650 °C), allowing dislocation rearrangement and residual stress relaxation without phase transformation or excessive hardness loss. Quenching increases internal stresses, and carburizing introduces carbon into the case.",
        remediationGuidance:
          "Review heat treatment annealing classifications in Callister Materials Science.",
      },
      {
        questionId: "mat-q3",
        type: "numeric",
        prompt:
          "A cylindrical mild steel workpiece of diameter D = 50 mm is being turned on a lathe at a recommended cutting speed of Vc = 120 m/min. Calculate the required lathe spindle speed N in RPM (round to nearest integer). (Use π = 3.1416)",
        correctAnswer: 764,
        tolerance: 5.0,
        unit: "RPM",
        points: 25,
        topic: "Machining Mechanics & Cutting Speeds",
        explanation:
          "Cutting speed formula: Vc = (π * D * N) / 1000 => N = (1000 * Vc) / (π * D) = (1000 * 120) / (3.1416 * 50) = 120000 / 157.08 = 763.94 ≈ 764 RPM.",
        remediationGuidance:
          "Memorize the standard turning cutting speed equation N = (1000 * Vc) / (π * D).",
      },
      {
        questionId: "mat-q4",
        type: "single_choice",
        prompt:
          "What is the primary physical cause of shrinkage porosity in metal casting and how is it conventionally mitigated by casting patternmakers?",
        options: [
          {
            optionId: "a",
            text: "Liquid-to-solid phase density increase; mitigated by properly sized and positioned directional risers (feeders).",
          },
          {
            optionId: "b",
            text: "Excessive hydrogen gas absorption; mitigated by increasing sand moisture.",
          },
          {
            optionId: "c",
            text: "Turbulent mold filling; mitigated by omitting the sprue base.",
          },
          {
            optionId: "d",
            text: "Low pouring temperature; mitigated by using unvented cope boxes.",
          },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Casting Defects & Solidification",
        explanation:
          "Metals contract during solidification (liquid-to-solid density increase). If a region freezes without liquid feed, shrinkage voids form. Risers (feeders) act as liquid reservoirs that solidify last, directing shrinkage out of the final casting.",
        remediationGuidance:
          "Review Chvorinov's rule and directional solidification principles.",
      },
    ],
  },

  // =========================================================================
  // 3. ECE / EEE: DIGITAL ELECTRONICS & LOGIC DESIGN
  // =========================================================================
  {
    assessmentId: "ece-digital-electronics",
    title: "Digital Logic Design & Combinational/Sequential Circuits",
    description:
      "Tests digital electronics fundamentals including Boolean algebra simplification, Karnaugh maps, synchronous flip-flop timing (setup/hold), finite state machines, and propagation delay.",
    branchSlugs: ["ece", "eee", "eie", "cse"],
    disciplineCategory: "Electronics & Electrical",
    compatibleDegrees: ["btech", "mtech", "diploma"],
    relevantRoleSlugs: ["embedded-engineer", "digital-design-engineer", "fpga-engineer"],
    relevantSkills: ["Digital Electronics", "Logic Design", "Verilog", "FPGA"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Simplify multi-variable Boolean expressions using Karnaugh maps.",
      "Analyze setup (t_su) and hold (t_hold) time timing violations in synchronous D flip-flops.",
      "Design synchronous modulo counters and state transition tables.",
      "Differentiate between Mealy and Moore finite state machine outputs.",
    ],
    prerequisites: ["Binary arithmetic", "Basic logic gates (AND, OR, NOT, XOR)"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["ece-iot-smart-meter"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review static timing analysis rules: T_clk >= T_cq + T_comb_max + T_setup, and T_cq + T_comb_min >= T_hold.",
    questions: [
      {
        questionId: "ece-q1",
        type: "single_choice",
        prompt:
          "In a synchronous digital sequential circuit, a positive-edge-triggered D flip-flop has a clock-to-Q delay T_cq = 2 ns and setup time T_setup = 1.5 ns. If the maximum combinational logic path delay between flip-flops is T_comb = 6.5 ns, what is the maximum clock frequency (f_max) at which the circuit can safely operate without setup violations?",
        options: [
          { optionId: "a", text: "100 MHz" },
          { optionId: "b", text: "125 MHz" },
          { optionId: "c", text: "150 MHz" },
          { optionId: "d", text: "200 MHz" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Static Timing Analysis & Setup Constraints",
        explanation:
          "Minimum clock period T_min = T_cq + T_comb + T_setup = 2.0 ns + 6.5 ns + 1.5 ns = 10.0 ns. Maximum frequency f_max = 1 / T_min = 1 / (10 * 10^-9 s) = 100 * 10^6 Hz = 100 MHz.",
        remediationGuidance:
          "Examine setup time constraint formula: T_clk >= T_cq + T_comb + T_setup.",
      },
      {
        questionId: "ece-q2",
        type: "multiple_select",
        prompt:
          "Which of the following statements correctly contrast Mealy and Moore finite state machines (FSMs)? (Select all that apply)",
        options: [
          {
            optionId: "a",
            text: "In a Moore machine, output values depend solely on the current state.",
          },
          {
            optionId: "b",
            text: "In a Mealy machine, output values depend on both the current state and current inputs.",
          },
          {
            optionId: "c",
            text: "Mealy machines often require fewer states than equivalent Moore machines to realize the same sequence.",
          },
          {
            optionId: "d",
            text: "Moore machine outputs change asynchronously immediately when inputs transition between clock edges.",
          },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "Finite State Machine Architectures",
        explanation:
          "Statements A, B, and C are correct: Moore outputs depend strictly on state, while Mealy outputs depend on state + input (often yielding fewer states). Statement D is incorrect: Mealy outputs can change asynchronously with inputs, whereas Moore outputs are stable between clock state transitions.",
        remediationGuidance:
          "Review FSM state diagrams in Roth & Kinney Fundamentals of Logic Design.",
      },
      {
        questionId: "ece-q3",
        type: "numeric",
        prompt:
          "A 4-bit synchronous binary up-counter is clocked at 24 MHz. What is the frequency (in MHz) of the signal observed at the Most Significant Bit (Q3) output?",
        correctAnswer: 1.5,
        tolerance: 0.1,
        unit: "MHz",
        points: 25,
        topic: "Binary Counters & Frequency Division",
        explanation:
          "A 4-bit binary counter divides the input clock frequency by 2^n at each stage. Q0 divides by 2 (12 MHz), Q1 divides by 4 (6 MHz), Q2 divides by 8 (3 MHz), and Q3 divides by 2^4 = 16. f_Q3 = 24 MHz / 16 = 1.5 MHz.",
        remediationGuidance:
          "Review ripple and synchronous counter frequency division ratios: f_out = f_in / 2^N.",
      },
      {
        questionId: "ece-q4",
        type: "single_choice",
        prompt:
          "What is the minimized sum-of-products (SOP) expression for the Boolean function F(A,B,C) = Σm(1, 3, 5, 7)?",
        options: [
          { optionId: "a", text: "F = C" },
          { optionId: "b", text: "F = A'C + AC" },
          { optionId: "c", text: "F = B" },
          { optionId: "d", text: "F = A + B + C" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Karnaugh Map Minimization",
        explanation:
          "Min terms 1 (001), 3 (011), 5 (101), and 7 (111) all have C = 1 regardless of A or B. Plotting on a 3-variable K-map yields a single 4-cell group spanning all values of A and B, simplifying directly to F = C.",
        remediationGuidance:
          "Practice 3-variable K-map groupings and essential prime implicant reduction.",
      },
    ],
  },

  // =========================================================================
  // 4. ECE / EEE: CIRCUIT ANALYSIS FUNDAMENTALS
  // =========================================================================
  {
    assessmentId: "ece-circuit-analysis",
    title: "Electrical Circuit Analysis: DC, AC & RLC Transients",
    description:
      "Evaluates Kirchhoff's laws, Thevenin and Norton equivalence, operational amplifier configurations, AC phasor impedance, and first-order RC/RL transient responses.",
    branchSlugs: ["ece", "eee", "eie", "ee"],
    disciplineCategory: "Electronics & Electrical",
    compatibleDegrees: ["btech", "mtech", "diploma"],
    relevantRoleSlugs: ["electronics-engineer", "hardware-engineer", "power-systems-engineer"],
    relevantSkills: ["Circuit Analysis", "Analog Electronics", "Thevenin Theorem", "Op-Amps"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Determine Thevenin equivalent resistance (R_th) and voltage (V_th) of linear resistive networks.",
      "Calculate time constants and voltage trajectories for first-order RC charging circuits.",
      "Analyze ideal inverting and non-inverting operational amplifier gain.",
      "Compute complex impedance and power factor in AC sinusoidal steady-state circuits.",
    ],
    prerequisites: ["Kirchhoff's current and voltage laws", "Complex numbers in polar/rectangular forms"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["ece-iot-smart-meter"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review the virtual short concept in negative-feedback op-amps (V+ = V-, I+ = I- = 0) and the time constant tau = R * C.",
    questions: [
      {
        questionId: "cir-q1",
        type: "single_choice",
        prompt:
          "In an ideal non-inverting operational amplifier circuit with negative feedback, the input signal Vin is connected to the non-inverting (+) terminal. The feedback resistor from output to inverting terminal is Rf = 40 kΩ, and the resistor from inverting terminal to ground is R1 = 10 kΩ. What is the closed-loop voltage gain (Av = Vout / Vin)?",
        options: [
          { optionId: "a", text: "-4" },
          { optionId: "b", text: "4" },
          { optionId: "c", text: "5" },
          { optionId: "d", text: "0.25" },
        ],
        correctAnswer: "c",
        points: 25,
        topic: "Operational Amplifiers",
        explanation:
          "The ideal non-inverting amplifier closed-loop gain is Av = 1 + (Rf / R1) = 1 + (40 kΩ / 10 kΩ) = 1 + 4 = 5.",
        remediationGuidance:
          "Contrast inverting gain Av = -Rf / R1 with non-inverting gain Av = 1 + Rf / R1.",
      },
      {
        questionId: "cir-q2",
        type: "numeric",
        prompt:
          "A series RC circuit consists of a resistor R = 50 kΩ and a capacitor C = 20 μF connected across a 12 V DC source. Calculate the circuit time constant tau in seconds.",
        correctAnswer: 1.0,
        tolerance: 0.05,
        unit: "s",
        points: 25,
        topic: "First-Order Transient Response",
        explanation:
          "Time constant tau = R * C = (50 * 10^3 Ω) * (20 * 10^-6 F) = 1000 * 10^-3 = 1.0 second.",
        remediationGuidance:
          "Review RC and RL transient equations: tau_RC = R*C and tau_RL = L/R.",
      },
      {
        questionId: "cir-q3",
        type: "multiple_select",
        prompt:
          "Which of the following procedural steps are valid methods to determine the Thevenin equivalent resistance (R_th) seen across terminals A-B of a linear network containing independent voltage and current sources? (Select all that apply)",
        options: [
          {
            optionId: "a",
            text: "Deactivate all independent sources (short-circuit independent voltage sources, open-circuit independent current sources) and find the equivalent resistance between A and B.",
          },
          {
            optionId: "b",
            text: "Calculate open-circuit voltage Voc and short-circuit current Isc across A-B, then compute R_th = Voc / Isc.",
          },
          {
            optionId: "c",
            text: "Connect a test source V_test across A-B with independent sources zeroed, and find R_th = V_test / I_test.",
          },
          {
            optionId: "d",
            text: "Short-circuit all independent current sources and open-circuit all independent voltage sources.",
          },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "Thevenin & Norton Network Theorems",
        explanation:
          "Methods A, B, and C are standard Thevenin resistance evaluation techniques. Option D is inverted (voltage sources must be zeroed by shorting V=0, and current sources by opening I=0).",
        remediationGuidance:
          "Review independent source deactivation rules in Hayt & Kemmerly Engineering Circuit Analysis.",
      },
      {
        questionId: "cir-q4",
        type: "single_choice",
        prompt:
          "An AC circuit operating at angular frequency ω has a branch containing a capacitor of capacitance C. What is the complex impedance Z_C of the capacitor in rectangular form?",
        options: [
          { optionId: "a", text: "-j / (ω*C)" },
          { optionId: "b", text: "+j * ω * C" },
          { optionId: "c", text: "+j / (ω*C)" },
          { optionId: "d", text: "ω * C" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "AC Sinusoidal Steady-State Phasors",
        explanation:
          "Impedance of a capacitor is Z_C = 1 / (j*ω*C). Multiplying numerator and denominator by j gives j / (j^2 * ω*C) = j / (-1 * ω*C) = -j / (ω*C).",
        remediationGuidance:
          "Review reactive impedances: Z_L = +j*ω*L and Z_C = -j / (ω*C).",
      },
    ],
  },

  // =========================================================================
  // 5. CIVIL ENGINEERING: STRUCTURAL ANALYSIS FUNDAMENTALS
  // =========================================================================
  {
    assessmentId: "civil-structural-fundamentals",
    title: "Structural Analysis: Bending Moments, Shear Forces & Deflection",
    description:
      "Tests civil and structural engineering competencies including shear force diagrams (SFD), bending moment diagrams (BMD), Euler buckling of columns, and limit state design concepts.",
    branchSlugs: ["civil", "struct", "env_eng"],
    disciplineCategory: "Engineering & Technology",
    compatibleDegrees: ["btech", "mtech", "diploma"],
    relevantRoleSlugs: ["structural-engineer", "site-engineer", "civil-design-engineer"],
    relevantSkills: ["Structural Analysis", "Reinforced Concrete", "AutoCAD", "Bending Moments"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Draw and compute maximum values on SFD and BMD for uniformly distributed loads (UDL).",
      "Calculate critical Euler buckling loads for columns under varied boundary end conditions.",
      "Understand the relationship between load w(x), shear V(x), and bending moment M(x).",
      "Differentiate between limit state of collapse and limit state of serviceability in reinforced concrete.",
    ],
    prerequisites: ["Mechanics of materials", "Equilibrium statics"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["civil-retaining-wall"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review the differential calculus governing beams: dV/dx = -w(x) and dM/dx = V(x). Peak moment occurs where shear force crosses zero.",
    questions: [
      {
        questionId: "civ-q1",
        type: "single_choice",
        prompt:
          "A simply supported beam of span L carries a uniformly distributed load (UDL) of intensity w over its entire length. What is the maximum bending moment occurring in the beam and where is it located?",
        options: [
          { optionId: "a", text: "(w * L^2) / 8 at midspan (x = L/2)" },
          { optionId: "b", text: "(w * L^2) / 4 at midspan (x = L/2)" },
          { optionId: "c", text: "(w * L) / 2 at the supports" },
          { optionId: "d", text: "(w * L^2) / 12 at x = L/4" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Shear Force and Bending Moment Diagrams",
        explanation:
          "For a simply supported beam with full UDL: Support reactions are RA = RB = w*L/2. Shear force is V(x) = w*L/2 - w*x, which crosses zero at x = L/2. Maximum bending moment M_max = (w*L/2)*(L/2) - w*(L/2)^2/2 = (w*L^2)/8.",
        remediationGuidance:
          "Review classic beam formulas for UDL and point loads in Ramamrutham Structural Analysis.",
      },
      {
        questionId: "civ-q2",
        type: "numeric",
        prompt:
          "An ideal pin-ended slender column has length L = 4.0 m and flexural rigidity EI = 800 kN·m². Using Euler's column formula (P_cr = π² * EI / L_eff²), calculate the critical buckling load P_cr in kN. (Use π = 3.1416, round to 1 decimal place)",
        correctAnswer: 493.5,
        tolerance: 3.0,
        unit: "kN",
        points: 25,
        topic: "Euler Column Buckling",
        explanation:
          "For both ends pinned (hinged), effective length L_eff = L = 4.0 m. Critical load P_cr = (π² * EI) / L² = (9.8696 * 800) / (4^2) = 7895.68 / 16 = 493.48 ≈ 493.5 kN.",
        remediationGuidance:
          "Review effective column length factors: pinned-pinned (1.0L), fixed-fixed (0.5L), fixed-free (2.0L), fixed-pinned (0.7L).",
      },
      {
        questionId: "civ-q3",
        type: "multiple_select",
        prompt:
          "Under Limit State Design (such as IS 456 or Eurocode 2), which of the following criteria belong to the Limit State of Serviceability (as opposed to Limit State of Collapse)? (Select all that apply)",
        options: [
          { optionId: "a", text: "Deflection limits to prevent damage to finishes or partitions" },
          { optionId: "b", text: "Crack width limitation for durability and corrosion resistance" },
          { optionId: "c", text: "Flexural tensile rupture of main reinforcing bars" },
          { optionId: "d", text: "Vibration control for human comfort" },
        ],
        correctAnswer: ["a", "b", "d"],
        points: 25,
        topic: "Limit State Design Philosophy",
        explanation:
          "Serviceability limit states govern day-to-day functionality, aesthetics, and user comfort (deflection, cracking, vibration). Flexural rupture, shear failure, and compression crushing are limit states of collapse (ultimate strength).",
        remediationGuidance:
          "Review IS 456 / Eurocode 2 definitions of Ultimate Limit State (ULS) vs Serviceability Limit State (SLS).",
      },
      {
        questionId: "civ-q4",
        type: "single_choice",
        prompt:
          "In soil mechanics, what does Rankine's earth pressure theory assume regarding the interface friction between the retaining wall and the backfill soil?",
        options: [
          { optionId: "a", text: "The wall back is perfectly smooth and vertical (wall friction angle δ = 0)." },
          { optionId: "b", text: "Wall friction angle δ is equal to the soil internal friction angle ϕ." },
          { optionId: "c", text: "The backfill is assumed to be an incompressible cohesive paste." },
          { optionId: "d", text: "The failure surface is always a logarithmic spiral." },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Lateral Earth Pressure & Retaining Walls",
        explanation:
          "Rankine's earth pressure theory assumes the back of the retaining wall is smooth (frictionless, δ = 0) and vertical, with horizontal backfill. Coulomb's theory accounts for wall roughness/friction.",
        remediationGuidance:
          "Compare Rankine and Coulomb lateral earth pressure assumptions in Arora Soil Mechanics.",
      },
    ],
  },

  // =========================================================================
  // 6. CHEMICAL ENGINEERING: MASS & ENERGY BALANCES
  // =========================================================================
  {
    assessmentId: "chem-mass-energy-balances",
    title: "Chemical Process Principles: Mass & Energy Balances",
    description:
      "Evaluates stoichiometry, continuous steady-state material balances, recycle and purge streams, degrees of freedom analysis, and sensible/latent heat calculations.",
    branchSlugs: ["chem_eng", "petro", "poly"],
    disciplineCategory: "Engineering & Technology",
    compatibleDegrees: ["btech", "mtech"],
    relevantRoleSlugs: ["process-engineer", "chemical-plant-engineer", "safety-engineer"],
    relevantSkills: ["Mass Balance", "Process Engineering", "Thermodynamics", "HAZOP"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Perform degree of freedom analysis on multi-unit chemical flowsheets.",
      "Calculate purge fractions and recycle stream flowrates to prevent inerts buildup.",
      "Apply the first law of thermodynamics to open steady-state process units (heaters, flashes).",
      "Calculate fractional conversion, yield, and selectivity in reactors.",
    ],
    prerequisites: ["General chemistry stoichiometry", "Calculus and algebra"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["chem-distillation-column"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review conservation equation: Accumulation = Input - Output + Generation - Consumption. At steady state, Accumulation = 0.",
    questions: [
      {
        questionId: "chem-q1",
        type: "numeric",
        prompt:
          "A continuous distillation column is fed with 1000 kg/h of an ethanol-water mixture containing 40 wt% ethanol. The distillate stream contains 90 wt% ethanol and the bottoms stream contains 5 wt% ethanol. Calculate the distillate product flowrate D in kg/h (round to nearest integer).",
        correctAnswer: 412,
        tolerance: 3.0,
        unit: "kg/h",
        points: 25,
        topic: "Steady-State Material Balances",
        explanation:
          "Total mass balance: F = D + B => 1000 = D + B => B = 1000 - D. Ethanol component balance: 0.40 * 1000 = 0.90 * D + 0.05 * B => 400 = 0.90 * D + 0.05 * (1000 - D) => 400 = 0.90*D + 50 - 0.05*D => 350 = 0.85*D => D = 350 / 0.85 = 411.76 ≈ 412 kg/h.",
        remediationGuidance:
          "Review non-reactive two-component distillation mass balance equations in Felder & Rousseau.",
      },
      {
        questionId: "chem-q2",
        type: "single_choice",
        prompt:
          "In a chemical process flowsheet with a recycle loop, why is a purge stream intentionally bled from the recycle line?",
        options: [
          {
            optionId: "a",
            text: "To prevent the progressive accumulation and buildup of non-reactive inert species in the system.",
          },
          {
            optionId: "b",
            text: "To increase the single-pass conversion of the main catalytic reactor to 100%.",
          },
          {
            optionId: "c",
            text: "To cool the reactor inlet stream without requiring a shell-and-tube heat exchanger.",
          },
          {
            optionId: "d",
            text: "To lower the overall system entropy below zero.",
          },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Recycle and Purge Streams",
        explanation:
          "If an inert or unreacted byproduct enters with the fresh feed and is recycled without exit, its concentration will accumulate infinitely at steady state. A purge stream provides a continuous discharge route for inerts.",
        remediationGuidance:
          "Review recycle, bypass, and purge stream material balances in Himmelblau.",
      },
      {
        questionId: "chem-q3",
        type: "multiple_select",
        prompt:
          "Which of the following are necessary conditions for an open thermodynamic system to operate under steady-state conditions? (Select all that apply)",
        options: [
          { optionId: "a", text: "All intensive and extensive properties at any fixed point remain invariant with time (d/dt = 0)." },
          { optionId: "b", text: "Total mass flow in equals total mass flow out (Σm_in = Σm_out)." },
          { optionId: "c", text: "The system must not exchange any heat with the surroundings." },
          { optionId: "d", text: "Total rate of energy in equals total rate of energy out (dE_sys/dt = 0)." },
        ],
        correctAnswer: ["a", "b", "d"],
        points: 25,
        topic: "First Law of Thermodynamics for Open Systems",
        explanation:
          "Steady-state implies d/dt = 0 for all properties inside control volumes, meaning mass and energy balance rates are closed (Σin = Σout). An open steady-state system can exchange heat (option C is adiabatic, not merely steady-state).",
        remediationGuidance:
          "Revisit control volume energy balances in Smith, Van Ness & Abbott.",
      },
      {
        questionId: "chem-q4",
        type: "single_choice",
        prompt:
          "In a reactor, reactant A is fed at 100 mol/s. The effluent stream contains 20 mol/s of unreacted A. What is the fractional conversion (X_A) of reactant A?",
        options: [
          { optionId: "a", text: "0.80 (80%)" },
          { optionId: "b", text: "0.20 (20%)" },
          { optionId: "c", text: "0.25 (25%)" },
          { optionId: "d", text: "0.50 (50%)" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Reactor Conversion and Yield",
        explanation:
          "Conversion X_A = (Moles of A reacted) / (Moles of A fed) = (100 - 20) / 100 = 80 / 100 = 0.80 or 80%.",
        remediationGuidance:
          "Review single-pass vs overall reactor conversion definitions in Fogler Chemical Reaction Engineering.",
      },
    ],
  },

  // =========================================================================
  // 7. BIOTECHNOLOGY: MOLECULAR BIOLOGY & RECOMBINANT DNA
  // =========================================================================
  {
    assessmentId: "bio-molecular-genetics",
    title: "Molecular Genetics, PCR & Recombinant DNA Technology",
    description:
      "Covers DNA replication enzymes, PCR cycle kinetics (denaturation, annealing, extension), restriction enzymes, plasmid cloning vectors, and agarose gel electrophoresis.",
    branchSlugs: ["biotech", "bioinfo", "genetics"],
    disciplineCategory: "Sciences & Biotechnology",
    compatibleDegrees: ["btech", "mtech", "bsc-gen", "msc-gen"],
    relevantRoleSlugs: ["biotechnologist", "bioinformatics-analyst", "clinical-researcher"],
    relevantSkills: ["Molecular Biology", "PCR", "Bioinformatics", "Assay Validation"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "objective_quiz",
    learningObjectives: [
      "Detail the temperature phases and enzymatic kinetics of polymerase chain reaction (PCR).",
      "Calculate theoretical DNA amplicon amplification yields after n cycles (2^n).",
      "Identify the role of selectable markers and multiple cloning sites (MCS) in plasmid cloning vectors.",
      "Interpret agarose gel migration patterns based on DNA fragment molecular weight and charge.",
    ],
    prerequisites: ["Central dogma of molecular biology", "Basic nucleic acid chemistry"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["bio-pcr-diagnostic"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review PCR primer melting temperature (Tm) calculation and standard thermal cycler profiles: 95°C denaturation, 55-60°C annealing, 72°C extension.",
    questions: [
      {
        questionId: "bio-q1",
        type: "numeric",
        prompt:
          "Assuming 100% amplification efficiency, starting with a single double-stranded DNA template molecule, how many theoretical copies of the target amplicon will be produced after 20 cycles of PCR? (Enter as integer: 2^20 = ?)",
        correctAnswer: 1048576,
        tolerance: 1000,
        unit: "copies",
        points: 25,
        topic: "PCR Kinetics & Amplification Yields",
        explanation:
          "In PCR, each cycle doubles the number of DNA copies: N = N0 * 2^n. For N0 = 1 and n = 20 cycles, N = 2^20 = 1,048,576 copies.",
        remediationGuidance:
          "Review exponential DNA amplification kinetics in Lodish Molecular Cell Biology.",
      },
      {
        questionId: "bio-q2",
        type: "single_choice",
        prompt:
          "What is the primary biological function of a thermostable DNA polymerase (such as Taq polymerase isolated from Thermus aquaticus) in PCR?",
        options: [
          {
            optionId: "a",
            text: "It withstands the repeated 95 °C DNA strand denaturation steps without becoming irreversibly denatured.",
          },
          {
            optionId: "b",
            text: "It acts as a restriction endonuclease to cleave foreign viral DNA.",
          },
          {
            optionId: "c",
            text: "It unwinds DNA without needing RNA primers.",
          },
          {
            optionId: "d",
            text: "It repairs thymine dimers caused by ultraviolet irradiation.",
          },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Thermostable Enzymes in Recombinant DNA",
        explanation:
          "Conventional DNA polymerases (e.g. E. coli DNA Pol I) denature at high temperatures, requiring enzyme replenishment every cycle. Taq polymerase remains functional through multiple cycles of 94-96 °C strand separation.",
        remediationGuidance:
          "Review the history and enzymatic characteristics of Taq and high-fidelity Pfu polymerases.",
      },
      {
        questionId: "bio-q3",
        type: "multiple_select",
        prompt:
          "Which of the following features are essential components of an engineered plasmid vector designed for gene cloning in bacterial hosts? (Select all that apply)",
        options: [
          { optionId: "a", text: "Origin of replication (ori) for autonomous replication inside host bacteria" },
          { optionId: "b", text: "Selectable antibiotic resistance marker (e.g. ampR, kanR) to select transformants" },
          { optionId: "c", text: "Multiple cloning site (MCS) containing unique restriction endonuclease recognition sites" },
          { optionId: "d", text: "Telomere sequences to prevent chromosome shortening in linear plasmids" },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "Plasmid Cloning Vectors",
        explanation:
          "Standard cloning plasmids require an ori, a selectable marker (e.g., ampicillin resistance), and an MCS. Telomeres are eukaryotic chromosomal end structures, not standard bacterial plasmid features.",
        remediationGuidance:
          "Review plasmid anatomy (pUC19, pBR322) in Brown Gene Cloning & DNA Analysis.",
      },
      {
        questionId: "bio-q4",
        type: "single_choice",
        prompt:
          "During agarose gel electrophoresis at neutral pH (pH 8.0), in which direction do nucleic acid fragments migrate and why?",
        options: [
          {
            optionId: "a",
            text: "Toward the positive anode (+), because the sugar-phosphate backbone carries a net negative charge.",
          },
          {
            optionId: "b",
            text: "Toward the negative cathode (-), because nitrogenous bases carry a strong positive charge.",
          },
          {
            optionId: "c",
            text: "They remain stationary unless driven by a magnetic gradient.",
          },
          {
            optionId: "d",
            text: "Toward the anode strictly driven by hydrogen bonding with agarose.",
          },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Gel Electrophoresis Separation Principles",
        explanation:
          "The repeating phosphate groups in the DNA backbone are deprotonated at neutral pH, imparting a uniform negative charge. DNA therefore migrates toward the positive anode (+), with smaller fragments moving faster through the porous agarose matrix.",
        remediationGuidance:
          "Review molecular sieving and charge-to-mass ratios in electrophoresis.",
      },
    ],
  },

  // =========================================================================
  // 8. BUSINESS / MBA: STRATEGIC BUSINESS ANALYSIS & UNIT ECONOMICS
  // =========================================================================
  {
    assessmentId: "mgmt-business-analysis",
    title: "Strategic Business Analysis: Competitive Moats & Unit Economics",
    description:
      "Evaluates core MBA competencies including Porter's Five Forces, CAC/LTV unit economics, DuPont return on equity, market sizing (TAM/SAM/SOM), and strategic decision matrices.",
    branchSlugs: ["mba", "bba", "mgmt"],
    disciplineCategory: "Business & Commerce",
    compatibleDegrees: ["mba", "bba", "mcom"],
    relevantRoleSlugs: ["business-analyst", "product-manager", "management-consultant"],
    relevantSkills: ["Business Strategy", "Market Research", "Financial Modeling", "Strategic Planning"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Evaluate customer acquisition cost (CAC) and customer lifetime value (LTV) sustainability.",
      "Apply Porter's Five Forces to assess industry pricing power and structural margins.",
      "Calculate total addressable market (TAM) using top-down and bottom-up approaches.",
      "Assess capital allocation trade-offs and competitive moats.",
    ],
    prerequisites: ["Introductory business strategy", "Basic financial arithmetic"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["mgmt-b2b-market-expansion"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review the SaaS rule of thumb LTV/CAC >= 3.0 and payback period <= 12 months for healthy scalable unit economics.",
    questions: [
      {
        questionId: "mgmt-q1",
        type: "numeric",
        prompt:
          "A subscription B2B software company spends $120,000 on sales and marketing in Q1 and acquires 40 new enterprise customers. The average customer pays $6,000 annually with an 80% gross margin and an expected annual churn rate of 10% (average lifetime = 1 / churn = 10 years). Calculate the company's LTV-to-CAC ratio (LTV / CAC) as a decimal.",
        correctAnswer: 16.0,
        tolerance: 0.5,
        unit: "ratio",
        points: 25,
        topic: "Unit Economics & Customer Acquisition",
        explanation:
          "CAC = Total S&M Spend / New Customers = $120,000 / 40 = $3,000. Customer Lifetime Value (LTV) = (Annual Revenue * Gross Margin) * Lifetime = ($6,000 * 0.80) * 10 years = $4,800 * 10 = $48,000. LTV / CAC = $48,000 / $3,000 = 16.0.",
        remediationGuidance:
          "Review CAC = Total Acquisition Spend / Acquired Users and LTV = (ARPU * Gross Margin) / Churn.",
      },
      {
        questionId: "mgmt-q2",
        type: "multiple_select",
        prompt:
          "According to Michael Porter's Five Forces framework, which of the following market conditions significantly intensify competitive rivalry and erode industry profitability? (Select all that apply)",
        options: [
          { optionId: "a", text: "Slow industry growth rate leading to market share battles" },
          { optionId: "b", text: "High fixed or storage costs causing price discounting to fill capacity" },
          { optionId: "c", text: "High customer switching costs between competing vendor products" },
          { optionId: "d", text: "High exit barriers (e.g. specialized assets, regulatory liquidation hurdles)" },
        ],
        correctAnswer: ["a", "b", "d"],
        points: 25,
        topic: "Porter's Five Forces & Industry Structure",
        explanation:
          "Options A, B, and D heighten competitive rivalry (slow growth forces zero-sum fights, high fixed costs trigger price cuts, high exit barriers keep excess supply locked in). High switching costs (C) defend incumbents and reduce rivalry.",
        remediationGuidance:
          "Study Porter's 'Competitive Strategy' Chapter 1 on structural determinants of rivalry.",
      },
      {
        questionId: "mgmt-q3",
        type: "single_choice",
        prompt:
          "In competitive strategy, what type of economic moat is exemplified when the addition of each new user directly enhances the utility and value of the service for all other existing participants?",
        options: [
          { optionId: "a", text: "Direct two-sided network effects" },
          { optionId: "b", text: "Patent exclusivity monopoly" },
          { optionId: "c", text: "Lowest-cost raw material supply access" },
          { optionId: "d", text: "Regulatory tariff barrier" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Competitive Moats & Network Effects",
        explanation:
          "Network effects occur when a platform's value proposition expands with scale (e.g. communication protocols, credit card networks, marketplaces), creating formidable defensibility against new entrants.",
        remediationGuidance:
          "Review Hamilton Helmer's '7 Powers: The Foundations of Business Strategy'.",
      },
      {
        questionId: "mgmt-q4",
        type: "case_study_response",
        prompt:
          "A consumer electronics manufacturer with high market share in smart speakers decides to expand into subscription home security monitoring. Identify two strategic synergies and one operational risk associated with this horizontal diversification strategy.",
        correctAnswer: "installed base, hardware integration, brand trust, subscription churn, liability risk",
        points: 25,
        topic: "Corporate Diversification Strategy",
        explanation:
          "Synergies: Leveraging the large installed base of hardware users, cross-selling existing brand trust, and ecosystem lock-in. Operational risks: High regulatory liabilities for emergency response failures, customer churn in recurring subscriptions, and support overhead.",
        remediationGuidance:
          "Study core competence transfer and risk profiles in corporate expansion.",
        rubricCriteria: [
          "Identifies customer base or distribution channel synergies.",
          "Cites technical ecosystem integration advantages.",
          "Notes operational, regulatory, or margin execution risks.",
        ],
      },
    ],
  },

  // =========================================================================
  // 9. B.COM / FINANCE: FINANCIAL ACCOUNTING & VALUATION
  // =========================================================================
  {
    assessmentId: "fin-accounting-fundamentals",
    title: "Financial Accounting, Statements Analysis & Valuation",
    description:
      "Tests core accounting and corporate finance competencies: three-statement linkages, working capital cycles, discounted cash flow (DCF) modeling, and DuPont analysis.",
    branchSlugs: ["bcom", "mcom", "fin_tech", "mba"],
    disciplineCategory: "Business & Commerce",
    compatibleDegrees: ["bcom", "mcom", "bba", "mba"],
    relevantRoleSlugs: ["financial-analyst", "equity-research-analyst", "investment-banker"],
    relevantSkills: ["Accounting", "Financial Modeling", "Valuation", "Equity Research"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Trace changes in depreciation across the income statement, balance sheet, and cash flow statement.",
      "Compute free cash flow to firm (FCFF) and discount using Weighted Average Cost of Capital (WACC).",
      "Decompose return on equity (ROE) using DuPont 3-factor analysis.",
      "Calculate net working capital (NWC) and cash conversion cycles.",
    ],
    prerequisites: ["Double-entry bookkeeping", "Time value of money principles"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["fin-equity-research-report"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Remember the three-statement linkage: Net income flows into retained earnings on the balance sheet and begins the operating cash flow section.",
    questions: [
      {
        questionId: "fin-q1",
        type: "single_choice",
        prompt:
          "If a company experiences a $100 increase in non-cash depreciation expense in a year with a corporate tax rate of 25%, what is the net impact on the company's ending cash balance on the cash flow statement?",
        options: [
          { optionId: "a", text: "Cash increases by $25 (depreciation tax shield)." },
          { optionId: "b", text: "Cash decreases by $100." },
          { optionId: "c", text: "Cash decreases by $75." },
          { optionId: "d", text: "Cash is unchanged because depreciation is a non-cash expense." },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Three-Statement Financial Statement Linkages",
        explanation:
          "Income statement: Pre-tax income decreases by $100, saving $25 in taxes. Net income falls by $75. Cash flow statement: Net income starts at -$75, and the full $100 non-cash depreciation is added back in CFO: -$75 + $100 = +$25 net cash increase.",
        remediationGuidance:
          "Practice the 3-statement walk for non-cash expenses and working capital adjustments.",
      },
      {
        questionId: "fin-q2",
        type: "numeric",
        prompt:
          "A business has equity with a market value of $600M and debt with a market value of $400M (Total capital = $1,000M). The cost of equity is Re = 12%, the pre-tax cost of debt is Rd = 6%, and the corporate tax rate is T = 25%. Calculate the company's Weighted Average Cost of Capital (WACC) as a percentage (enter as e.g. 9.0).",
        correctAnswer: 9.0,
        tolerance: 0.1,
        unit: "%",
        points: 25,
        topic: "Weighted Average Cost of Capital (WACC)",
        explanation:
          "Weight of equity We = 600/1000 = 0.60. Weight of debt Wd = 400/1000 = 0.40. After-tax cost of debt = Rd * (1 - T) = 6% * (1 - 0.25) = 4.5%. WACC = (We * Re) + (Wd * After-tax Rd) = (0.60 * 12%) + (0.40 * 4.5%) = 7.2% + 1.8% = 9.0%.",
        remediationGuidance:
          "Review WACC formula: WACC = (E/V * Re) + (D/V * Rd * (1 - T)).",
      },
      {
        questionId: "fin-q3",
        type: "multiple_select",
        prompt:
          "In the classic 3-factor DuPont decomposition, Return on Equity (ROE = Net Income / Equity) is broken down into which of the following three components? (Select all that apply)",
        options: [
          { optionId: "a", text: "Net Profit Margin (Net Income / Revenue) — Operational efficiency" },
          { optionId: "b", text: "Asset Turnover (Revenue / Total Assets) — Asset use efficiency" },
          { optionId: "c", text: "Financial Leverage / Equity Multiplier (Total Assets / Equity)" },
          { optionId: "d", text: "Dividend Payout Ratio (Dividends / Net Income)" },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "DuPont Analysis & Performance Ratios",
        explanation:
          "3-factor DuPont: ROE = (Net Income / Sales) * (Sales / Assets) * (Assets / Equity) = Profit Margin * Asset Turnover * Equity Multiplier. Payout ratio governs dividend distribution, not the standard DuPont decomposition.",
        remediationGuidance:
          "Review DuPont ratio decomposition in Brigham & Ehrhardt Financial Management.",
      },
      {
        questionId: "fin-q4",
        type: "single_choice",
        prompt:
          "What is Free Cash Flow to Firm (FCFF) and why is it preferred over Net Income for discounted cash flow valuation?",
        options: [
          {
            optionId: "a",
            text: "It represents cash generated by core operations available to all capital providers after funding necessary capital expenditures and working capital.",
          },
          {
            optionId: "b",
            text: "It includes proceeds from new equity share issuances and debt borrowings.",
          },
          {
            optionId: "c",
            text: "It is identical to gross margin and ignores operating expenses.",
          },
          {
            optionId: "d",
            text: "It reflects net income without deducting income tax payments.",
          },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "DCF Valuation & Cash Flow Modeling",
        explanation:
          "Net Income includes non-cash items and ignores reinvestment needs (CapEx and change in NWC). FCFF = NOPAT + D&A - CapEx - ΔNWC reflects actual discretionary cash flow produced by the enterprise.",
        remediationGuidance:
          "Study Damodaran's Investment Valuation methodologies for FCFF vs FCFE.",
      },
    ],
  },

  // =========================================================================
  // 10. ARTS / HUMANITIES: CRITICAL REASONING & RESEARCH METHODOLOGY
  // =========================================================================
  {
    assessmentId: "arts-critical-reasoning",
    title: "Critical Reasoning, Historiography & Research Methodology",
    description:
      "Assesses qualitative research methodologies: primary vs secondary source critique, logical fallacies, qualitative coding, ethical citation, and historiographical synthesis.",
    branchSlugs: ["history", "english", "journalism", "pol_sci", "sociology"],
    disciplineCategory: "Arts & Humanities",
    compatibleDegrees: ["ba", "ma"],
    relevantRoleSlugs: ["content-strategist", "research-analyst", "communications-manager"],
    relevantSkills: ["Historical Research", "Critical Analysis", "Digital Humanities", "Content Strategy"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Distinguish between primary archival sources and secondary interpretive historiography.",
      "Identify formal and informal logical fallacies in rhetorical arguments.",
      "Evaluate research credibility, provenance, and archival bias.",
      "Apply academic citation ethics and contextual analysis.",
    ],
    prerequisites: ["Critical reading comprehension", "Basic argumentative essay structure"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["arts-digital-heritage-archive"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review the difference between internal and external criticism of historical documents and avoid anachronistic bias.",
    questions: [
      {
        questionId: "arts-q1",
        type: "single_choice",
        prompt:
          "Which of the following documents represents a primary source for historical research on the 1918 influenza pandemic?",
        options: [
          { optionId: "a", text: "An unedited diary entry written in October 1918 by a practicing field nurse in Boston." },
          { optionId: "b", text: "A 2018 peer-reviewed medical history monograph analyzing public health responses." },
          { optionId: "c", text: "An encyclopedia entry summarizing the pandemic's death toll." },
          { optionId: "d", text: "A 2020 documentary film incorporating actor reenactments." },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Primary vs Secondary Historical Evidence",
        explanation:
          "A primary source is an artifact or firsthand testimony created during the historical period under study. The 1918 nurse's diary is contemporary eyewitness documentation. Monograms, encyclopedias, and modern films are secondary or tertiary interpretations.",
        remediationGuidance:
          "Review historical methodology: archival evidence vs secondary analysis.",
      },
      {
        questionId: "arts-q2",
        type: "multiple_select",
        prompt:
          "Which of the following rhetorical scenarios illustrate the 'Straw Man' logical fallacy? (Select all that apply)",
        options: [
          {
            optionId: "a",
            text: "Distorting an opponent's complex thesis into an absurd, oversimplified caricature and then refuting that caricature.",
          },
          {
            optionId: "b",
            text: "Attacking an author's personal character or background rather than engaging with their empirical claims (Ad Hominem).",
          },
          {
            optionId: "c",
            text: "Fabricating an extreme version of a policy proposal to make it appear ridiculous to an audience.",
          },
          {
            optionId: "d",
            text: "Assuming that because event B followed event A, event A must have caused event B (Post hoc ergo propter hoc).",
          },
        ],
        correctAnswer: ["a", "c"],
        points: 25,
        topic: "Logical Fallacies and Argumentation",
        explanation:
          "The straw man fallacy involves misrepresenting or exaggerating an opponent's argument to make it easier to knock down (A and C). Option B is Ad Hominem and D is Post hoc causal fallacy.",
        remediationGuidance:
          "Review standard fallacies in informal logic (Weston, A Rulebook for Arguments).",
      },
      {
        questionId: "arts-q3",
        type: "single_choice",
        prompt:
          "What is 'historiography' in academic humanities scholarship?",
        options: [
          { optionId: "a", text: "The study of historical methodology and the evolving interpretations of past events by historians over time." },
          { optionId: "b", text: "The mechanical transcription of ancient handwriting." },
          { optionId: "c", text: "The geological dating of archaeological strata." },
          { optionId: "d", text: "The memorization of chronological king lists." },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Historiographical Methodology",
        explanation:
          "Historiography examines how history has been written, how historical interpretations shift across eras, and the theoretical frameworks historians employ.",
        remediationGuidance:
          "Review Carr's 'What is History?' and introductory historiography texts.",
      },
      {
        questionId: "arts-q4",
        type: "case_study_response",
        prompt:
          "When digitizing sensitive oral histories from marginalized communities, what ethical practices should researchers observe regarding informed consent and archival access?",
        correctAnswer: "informed consent, community ownership, cultural sensitivity, access control, pseudonymity",
        points: 25,
        topic: "Ethics in Oral History and Digital Humanities",
        explanation:
          "Key ethics include: informed dynamic consent, respecting interviewee agency regarding public vs restricted access, protecting vulnerable participants through pseudonymity if requested, avoiding extractive research, and acknowledging community ownership.",
        remediationGuidance:
          "Consult the Oral History Association (OHA) Principles and Best Practices.",
        rubricCriteria: [
          "Identifies informed consent and participant agency.",
          "Addresses access restrictions or confidentiality where appropriate.",
          "Considers community ownership and ethical stewardship.",
        ],
      },
    ],
  },

  // =========================================================================
  // 11. NURSING / ALLIED HEALTH: CLINICAL PHARMACOLOGY & EVIDENCE-BASED CARE
  // =========================================================================
  {
    assessmentId: "health-clinical-pharmacology",
    title: "Clinical Pharmacology, Dosage Calculations & Evidence-Based Care",
    description:
      "Educational nursing case evaluation covering safe medication dosage calculations, SBAR clinical handover protocol, vitals assessment, and postoperative sepsis recognition.",
    branchSlugs: ["nursing", "physio", "pharm", "allied_health"],
    disciplineCategory: "Healthcare & Allied Health",
    compatibleDegrees: ["bsc-nur", "msc-nur", "bpharm"],
    relevantRoleSlugs: ["clinical-nurse", "nursing-educator", "healthcare-analyst"],
    relevantSkills: ["Clinical Assessment", "Pharmacology & Drug Administration", "Patient Safety", "Evidence-Based Practice"],
    difficulty: "Intermediate",
    estimatedDuration: "20 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Calculate intravenous (IV) infusion drip rates and weight-based pediatric dosages accurately.",
      "Recognize the early signs of clinical deterioration and systemic inflammatory response (SIRS / Sepsis).",
      "Format clear interprofessional clinical handovers using SBAR.",
      "Demonstrate safe medication administration rights and allergy verification.",
    ],
    prerequisites: ["Anatomy and physiology", "Basic nursing arithmetic"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["health-clinical-case-study"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Educational review: Verify the 5 Rights of medication administration (Right Patient, Drug, Dose, Route, Time) and calculate IV drip rates using: (Total Volume in mL * Drop Factor) / Time in minutes.",
    questions: [
      {
        questionId: "health-q1",
        type: "numeric",
        prompt:
          "A physician orders 1,000 mL of 0.9% Normal Saline IV to infuse over 8 hours. The infusion tubing drop factor is 15 drops/mL (gtt/mL). Calculate the required IV flow rate in drops per minute (gtt/min). Round to the nearest whole drop.",
        correctAnswer: 31,
        tolerance: 1.0,
        unit: "gtt/min",
        points: 25,
        topic: "IV Medication Dosage Calculations",
        explanation:
          "Formula: Flow rate (gtt/min) = (Total Volume in mL * Drop Factor in gtt/mL) / Time in minutes. Time = 8 hours * 60 min = 480 min. Flow rate = (1000 mL * 15 gtt/mL) / 480 min = 15,000 / 480 = 31.25 ≈ 31 gtt/min.",
        remediationGuidance:
          "Practice standard dimensional analysis for IV gravity infusion calculations.",
      },
      {
        questionId: "health-q2",
        type: "single_choice",
        prompt:
          "What does the acronym SBAR represent in standardized clinical communication during patient handovers?",
        options: [
          { optionId: "a", text: "Situation, Background, Assessment, Recommendation" },
          { optionId: "b", text: "Symptoms, Baseline, Action, Recovery" },
          { optionId: "c", text: "Standard, Bedside, Airway, Resuscitation" },
          { optionId: "d", text: "Safety, Blood pressure, Allergies, Referral" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Standardized Clinical Handover (SBAR)",
        explanation:
          "SBAR is the established World Health Organization / Joint Commission healthcare framework: Situation (what is happening now), Background (relevant medical history), Assessment (clinical evaluation findings), Recommendation (suggested immediate action).",
        remediationGuidance:
          "Review SBAR handover structure in patient safety literature.",
      },
      {
        questionId: "health-q3",
        type: "multiple_select",
        prompt:
          "In an educational case study of a postoperative patient, which of the following vital signs and clinical findings would alert the healthcare team to potential systemic infection (Sepsis)? (Select all that apply)",
        options: [
          { optionId: "a", text: "Core body temperature > 38.3 °C (101.0 °F) or hypothermia < 36.0 °C" },
          { optionId: "b", text: "Tachypnea with respiratory rate > 22 breaths per minute" },
          { optionId: "c", text: "Tachycardia with heart rate > 90 beats per minute" },
          { optionId: "d", text: "Normal serum lactate level < 1.0 mmol/L" },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "Early Recognition of Clinical Sepsis",
        explanation:
          "Fever or hypothermia, tachypnea (RR > 20-22), and tachycardia (HR > 90) are classic SIRS and qSOFA sepsis criteria. Normal lactate (D) indicates absence of severe tissue hypoperfusion.",
        remediationGuidance:
          "Review Surviving Sepsis Campaign educational guidelines and qSOFA screening.",
      },
      {
        questionId: "health-q4",
        type: "single_choice",
        prompt:
          "Before administering an intravenous cephalosporin antibiotic, which critical nursing safety check must always be completed first?",
        options: [
          { optionId: "a", text: "Verify the patient's known allergy history, especially looking for previous severe penicillin hypersensitivity." },
          { optionId: "b", text: "Instruct the patient to remain NPO (nothing by mouth) for 12 hours." },
          { optionId: "c", text: "Perform a lumbar puncture." },
          { optionId: "d", text: "Obtain a 12-lead ECG prior to every single antibiotic dose." },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Medication Safety & Cross-Reactivity",
        explanation:
          "Cephalosporins share a beta-lactam ring with penicillins. Patients with anaphylactic penicillin reactions have a known cross-reactivity risk. Confirming allergies is mandatory before administration.",
        remediationGuidance:
          "Review beta-lactam cross-reactivity and medication administration rights.",
      },
    ],
  },

  // =========================================================================
  // 12. CSE / IT: SOFTWARE ARCHITECTURE & SYSTEM DESIGN
  // =========================================================================
  {
    assessmentId: "cse-software-architecture",
    title: "Software Engineering: Microservices Architecture & System Design",
    description:
      "Evaluates computer science principles including CAP theorem, horizontal scalability, distributed caching strategies, database normalization vs denormalization, and API idempotency.",
    branchSlugs: ["cse", "it", "aiml", "aids", "se"],
    disciplineCategory: "Computing & Software",
    compatibleDegrees: ["btech", "mtech", "bca-gen", "mca-gen"],
    relevantRoleSlugs: ["full-stack-developer", "backend-engineer", "cloud-architect"],
    relevantSkills: ["System Design", "Node.js", "Microservices", "Docker"],
    difficulty: "Intermediate",
    estimatedDuration: "25 mins",
    assessmentType: "mixed",
    learningObjectives: [
      "Apply the CAP theorem to trade off consistency vs availability in partitioned networks.",
      "Design idempotent HTTP REST APIs using request idempotency keys.",
      "Select appropriate caching patterns (Cache-Aside, Write-Through, Write-Behind).",
      "Evaluate horizontal scaling vs vertical scaling bottlenecks in distributed architectures.",
    ],
    prerequisites: ["Data structures and algorithms", "Web protocols (HTTP/TCP)", "Database basics"],
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    recommendedProjectIds: ["cse-microservices-ecommerce"],
    version: 1,
    status: "published",
    explanationAndRemediation:
      "Review distributed system patterns: CAP theorem (pick 2 under partition), Redis caching topologies, and event-driven architectures with message brokers (Kafka/RabbitMQ).",
    questions: [
      {
        questionId: "cse-q1",
        type: "single_choice",
        prompt:
          "According to Eric Brewer's CAP theorem, during an inevitable network partition (P) between distributed database replicas, what trade-off must the system architecture choose between?",
        options: [
          { optionId: "a", text: "Consistency (C) versus Availability (A)" },
          { optionId: "b", text: "Cost (C) versus Accuracy (A)" },
          { optionId: "c", text: "Concurrency (C) versus Authentication (A)" },
          { optionId: "d", text: "Caching (C) versus Asynchrony (A)" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "CAP Theorem in Distributed Systems",
        explanation:
          "In a distributed system, network partitions (P) are unavoidable. When a partition occurs, the system can either return an error/timeout to ensure all reads are consistent (CP), or serve potentially stale data to remain available (AP).",
        remediationGuidance:
          "Review Kleppmann's 'Designing Data-Intensive Applications' Chapter 9 on consistency and consensus.",
      },
      {
        questionId: "cse-q2",
        type: "multiple_select",
        prompt:
          "Which of the following HTTP request methods are specified as idempotent by the RFC 7231 / RFC 9110 HTTP standard? (Select all that apply)",
        options: [
          { optionId: "a", text: "GET" },
          { optionId: "b", text: "PUT" },
          { optionId: "c", text: "DELETE" },
          { optionId: "d", text: "POST" },
        ],
        correctAnswer: ["a", "b", "c"],
        points: 25,
        topic: "REST API Design & Idempotency",
        explanation:
          "An HTTP method is idempotent if the intended effect on the server of multiple identical requests is the same as for a single request. GET, PUT, and DELETE are idempotent. POST is inherently non-idempotent (repeated POST requests typically create duplicate resources).",
        remediationGuidance:
          "Consult RFC 7231 Section 4.2.2 regarding idempotent methods.",
      },
      {
        questionId: "cse-q3",
        type: "single_choice",
        prompt:
          "In a high-throughput microservices architecture, what caching strategy reads from the cache first, loads from the database on a cache miss, and writes the fetched data back to the cache for subsequent calls?",
        options: [
          { optionId: "a", text: "Cache-Aside (Lazy Loading)" },
          { optionId: "b", text: "Write-Behind (Write-Back)" },
          { optionId: "c", text: "Read-Through only" },
          { optionId: "d", text: "Zero-copy caching" },
        ],
        correctAnswer: "a",
        points: 25,
        topic: "Distributed Caching Topologies",
        explanation:
          "In Cache-Aside, the application code coordinates caching directly: it queries the cache first; on a miss, queries the database, writes the result to cache with a TTL, and returns it to the caller.",
        remediationGuidance:
          "Compare Cache-Aside, Read-Through, Write-Through, and Write-Behind patterns.",
      },
      {
        questionId: "cse-q4",
        type: "case_study_response",
        prompt:
          "A monolithic e-commerce application experiences severe database write lock contention during peak flash sales. Propose two architectural decoupling patterns to isolate order placement writes from real-time inventory and catalog reads.",
        correctAnswer: "message queue, event-driven, cqrs, read replica, kafka, rabbitmq",
        points: 25,
        topic: "Distributed System Decoupling",
        explanation:
          "Effective patterns include: (1) Asynchronous message queue (e.g. RabbitMQ/Kafka) buffering incoming orders to smooth write spikes, (2) CQRS (Command Query Responsibility Segregation) separating the write model from read-optimized replicas/caches, and (3) Read replicas offloading catalog and search queries.",
        remediationGuidance:
          "Study CQRS and message-driven queuing architectures in enterprise software design.",
        rubricCriteria: [
          "Recommends message queues or event-driven async buffers.",
          "Suggests CQRS or separate read/write data stores.",
          "Explains how decoupling prevents database lock contention.",
        ],
      },
    ],
  },
];
