# Recommendations Module — Adaptive Recommendation & Learning Content Matching

> **Skill-Gap-Driven Learning Content, Curated Tasks & Documentation Catalogs**

---

## 1. Overview & Capabilities

The **Recommendations Module** synthesizes skill gap outputs and career aspirations to generate high-yield learning recommendations, hands-on engineering tasks, and curated documentation links.

### Core Capabilities:
- **Gap-Driven Recommendation Engine**: Connects directly with `gaps` and `skills` modules to recommend content mapped strictly to identified deficit areas.
- **Curated Documentation Catalog (`catalog/documentationCatalog.js`)**: Authoritative, peer-reviewed official technical documentation (e.g. MDN Web Docs, React Docs, Node.js Docs, Docker Docs) indexed by topic.
- **Hands-on Task Mapping (`catalog/taskMapping.js`)**: Curated coding assignments and real-world micro-projects that reinforce theoretical concepts through hands-on implementation.
- **Personalized Learning Feed**: Feeds dynamic recommendations into EduTube and the main learner dashboard.

---

## 2. Directory Structure

```
backend/src/modules/recommendations/
├── catalog/
│   ├── documentationCatalog.js    # Curated official technical documentation links
│   └── taskMapping.js             # Practical implementation challenges per skill
├── controllers/
│   └── recommendations.controller.js # HTTP route handlers
├── routes/
│   └── recommendations.routes.js  # Express router: /api/v1/recommendations/*
└── services/
    └── recommendation.service.js  # Gap matching logic & personalized feed generator
```

---

## 3. API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/recommendations` | Get personalized recommendations based on active skill gaps. | Required |
| `GET` | `/api/v1/recommendations/docs` | Browse official documentation catalog filtered by technology. | Optional |
| `GET` | `/api/v1/recommendations/tasks` | Fetch practical task suggestions for specific skills. | Required |
