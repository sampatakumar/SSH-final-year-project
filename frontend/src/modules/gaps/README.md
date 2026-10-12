# Skill Gap Frontend Module — Role Benchmarking & Diagnostics Dashboard

> **Interactive Radar Charts, Role Comparison Pickers & Actionable Gap Prioritization**

---

## 1. Overview & Capabilities

The **Skill Gap Frontend Module** visualizes where a developer stands in relation to industry career benchmarks.

### Key Capabilities:
- **Role Benchmark Selector**: Interactive tabs to toggle target roles (Full Stack, Backend, Frontend, DevOps, AI Engineer).
- **Competency Radar Chart**: Recharts radar visualization displaying actual user proficiency plotted against target role expectations.
- **Priority Action Items**: Clear diagnostic cards showing top missing skills with estimated study hours and direct action links to EduTube video courses.

---

## 2. Directory Structure

```
frontend/src/modules/gaps/
├── components/
│   ├── ActionItemCard.tsx          # Actionable card linking to learning resources
│   ├── GapPriorityList.tsx         # Sorted list of missing skills by severity
│   ├── ReadinessScoreBadge.tsx     # Large numerical & percentage fit indicator
│   ├── RoleSelectorTabs.tsx        # Career role toggle buttons
│   └── SkillRadarChart.tsx         # Recharts radar plot of user vs benchmark
├── pages/
│   └── SkillGapPage.tsx            # Main route: /dashboard/gaps
├── services/
│   └── gaps.api.ts                 # API client for role benchmarks and gap calculations
└── types/
    └── gaps.types.ts               # Role benchmark models & gap analysis responses
```
