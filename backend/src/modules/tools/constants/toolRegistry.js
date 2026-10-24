/**
 * Canonical Academic Tools Registry for Smart Skill Hub (Phase 50)
 *
 * Defines specialized, discipline-aware tools across all 10 academic discipline families:
 * 1. CSE / IT
 * 2. Mechanical Engineering
 * 3. ECE / EEE
 * 4. Civil Engineering
 * 5. Chemical Engineering
 * 6. Biotechnology & Life Sciences
 * 7. Business & Management
 * 8. Commerce & Finance
 * 9. Arts, Media & Humanities
 * 10. Nursing & Allied Health
 * 11. Shared Cross-Disciplinary Reviewer
 */

export const CANONICAL_TOOL_REGISTRY = [
  // =========================================================================
  // 1. COMPUTER SCIENCE & IT (Reused Core Systems)
  // =========================================================================
  {
    toolId: "cse-resume-ai",
    displayName: "Resume AI Studio",
    shortDescription: "AI-assisted resume authoring, section tailoring, ATS scoring, and PDF compilation.",
    academicDiscipline: "Computer Science & IT",
    disciplineCategory: "Computer Science & IT",
    branchSlugs: ["cse", "it", "csbs", "ai-ds", "bca-gen", "mca-gen", "bsc-cs-gen", "bsc-it-gen"],
    category: "Career & Coding",
    intendedTask: "Author and optimize professional software and technical resumes with automated ATS keyword scoring.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/resumes",
    isExternalRoute: true,
    supportedInputs: [
      { name: "jobDescription", type: "string", description: "Target job description for keyword alignment", required: false },
      { name: "experienceItems", type: "array", description: "Bullet points describing technical contributions", required: true },
    ],
    outputFormat: "structured_resume_pdf",
    safetyDisclaimers: null,
    limitations: ["Requires user-provided project and work experience data."],
    version: "2.1.0",
  },
  {
    toolId: "cse-coding-platform",
    displayName: "Interactive Coding Sandbox",
    shortDescription: "Practice algorithm challenges and automated test-case evaluation across multiple languages.",
    academicDiscipline: "Computer Science & IT",
    disciplineCategory: "Computer Science & IT",
    branchSlugs: ["cse", "it", "csbs", "ai-ds", "bca-gen", "mca-gen"],
    category: "Career & Coding",
    intendedTask: "Solve data structures and algorithmic challenges with automated test evaluation.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/coding",
    isExternalRoute: true,
    supportedInputs: [
      { name: "solutionCode", type: "string", description: "Source code solution", required: true },
      { name: "language", type: "string", description: "Programming language (JavaScript, Python, C++)", required: true },
    ],
    outputFormat: "test_suite_execution_report",
    safetyDisclaimers: "Staging operates with CODING_EXECUTION_ENABLED=false fail-closed security.",
    limitations: ["Host container sandbox execution is constrained by server safety policies."],
    version: "2.0.0",
  },
  {
    toolId: "cse-github-reviewer",
    displayName: "GitHub Intelligence Reviewer",
    shortDescription: "Repository architecture inspection, code quality scoring, and career readiness insights.",
    academicDiscipline: "Computer Science & IT",
    disciplineCategory: "Computer Science & IT",
    branchSlugs: ["cse", "it", "csbs", "ai-ds", "bca-gen", "mca-gen"],
    category: "Career & Coding",
    intendedTask: "Evaluate GitHub repository documentation, commit consistency, and architectural maturity.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/github",
    isExternalRoute: true,
    supportedInputs: [
      { name: "repositoryUrl", type: "string", description: "Public GitHub repository URL", required: true },
    ],
    outputFormat: "repository_quality_audit",
    safetyDisclaimers: null,
    limitations: ["Requires OAuth connection or public repository accessibility."],
    version: "2.1.0",
  },

  // =========================================================================
  // 2. MECHANICAL ENGINEERING
  // =========================================================================
  {
    toolId: "mech-calc",
    displayName: "Mechanical Engineering Calculation & Design Review Assistant",
    shortDescription: "Deterministic stress-strain, factor-of-safety, gear-train ratios, and beam bending calculations with design review checklists.",
    academicDiscipline: "Mechanical Engineering",
    disciplineCategory: "Mechanical Engineering",
    branchSlugs: ["mech", "aero", "auto", "ipe", "robotics", "diploma-mech"],
    category: "Engineering Calculations",
    intendedTask: "Perform verified mechanical strength, safety factor, and transmission ratio calculations with engineering assumptions.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/mech-calc",
    isExternalRoute: false,
    supportedInputs: [
      { name: "calculationType", type: "select", description: "Calculation mode: stress_strain, factor_of_safety, gear_ratio, beam_bending", required: true },
      { name: "forceN", type: "number", description: "Applied axial load in Newtons (N)", required: false, unit: "N" },
      { name: "areaMm2", type: "number", description: "Cross-sectional area in square millimeters (mm²)", required: false, unit: "mm²" },
      { name: "yieldStrengthMpa", type: "number", description: "Material yield strength in MPa", required: false, unit: "MPa" },
      { name: "appliedStressMpa", type: "number", description: "Maximum applied or working stress in MPa", required: false, unit: "MPa" },
      { name: "teethDriving", type: "number", description: "Number of teeth on driving gear (N1)", required: false },
      { name: "teethDriven", type: "number", description: "Number of teeth on driven gear (N2)", required: false },
      { name: "inputRpm", type: "number", description: "Input angular velocity in RPM", required: false, unit: "RPM" },
      { name: "inputTorqueNm", type: "number", description: "Input torque in Newton-meters (Nm)", required: false, unit: "Nm" },
      { name: "efficiencyPercent", type: "number", description: "Gearbox transmission efficiency (%)", required: false, unit: "%" },
    ],
    outputFormat: "structured_engineering_calculation_report",
    safetyDisclaimers: "EDUCATIONAL CALCULATION ONLY: Does NOT replace professional mechanical design certification, finite element validation, or stamping by a licensed Professional Engineer (PE).",
    limitations: ["Assumes isotropic, homogeneous linear-elastic material behavior."],
    version: "1.0.0",
  },

  // =========================================================================
  // 3. ECE & EEE (ELECTRONICS & ELECTRICAL)
  // =========================================================================
  {
    toolId: "ece-circuits",
    displayName: "Circuit Analysis Learning Studio",
    shortDescription: "Educational DC circuit solver supporting series/parallel equivalents, voltage/current dividers, Ohm's law, and Thévenin equivalents.",
    academicDiscipline: "ECE & EEE",
    disciplineCategory: "ECE & EEE",
    branchSlugs: ["ece", "eee", "eie", "robotics", "diploma-ece", "diploma-eee"],
    category: "Circuit Analysis",
    intendedTask: "Solve DC circuit network properties, equivalent resistances, voltage drops, and branch currents with step-by-step reasoning.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/ece-circuits",
    isExternalRoute: false,
    supportedInputs: [
      { name: "analysisType", type: "select", description: "Analysis mode: series_parallel, voltage_divider, current_divider, thevenin_equivalent", required: true },
      { name: "sourceVoltageV", type: "number", description: "Source DC voltage in Volts (V)", required: false, unit: "V" },
      { name: "resistors", type: "string", description: "Comma-separated resistor values in Ohms (Ω)", required: true, unit: "Ω" },
      { name: "networkTopology", type: "select", description: "series or parallel for equivalent resistance", required: false },
      { name: "loadResistance", type: "number", description: "Load resistor RL in Ohms (Ω) for Thévenin calculations", required: false, unit: "Ω" },
    ],
    outputFormat: "circuit_step_by_step_analysis",
    safetyDisclaimers: "EDUCATIONAL DC CIRCUIT MODEL: Does not model high-frequency RF parasitics, transient harmonics, or high-voltage arc-flash protective tripping.",
    limitations: ["Limited to ideal lumped-parameter linear DC resistive networks."],
    version: "1.0.0",
  },

  // =========================================================================
  // 4. CIVIL ENGINEERING
  // =========================================================================
  {
    toolId: "civil-boq",
    displayName: "Quantity Estimation & BOQ Assistant",
    shortDescription: "Educational concrete volume estimation, mix batch proportions (cement, sand, aggregate), dry volume factors, and editable BOQ worksheets.",
    academicDiscipline: "Civil Engineering",
    disciplineCategory: "Civil Engineering",
    branchSlugs: ["civil", "diploma-civil"],
    category: "Estimating & BOQ",
    intendedTask: "Calculate structural concrete volumes, material component weights, and generate exportable Bill of Quantities (BOQ) cost summaries.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/civil-boq",
    isExternalRoute: false,
    supportedInputs: [
      { name: "estimationType", type: "select", description: "Structure element: concrete_slab, isolated_footing, rcc_beam", required: true },
      { name: "lengthM", type: "number", description: "Length dimension in meters (m)", required: true, unit: "m" },
      { name: "widthM", type: "number", description: "Width / Breadth dimension in meters (m)", required: true, unit: "m" },
      { name: "thicknessM", type: "number", description: "Thickness / Depth dimension in meters (m)", required: true, unit: "m" },
      { name: "mixRatio", type: "select", description: "Nominal concrete mix (1:1.5:3 M20, 1:2:4 M15, 1:1:2 M25)", required: true },
      { name: "dryVolumeFactor", type: "number", description: "Dry volume conversion factor (standard 1.54)", required: false, unit: "ratio" },
      { name: "wastagePercent", type: "number", description: "Material wastage allowance (%)", required: false, unit: "%" },
      { name: "unitRateCementBag", type: "number", description: "Estimated cost per 50kg cement bag", required: false, unit: "currency" },
      { name: "unitRateSandM3", type: "number", description: "Estimated cost per m³ of river/M-sand", required: false, unit: "currency" },
      { name: "unitRateAggregateM3", type: "number", description: "Estimated cost per m³ of coarse aggregate", required: false, unit: "currency" },
    ],
    outputFormat: "bill_of_quantities_table",
    safetyDisclaimers: "EDUCATIONAL ESTIMATION ONLY: Does not represent guaranteed vendor pricing or certified construction bidding schedules.",
    limitations: ["Nominal volumetric batching assumptions; actual high-rise work requires laboratory mix design trials."],
    version: "1.0.0",
  },

  // =========================================================================
  // 5. CHEMICAL ENGINEERING
  // =========================================================================
  {
    toolId: "chem-process",
    displayName: "Chemical Process Calculation Studio",
    shortDescription: "Steady-state overall & component mass balances, binary distillation recoveries, and idealized CSTR reaction kinetics.",
    academicDiscipline: "Chemical Engineering",
    disciplineCategory: "Chemical Engineering",
    branchSlugs: ["chem"],
    category: "Process Modeling",
    intendedTask: "Solve chemical material balances, distillation splits, and continuous reactor sizing with conservation checks.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/chem-process",
    isExternalRoute: false,
    supportedInputs: [
      { name: "calculationType", type: "select", description: "Mode: binary_distillation_balance, mass_balance_mixer, ideal_cstr_kinetics", required: true },
      { name: "feedRateKgH", type: "number", description: "Total feed mass flow rate in kg/h", required: true, unit: "kg/h" },
      { name: "feedCompositionX", type: "number", description: "Light component mass fraction in feed (0.0 to 1.0)", required: true, unit: "mass fraction" },
      { name: "distillateCompositionX", type: "number", description: "Desired light component mass fraction in distillate (0.0 to 1.0)", required: false, unit: "mass fraction" },
      { name: "bottomsCompositionX", type: "number", description: "Light component mass fraction in bottoms (0.0 to 1.0)", required: false, unit: "mass fraction" },
      { name: "targetConversion", type: "number", description: "Fractional conversion XA (0.0 to 1.0) for reactor", required: false, unit: "fraction" },
      { name: "reactionRateConstant", type: "number", description: "First-order reaction rate constant k (min⁻¹)", required: false, unit: "min⁻¹" },
    ],
    outputFormat: "process_simulation_report",
    safetyDisclaimers: "EDUCATIONAL PROCESS MODEL: Assumes idealized steady-state conditions; does not model runaway reactions or provide operational plant control.",
    limitations: ["Idealized solutions and binary mixtures only."],
    version: "1.0.0",
  },

  // =========================================================================
  // 6. BIOTECHNOLOGY & LIFE SCIENCES
  // =========================================================================
  {
    toolId: "biotech-research",
    displayName: "Biotechnology Research & Sequence Assistant",
    shortDescription: "DNA sequence GC% & melting temperature calculations, experimental hypothesis structuring, and protocol review.",
    academicDiscipline: "Biotechnology",
    disciplineCategory: "Biotechnology",
    branchSlugs: ["biotech"],
    category: "Research & Data Analysis",
    intendedTask: "Calculate oligonucleotide GC content, Wallace melting temperature, and structure scientific research hypotheses.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/tools/biotech-research",
    isExternalRoute: false,
    supportedInputs: [
      { name: "analysisType", type: "select", description: "Task: dna_gc_melting, research_hypothesis_organizer, experiment_protocol_review", required: true },
      { name: "sequenceString", type: "string", description: "DNA nucleotide sequence (A, C, G, T)", required: false, placeholder: "e.g., ATGCGATCGATCGATCGATCG" },
      { name: "researchQuestion", type: "string", description: "Core biological inquiry or research objective", required: false },
      { name: "independentVariable", type: "string", description: "Manipulated experimental variable (e.g. substrate concentration)", required: false },
      { name: "dependentVariable", type: "string", description: "Measured biological outcome (e.g. optical density, enzymatic rate)", required: false },
    ],
    outputFormat: "biotechnology_analytical_report",
    safetyDisclaimers: "RESEARCH EDUCATION ONLY: Not for clinical diagnostic use, therapeutic guidance, or medical pathology interpretation.",
    limitations: ["Wallace Rule melting temperature formula is optimized for oligonucleotides 14-25 nt in length."],
    version: "1.0.0",
  },

  // =========================================================================
  // 7. BUSINESS & MBA
  // =========================================================================
  {
    toolId: "business-kpi",
    displayName: "Business Case & Unit Economics Analyzer",
    shortDescription: "Deterministic break-even analysis, margin of safety %, Customer Acquisition Cost (CAC) & Lifetime Value (LTV), and SWOT structuring.",
    academicDiscipline: "Business & Management",
    disciplineCategory: "Business & Management",
    branchSlugs: ["mba", "bba"],
    category: "Case Study & Strategy",
    intendedTask: "Model business unit economics, break-even unit volumes, CAC/LTV ratios, and strategic framework matrices.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/tools/business-kpi",
    isExternalRoute: false,
    supportedInputs: [
      { name: "analysisType", type: "select", description: "Mode: breakeven_margin_of_safety, cac_ltv_unit_economics, swot_structuring", required: true },
      { name: "fixedCosts", type: "number", description: "Total periodic fixed costs in currency units", required: false, unit: "currency" },
      { name: "unitSellingPrice", type: "number", description: "Selling price per unit", required: false, unit: "currency" },
      { name: "unitVariableCost", type: "number", description: "Variable cost per unit", required: false, unit: "currency" },
      { name: "currentSalesUnits", type: "number", description: "Current or projected sales volume in units", required: false, unit: "units" },
      { name: "marketingSpend", type: "number", description: "Total sales & marketing campaign spend", required: false, unit: "currency" },
      { name: "customersAcquired", type: "number", description: "Total new paying customers acquired", required: false, unit: "customers" },
      { name: "averageOrderValue", type: "number", description: "Average revenue generated per purchase", required: false, unit: "currency" },
      { name: "purchaseFrequency", type: "number", description: "Purchases per customer per year", required: false, unit: "frequency" },
      { name: "customerLifespanYears", type: "number", description: "Estimated customer retention lifespan in years", required: false, unit: "years" },
      { name: "caseText", type: "string", description: "Business case text or strategic scenario for SWOT extraction", required: false },
    ],
    outputFormat: "business_kpi_dashboard_report",
    safetyDisclaimers: "ACADEMIC BUSINESS MODEL: Numerical outcomes are deterministic projections based strictly on user-supplied assumptions.",
    limitations: ["Does not substitute for audited corporate financial statements or SEC/regulatory filings."],
    version: "1.0.0",
  },

  // =========================================================================
  // 8. COMMERCE & FINANCE
  // =========================================================================
  {
    toolId: "finance-accounting",
    displayName: "Financial Statement & Accounting Practice Studio",
    shortDescription: "Deterministic liquidity ratios (Current/Quick), profitability metrics (Gross/Net Margin, ROE), and 3-period NPV cash flow models.",
    academicDiscipline: "Commerce & Finance",
    disciplineCategory: "Commerce & Finance",
    branchSlugs: ["bcom", "mcom", "finance"],
    category: "Accounting & Finance",
    intendedTask: "Analyze corporate balance sheet liquidity, evaluate profitability ratios, and compute discounted Net Present Value.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/finance-accounting",
    isExternalRoute: false,
    supportedInputs: [
      { name: "analysisType", type: "select", description: "Mode: liquidity_ratios, profitability_ratios, three_period_npv", required: true },
      { name: "currentAssets", type: "number", description: "Total current assets", required: false, unit: "currency" },
      { name: "currentLiabilities", type: "number", description: "Total current liabilities", required: false, unit: "currency" },
      { name: "inventory", type: "number", description: "Inventory value", required: false, unit: "currency" },
      { name: "revenue", type: "number", description: "Total operating revenue / sales", required: false, unit: "currency" },
      { name: "grossProfit", type: "number", description: "Gross profit (Revenue - COGS)", required: false, unit: "currency" },
      { name: "netIncome", type: "number", description: "Net income after tax", required: false, unit: "currency" },
      { name: "totalEquity", type: "number", description: "Total shareholder equity", required: false, unit: "currency" },
      { name: "totalDebt", type: "number", description: "Total short- and long-term debt", required: false, unit: "currency" },
      { name: "initialOutlay", type: "number", description: "Initial capital expenditure (Period 0)", required: false, unit: "currency" },
      { name: "cashFlows", type: "string", description: "Comma-separated future annual cash flows (e.g. 50000, 60000, 70000)", required: false, unit: "currency" },
      { name: "discountRatePercent", type: "number", description: "Annual cost of capital / hurdle rate (%)", required: false, unit: "%" },
    ],
    outputFormat: "financial_ratio_and_valuation_sheet",
    safetyDisclaimers: "FINANCIAL LEARNING TOOL: Does NOT constitute licensed investment advisory, tax planning, or statutory financial auditing.",
    limitations: ["DCF calculations assume constant annual discount rates."],
    version: "1.0.0",
  },

  // =========================================================================
  // 9. ARTS & HUMANITIES
  // =========================================================================
  {
    toolId: "arts-writing",
    displayName: "Research Writing & Critical Analysis Studio",
    shortDescription: "Structured argument thesis evaluation, primary/secondary source criticism, and deterministic bibliographic citation formatting (APA, MLA, Chicago).",
    academicDiscipline: "Arts & Humanities",
    disciplineCategory: "Arts & Humanities",
    branchSlugs: ["ba-gen", "ma-gen"],
    category: "Academic Writing",
    intendedTask: "Structure academic essay arguments, detect rhetorical fallacies, and format academic citations.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/tools/arts-writing",
    isExternalRoute: false,
    supportedInputs: [
      { name: "analysisType", type: "select", description: "Mode: argument_thesis_structure, source_criticism, citation_formatter", required: true },
      { name: "draftText", type: "string", description: "Student draft paragraph or essay excerpt", required: false },
      { name: "thesisStatement", type: "string", description: "Primary argumentative claim", required: false },
      { name: "citationStyle", type: "select", description: "Style: APA 7th, MLA 9th, Chicago 17th", required: false },
      { name: "author", type: "string", description: "Source author(s) (e.g. Smith, John)", required: false },
      { name: "title", type: "string", description: "Article or book title", required: false },
      { name: "year", type: "string", description: "Publication year", required: false },
      { name: "publisher", type: "string", description: "Publisher or academic journal name", required: false },
      { name: "volume", type: "string", description: "Volume and issue number", required: false },
      { name: "pages", type: "string", description: "Page range (e.g. 45-62)", required: false },
      { name: "doiOrUrl", type: "string", description: "DOI or stable repository URL", required: false },
    ],
    outputFormat: "academic_writing_audit_and_citation",
    safetyDisclaimers: "ACADEMIC WRITING ASSISTANT: Citations are formatted strictly from user-provided bibliographic data. The system never fabricates citations or quotes.",
    limitations: ["Citation accuracy depends on user-entered metadata fields."],
    version: "1.0.0",
  },

  // =========================================================================
  // 10. NURSING & ALLIED HEALTH
  // =========================================================================
  {
    toolId: "nursing-study",
    displayName: "Clinical Study & Dosage Arithmetic Assistant",
    shortDescription: "Verified pediatric/adult medication dosage arithmetic, structured SBAR clinical handover generation, and triage practice scenarios.",
    academicDiscipline: "Nursing & Allied Health",
    disciplineCategory: "Nursing & Allied Health",
    branchSlugs: ["nursing-gen", "allied-health-gen"],
    category: "Clinical Practice",
    intendedTask: "Practice clinical dosage calculations and structure formal SBAR patient handovers with clear unit checking.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/nursing-study",
    isExternalRoute: false,
    supportedInputs: [
      { name: "studyType", type: "select", description: "Mode: pediatric_dosage_calc, sbar_handover_builder", required: true },
      { name: "patientWeightKg", type: "number", description: "Patient weight in kilograms (kg)", required: false, unit: "kg" },
      { name: "prescribedDosePerKg", type: "number", description: "Prescribed dosage rate per kg (e.g. 15 mg/kg)", required: false, unit: "mg/kg" },
      { name: "medicationConcentrationMgPerMl", type: "number", description: "Stock solution concentration in mg/mL", required: false, unit: "mg/mL" },
      { name: "dosesPerDay", type: "number", description: "Dosing frequency (e.g. 3 for q8h)", required: false },
      { name: "situation", type: "string", description: "SBAR Situation: Patient identity and acute problem", required: false },
      { name: "background", type: "string", description: "SBAR Background: Relevant history and admission diagnosis", required: false },
      { name: "assessment", type: "string", description: "SBAR Assessment: Current vitals and clinical status", required: false },
      { name: "recommendation", type: "string", description: "SBAR Recommendation: Required nursing intervention or orders", required: false },
    ],
    outputFormat: "clinical_study_worksheet",
    safetyDisclaimers: "CRITICAL CLINICAL NOTICE: FOR EDUCATIONAL PRACTICE ONLY. Must NOT be used for live patient dosing, actual clinical triage, or prescribing. Does not substitute for institutional hospital protocols or licensed nursing verification.",
    limitations: ["Idealized single-compartment arithmetic; does not account for renal/hepatic clearance adjustments."],
    version: "1.0.0",
  },

  // =========================================================================
  // 11. CROSS-DISCIPLINARY / SHARED PROJECT REVIEWER
  // =========================================================================
  {
    toolId: "report-reviewer",
    displayName: "Shared Project & Report Reviewer",
    shortDescription: "Structured multi-branch review for technical reports, lab writeups, capstone proposals, business cases, and research drafts.",
    academicDiscipline: "Cross-Disciplinary / Shared",
    disciplineCategory: "Cross-Disciplinary / Shared",
    branchSlugs: ["all"],
    category: "Project & Report Review",
    intendedTask: "Produce a structured, objective evaluation of student project reports, identifying strengths, evidence gaps, technical questions, and actionable improvements.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/tools/report-reviewer",
    isExternalRoute: false,
    supportedInputs: [
      { name: "reportType", type: "select", description: "Document type: technical_report, lab_report, capstone_proposal, business_case, research_paper", required: true },
      { name: "academicDiscipline", type: "select", description: "Discipline context (CSE, Mech, ECE, Civil, Chem, Biotech, MBA, Finance, Arts, Nursing)", required: true },
      { name: "title", type: "string", description: "Document title or project headline", required: true },
      { name: "abstractOrSummary", type: "string", description: "Executive summary or abstract text", required: false },
      { name: "reportText", type: "string", description: "Full report content or main body paragraphs", required: true },
    ],
    outputFormat: "structured_report_review",
    safetyDisclaimers: "FORMATIVE ACADEMIC REVIEW: Feedback provides structural, logical, and evidence suggestions. It does not certify empirical laboratory results or replace faculty grading.",
    limitations: ["Evaluates submitted text only; cannot independently replicate external physical experiments."],
    version: "1.0.0",
  },
];

export const TOOL_REGISTRY_MAP = new Map(
  CANONICAL_TOOL_REGISTRY.map((tool) => [tool.toolId, tool])
);
