# Resume & Portfolio Frontend Module — Live A4 Editor & Portfolio Showcase

> **Interactive Document Preview, ATS Optimization Drawer & One-Click Cloudflare Deployment**

---

## 1. Overview & Capabilities

The **Resume & Portfolio Frontend Module** provides an interactive document workspace for creating, formatting, and previewing ATS-optimized technical resumes and developer portfolios.

### Key Capabilities:
- **Interactive A4 Document Canvas**: High-fidelity live preview rendered to exact A4 printing dimensions with configurable margins, typography, and accent colors.
- **ATS Tailoring Drawer**: Compares the user's resume text against target job descriptions in real-time, highlighting missing keywords and suggesting high-impact bullet improvements.
- **Portfolio Showcase Manager**: Allows selection and reordering of showcased projects, links, and biographies for web portfolio compilation.
- **Cloudflare One-Click Deploy**: Triggers automated portfolio generation and displays live deployment status and Cloudflare Pages URL.

---

## 2. Directory Structure

```
frontend/src/modules/resume/
├── components/
│   ├── A4ResumePreview.tsx         # Pixel-perfect live A4 resume preview canvas
│   ├── ATSTailoringDrawer.tsx      # Job description keyword optimizer panel
│   ├── PortfolioCustomizer.tsx     # Static portfolio theme and section selector
│   ├── ProjectCardEditor.tsx       # Portfolio project showcase manager
│   └── SectionEditors.tsx          # Form inputs for experience, skills, and education
├── pages/
│   ├── ResumeBuilderPage.tsx       # Main route: /dashboard/resume
│   └── PortfolioManagementPage.tsx # Portfolio configuration route
├── services/
│   └── resume.api.ts               # API client for resume parsing, tailoring & deploy
└── types/
    └── resume.types.ts             # Resume schemas, ATS scores & portfolio configs
```
