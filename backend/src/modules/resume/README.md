# Resume & Portfolio Module — Document Extraction, ATS Tailoring & Cloudflare Portfolio Deployment

> **Multi-Format Resume Parser, ATS Keyword Optimizer, Static Portfolio Generator & Cloudflare Publishing**

---

## 1. Overview & Capabilities

The **Resume & Portfolio Module** automates career asset engineering. It ingests existing resumes in multiple document formats, parses them into structured JSON, optimizes them for Applicant Tracking Systems (ATS), and compiles verified skills and projects into deployable web portfolios.

### Core Capabilities:
- **Multi-Format Resume Ingestion**:
  - PDF text extraction via `pdf-parse`.
  - Word document parsing via `mammoth` (DOCX).
  - Raw plain text ingestion (TXT).
  - Optical Character Recognition (OCR) for scanned documents via `tesseract.js`.
- **ATS Tailoring & Keyword Matching**: Analyzes resumes against target job descriptions using Groq LLaMA models to suggest quantifiable bullet points and industry keywords.
- **Static Portfolio Builder**: Compiles user projects, GitHub evidence, and biography into responsive HTML/CSS/JS bundles.
- **Direct Cloudflare Pages Publishing**: Automatically uploads compiled portfolio assets to Cloudflare Pages via direct REST API integration, provisioning a live public domain (e.g. `https://<username>.pages.dev`).

---

## 2. Directory Structure

```
backend/src/modules/resume/
├── adapters/
│   └── resumeEvidenceAdapter.js   # Adapts parsed resume skills into canonical skill format
├── controllers/
│   ├── ai.controller.js           # Groq AI resume tailoring & bullet point optimizer
│   ├── portfolio.controller.js    # Portfolio generation & Cloudflare deployment
│   ├── project.controller.js      # Portfolio project showcases CRUD
│   └── resume.controller.js       # File upload & document parsing handlers
├── models/
│   ├── portfolio.models.js        # Portfolio configuration & deployment status
│   ├── project.models.js          # Showcase project schemas & media links
│   └── resume.models.js           # Structured parsed resume data model
├── routes/
│   ├── ai.routes.js               # /api/v1/resume/ai/*
│   ├── portfolio.routes.js        # /api/v1/resume/portfolio/*
│   ├── project.routes.js          # /api/v1/resume/projects/*
│   └── resume.routes.js           # /api/v1/resume/*
└── services/
    ├── deployToCloudflare.service.js # Cloudflare Pages direct upload API client
    ├── generatePortfolio.service.js # HTML/CSS portfolio template compilation
    ├── groq.service.js            # Groq LLaMA integration for resume tailoring
    ├── langchain-tailor.service.js# LangChain extraction chains & prompt orchestrator
    └── resume-extraction.service.js # Multi-format document parser (PDF/DOCX/OCR)
```

---

## 3. API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/resume/upload` | Upload and parse resume file (PDF, DOCX, TXT, Image). | Required |
| `GET` | `/api/v1/resume/profile` | Retrieve parsed resume structure and sections. | Required |
| `PUT` | `/api/v1/resume/profile` | Update resume sections (experience, education, skills). | Required |
| `POST` | `/api/v1/resume/ai/tailor` | Optimize resume content against a job description. | Required |
| `POST` | `/api/v1/resume/portfolio/generate`| Generate static portfolio HTML bundle. | Required |
| `POST` | `/api/v1/resume/portfolio/deploy`  | Deploy compiled portfolio to Cloudflare Pages. | Required |
| `GET` | `/api/v1/resume/projects` | List showcase projects for portfolio. | Required |
