# Learning Roadmap Frontend Module — Interactive Milestones & Learning Paths

> **Dynamic Skill Trees, Visual Milestone Tracking & Resource-Mapped Learning Paths**

---

## 1. Overview & Capabilities

The **Learning Roadmap Frontend Module** renders visual, step-by-step career path roadmaps generated to bridge identified technical deficits.

### Key Capabilities:
- **Sequential Learning Stages**: Breaks broad career goals (e.g. Senior Backend Engineer) into logical phases (Fundamentals $\to$ Architecture $\to$ Production Operations).
- **Interactive Milestones**: Checkbox progress tracking with completion percentages and celebration states.
- **Resource Linking**: Directly connects roadmap milestones to EduTube educational lectures, documentation links, and coding challenges.

---

## 2. Directory Structure

```
frontend/src/modules/roadmap/
├── components/
│   ├── MilestoneNode.tsx           # Individual roadmap checkpoint with status badge
│   ├── PhaseContainer.tsx          # Grouped thematic phase with progress bar
│   └── ResourceLinks.tsx           # Contextual links to EduTube videos & exercises
├── pages/
│   └── LearningRoadmapPage.tsx     # Main route: /dashboard/roadmap
├── services/
│   └── roadmap.api.ts              # API client for roadmap generation & progress updates
└── types/
    └── roadmap.types.ts            # Roadmap schemas, milestones & phase contracts
```
