/**
 * Branch Capability Registry for Smart Skill Hub.
 *
 * Associating supported learning and assessment capabilities with academic branches
 * without scattering hardcoded branch checks throughout the codebase.
 *
 * Strict Status Model:
 * 1. AVAILABLE: Implemented and usable right now.
 * 2. UNAVAILABLE_CONFIG: Implemented in code, but inactive in current deployment/configuration.
 * 3. PLANNED: Cataloged for a future specialized feature phase.
 * 4. UNSUPPORTED: Outside the relevant methodology for this discipline.
 */

export const CAPABILITY_KEYS = {
  CODING_PRACTICE: "coding_practice",
  GITHUB_ANALYSIS: "github_analysis",
  CAD_PORTFOLIO: "cad_portfolio",
  CIRCUIT_EXERCISES: "circuit_exercises",
  EMBEDDED_SYSTEMS_PRACTICE: "embedded_systems_practice",
  ENGINEERING_SIMULATION: "engineering_simulation",
  RESEARCH_PORTFOLIO: "research_portfolio",
  BUSINESS_CASE_STUDIES: "business_case_studies",
  FINANCIAL_ANALYSIS: "financial_analysis",
  HEALTHCARE_LEARNING_ASSESSMENT: "healthcare_learning_assessment",
};

export const CAPABILITY_STATUS = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE_CONFIG: "UNAVAILABLE_CONFIG",
  PLANNED: "PLANNED",
  UNSUPPORTED: "UNSUPPORTED",
};

export const CAPABILITY_DEFINITIONS = {
  [CAPABILITY_KEYS.CODING_PRACTICE]: {
    key: CAPABILITY_KEYS.CODING_PRACTICE,
    label: "Coding Practice & Algorithmic Sandbox",
    description: "Multi-language programming assessment and sandbox unit test execution.",
    isImplemented: true,
  },
  [CAPABILITY_KEYS.GITHUB_ANALYSIS]: {
    key: CAPABILITY_KEYS.GITHUB_ANALYSIS,
    label: "GitHub Repository & Version Control Analysis",
    description: "Empirical code commit analysis, repository documentation, and commit history audits.",
    isImplemented: true,
  },
  [CAPABILITY_KEYS.CAD_PORTFOLIO]: {
    key: CAPABILITY_KEYS.CAD_PORTFOLIO,
    label: "CAD & 3D Engineering Design Portfolio",
    description: "SolidWorks, AutoCAD, and parametric modeling portfolio integration.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: {
    key: CAPABILITY_KEYS.CIRCUIT_EXERCISES,
    label: "Circuit Simulation & PCB Verification",
    description: "Analog/digital circuit analysis, SPICE simulation, and PCB schematic reviews.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: {
    key: CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE,
    label: "Embedded Systems & Firmware Simulation",
    description: "Microcontroller emulation, RTOS tasks, and hardware peripheral drivers.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: {
    key: CAPABILITY_KEYS.ENGINEERING_SIMULATION,
    label: "Engineering Simulation (FEA / CFD / Grid)",
    description: "Finite element analysis, computational fluid dynamics, and grid load-flow modeling.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: {
    key: CAPABILITY_KEYS.RESEARCH_PORTFOLIO,
    label: "Academic Research & Publication Portfolio",
    description: "Peer-reviewed paper showcases, preprint citations, and research methodology tracking.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: {
    key: CAPABILITY_KEYS.BUSINESS_CASE_STUDIES,
    label: "Business Case Studies & Strategy Analysis",
    description: "Harvard/Ivey style case analyses, market sizing, and operational strategy simulations.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: {
    key: CAPABILITY_KEYS.FINANCIAL_ANALYSIS,
    label: "Financial Modeling & Valuation Workbooks",
    description: "DCF valuations, 3-statement spreadsheet models, and corporate financial planning.",
    isImplemented: false,
  },
  [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: {
    key: CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT,
    label: "Clinical Patient Care & Diagnostic Cases",
    description: "Interactive clinical triage scenarios, pharmacotherapy dosage cases, and patient vitals evaluation.",
    isImplemented: false,
  },
};

/**
 * Maps academic branch discipline families to explicit capability statuses.
 */
export function getBranchCapabilities(branchSlug) {
  const clean = (branchSlug || "").toLowerCase().trim();

  // 1. Computing & Software Engineering tracks
  if (
    ["cse", "it", "aiml", "aids", "ds", "ise", "bca-gen", "mca-gen", "bsc-cs-gen", "bsc-it-gen", "diploma-cse"].includes(
      clean
    )
  ) {
    return {
      branchSlug: clean,
      disciplineFamily: "Computing & Software",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: clean === "cse" ? CAPABILITY_STATUS.PLANNED : CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
      },
    };
  }

  // 2. Electronics & Electrical Engineering tracks
  if (["ece", "eee", "eie", "diploma-ece", "diploma-eee"].includes(clean)) {
    return {
      branchSlug: clean,
      disciplineFamily: "Electronics & Electrical",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE, // C/C++ algorithms available
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
      },
    };
  }

  // 3. Mechanical, Civil, Industrial, Aero, Robotics
  if (
    ["mech", "civil", "ipe", "aero", "auto", "robotics", "chem", "diploma-mech", "diploma-civil"].includes(clean)
  ) {
    return {
      branchSlug: clean,
      disciplineFamily: "Mechanical, Civil & Industrial",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE, // Scripting/algorithms optional
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: clean === "robotics" ? CAPABILITY_STATUS.PLANNED : CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: clean === "robotics" ? CAPABILITY_STATUS.PLANNED : CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: clean === "ipe" ? CAPABILITY_STATUS.PLANNED : CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
      },
    };
  }

  // 4. Biotechnology & Life Sciences
  if (["biotech"].includes(clean)) {
    return {
      branchSlug: clean,
      disciplineFamily: "Biotechnology & Life Sciences",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE, // BioPython, R algorithms
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.PLANNED,
      },
    };
  }

  // 5. Commerce, Management & Business (BBA, MBA, B.Com, M.Com)
  if (["bba-gen", "mba-gen", "bcom-gen", "mcom-gen"].includes(clean)) {
    return {
      branchSlug: clean,
      disciplineFamily: "Commerce & Management",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE, // SQL / Data analytics optional
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
      },
    };
  }

  // 6. Healthcare & Clinical Sciences (Nursing, Allied Health)
  if (["nursing-gen", "allied-health-gen"].includes(clean)) {
    return {
      branchSlug: clean,
      disciplineFamily: "Healthcare & Life Sciences",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.PLANNED,
      },
    };
  }

  // 7. Arts, Media & Humanities (BA, MA)
  if (["ba-gen", "ma-gen"].includes(clean)) {
    return {
      branchSlug: clean,
      disciplineFamily: "Arts & Humanities",
      capabilities: {
        [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.PLANNED,
        [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
        [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
      },
    };
  }

  // 8. General / Unconfigured / Other
  return {
    branchSlug: clean || "unknown",
    disciplineFamily: "General / Interdisciplinary",
    capabilities: {
      [CAPABILITY_KEYS.CODING_PRACTICE]: CAPABILITY_STATUS.AVAILABLE,
      [CAPABILITY_KEYS.GITHUB_ANALYSIS]: CAPABILITY_STATUS.AVAILABLE,
      [CAPABILITY_KEYS.CAD_PORTFOLIO]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.CIRCUIT_EXERCISES]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.EMBEDDED_SYSTEMS_PRACTICE]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.ENGINEERING_SIMULATION]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.RESEARCH_PORTFOLIO]: CAPABILITY_STATUS.PLANNED,
      [CAPABILITY_KEYS.BUSINESS_CASE_STUDIES]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.FINANCIAL_ANALYSIS]: CAPABILITY_STATUS.UNSUPPORTED,
      [CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]: CAPABILITY_STATUS.UNSUPPORTED,
    },
  };
}
