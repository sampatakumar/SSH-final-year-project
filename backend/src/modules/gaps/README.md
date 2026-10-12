# Skill Gap Analysis Module — Role Benchmarking & Gap Matrix Engine

> **Industry Role Benchmarks, Readiness Score Calculation & Targeted Skill Gap Diagnostics**

---

## 1. Overview & Capabilities

The **Skill Gap Analysis Module** compares a learner's verified competency profile against curated industry career archetypes. It identifies critical missing skills, computes a mathematical readiness percentage, and produces an actionable priority matrix for career progression.

### Core Capabilities:
- **Curated Role Benchmarks (`benchmarks/roleRequirements.js`)**: Defines tier-weighted skill requirements for target roles:
  - Full Stack Engineer (MERN, TypeScript, SQL, Docker, CI/CD, Testing)
  - Backend Systems Engineer (Node.js/Go, Distributed Systems, Redis, Database Optimization, Microservices)
  - Frontend Architect (React, TypeScript, Next.js, Web Performance, State Architecture, Tailwind)
  - DevOps / Cloud Infrastructure (Docker, Kubernetes, AWS/GCP, Terraform, Monitoring, Linux)
  - AI & Machine Learning Engineer (Python, PyTorch, Vector DBs, Prompt Engineering, Model Deployment)
- **Mathematical Readiness Formulation**: Calculates normalized fit scores factoring in must-have core skills vs nice-to-have auxiliary skills.
- **Priority Gap Matrix**: Ranks missing skills by industry demand, career impact, and estimated learning time.

---

## 2. Gap Calculation Formula

For a given target role $R$ and learner skill profile $P$:
$$\text{ReadinessScore}(P, R) = \frac{\sum_{s \in R_{\text{required}}} w_s \cdot \min(1, \frac{P(s)}{R_{\text{target}}(s)})}{\sum_{s \in R_{\text{required}}} w_s} \times 100$$
Where:
- $w_s$ is the importance weight of skill $s$ (e.g. 1.5 for core languages, 1.0 for frameworks, 0.7 for tooling).
- $P(s)$ is the learner's current proficiency in skill $s$.
- $R_{\text{target}}(s)$ is the expected benchmark proficiency for the role.

---

## 3. Directory Structure

```
backend/src/modules/gaps/
├── benchmarks/
│   └── roleRequirements.js         # Curated skill requirements per role archetype
├── controllers/
│   └── gaps.controller.js          # HTTP handlers for gap analysis and benchmarks
├── models/
│   └── (Integrates with skills and profile models)
├── routes/
│   └── gaps.routes.js              # Express router: /api/v1/gaps/*
└── services/
    └── skillGap.service.js         # Gap matrix calculation & role readiness engine
```

---

## 4. API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/gaps/roles` | List all available career role benchmarks and required competencies. | Optional |
| `GET` | `/api/v1/gaps/analysis?role=full_stack` | Compute gap analysis comparing user profile against specified role. | Required |
| `GET` | `/api/v1/gaps/summary` | Retrieve high-level readiness summary across all supported roles. | Required |
