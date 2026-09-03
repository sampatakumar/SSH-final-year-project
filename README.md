# Smart Skill Hub (SSH) 🚀

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Modern%20UI-38BDF8?logo=tailwindcss&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black) ![Groq AI](https://img.shields.io/badge/Groq-AI-111111) ![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?logo=docker&logoColor=white)

**Smart Skill Hub (SSH)** is a next-generation career acceleration and skill-intelligence platform. It unifies resume building, ATS job-description tailoring, GitHub repository intelligence, interactive sandboxed coding assessments, EduTube video learning recommendations, dynamic skill taxonomy, and AI-driven mentorship into a single unified developer workspace.

---

## ✨ Core Modules & Features

### 1. 📄 Master Profile & AI Resume Tailoring
- **Multi-Format Parsing**: Upload PDF, DOCX, TXT, or image resumes to automatically extract work experience, projects, skills, and education.
- **ATS Keyword Matching**: Target specific job descriptions using Groq LLMs and LangChain to optimize bullet points and calculate ATS alignment scores.
- **Document Viewer & Exporter**: In-app PDF/Document previews with high-fidelity export.

### 2. 🔍 GitHub Repository Intelligence
- **Deep Commit & Code Analysis**: Scans GitHub repositories to extract demonstrated skills, commit frequency, and language distributions.
- **Skill Confidence Scoring**: Translates real GitHub evidence into verified skill profiles with velocity and complexity metrics.
- **GitHub Mentor Recommendations**: Contextual suggestions based on codebase analysis.

### 3. 💻 Sandboxed Coding Assessments
- **Interactive Code Editor**: Monaco Editor integration with multi-test validation.
- **Docker-Isolated Execution**: Secure, sandboxed code execution with memory, CPU, process, and network limits.
- **Automated Grading & Evidence Generation**: Real-time evaluation against sample and hidden test cases, producing verified skill evidence.

### 4. 📺 EduTube Curated Learning
- **Skill-Mapped Video Discovery**: Dynamic query building and YouTube Data API v3 integration to curate top video tutorials for missing skills.
- **Learning Roadmaps**: Direct integration with skill gap analysis to provide step-by-step video learning paths.

### 5. 🎯 Dynamic Skill Taxonomy & Gap Analysis
- **Canonical Skill Taxonomy**: Industry-standardized skill aliases, categories, and proficiency tiers.
- **Target Role Gap Calculation**: Compares current developer evidence against benchmark roles (e.g., Full Stack, Backend, Frontend, DevOps, AI Engineer).
- **Personalized Skill Roadmaps**: Prioritized actionable steps to close identified skill gaps.

### 6. 🤖 Smart AI Mentor
- **Context-Aware Guidance**: Proactive insights derived from resumes, GitHub activity, coding scores, and skill gaps.
- **Interactive Chat & Next Steps**: Real-time conversational AI coaching powered by Groq LLaMA models.

### 7. 📊 Developer Analytics & Split Dashboard
- **Personal Developer Dashboard**: Comprehensive breakdown of skill profile scores, gap closure progress, and assessment history.
- **Admin System Analytics**: Aggregate user statistics, platform growth metrics, and module utilization tracking.

### 8. 🌐 Portfolio Generator & Cloudflare Publishing
- **One-Click Deployment**: Generate responsive developer portfolio websites and publish directly to Cloudflare Pages.
- **GitHub Source Export**: Export clean portfolio source code to GitHub repositories.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, Radix UI Primitives, Monaco Editor, Recharts, TanStack Query |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose, Firebase Admin SDK, Supabase Storage, Groq SDK, LangChain |
| **Sandbox & Execution** | Dockerode, Isolated Docker Node runtime, P-limit concurrency |
| **Testing** | Vitest, Supertest, React Testing Library, JSDOM |
| **Deployment** | Cloudflare Pages, Render |

---

## 📁 Project Structure

```text
SSH_integrated_Project/
├── backend/                      # Node.js + Express 5 Backend
│   ├── src/
│   │   ├── config/               # Environment & database configuration
│   │   ├── constants/            # Skill taxonomy & role benchmarks
│   │   ├── controllers/          # API route controllers
│   │   ├── core/                 # Auth middleware & custom error classes
│   │   ├── db/                   # MongoDB connection management
│   │   ├── middlewares/          # Auth, analytics, and error handling
│   │   ├── models/               # Mongoose data schemas
│   │   ├── modules/              # Modular domain services (Coding, EduTube, GitHub, Skills, etc.)
│   │   ├── routes/               # Express API v1 endpoints
│   │   ├── services/             # AI, parsing, Docker sandbox, and external integrations
│   │   └── utils/                # Storage, formatting, and helper utilities
│   ├── tasks/                    # Coding assessment task catalog (JavaScript, DSA)
│   ├── test/                     # Vitest integration and security verification suite
│   ├── vitest.config.js          # Backend test configuration
│   ├── package.json
│   └── .env.example              # Backend environment template
│
├── frontend/                     # React 18 + Vite TypeScript Frontend
│   ├── src/
│   │   ├── components/           # Reusable UI primitives, landing components, resume viewers
│   │   ├── core/                 # Core authentication & API client services
│   │   ├── contexts/             # Auth and global state contexts
│   │   ├── lib/                  # Utilities, API client, Firebase helpers
│   │   ├── modules/              # Domain components (Coding, EduTube, GitHub, Mentor, etc.)
│   │   ├── pages/                # Application routes and views
│   │   ├── styles/               # Custom styling and design tokens
│   │   ├── test/                 # Frontend component & integration tests
│   │   ├── App.tsx               # Root application router
│   │   └── main.tsx              # Application entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts          # Frontend test configuration
│   └── .env.example              # Frontend environment template
│
├── render.yaml                   # Render deployment specification
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **MongoDB** instance (local or Atlas)
- **Firebase Project** for user authentication
- **Groq API Key** for AI features
- **Docker** (optional, for running live coding sandboxes locally)

---

### 1. Environment Setup

#### Backend (`backend/.env`)
Copy the example environment file and fill in your credentials:
```bash
cp backend/.env.example backend/.env
```

```env
PORT=8000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=*

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smartskillhub

# Firebase Admin
FIREBASE_PROJECT_ID=your-firebase-project-id

# Supabase Storage (Resumes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
SUPABASE_STORAGE_BUCKET=resumes

# Groq AI
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# YouTube API (EduTube)
YOUTUBE_API_KEY=your_youtube_api_key
```

#### Frontend (`frontend/.env`)
Copy the example environment file and fill in your Firebase web credentials:
```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

### 2. Installation & Running Locally

#### Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend will start on `http://localhost:8000`.

#### Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

### 3. Running Tests

#### Backend Test Suite
```bash
cd backend
npm test
```

#### Frontend Test Suite
```bash
cd frontend
npm test
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
