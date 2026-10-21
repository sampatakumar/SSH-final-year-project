# Smart Skill Hub — Production Environment Variables Reference

This document provides a comprehensive audit and reference for all environment variables used by the Smart Skill Hub (SSH) backend and frontend components.

---

## 1. Security & Configuration Principles

1. **Least Privilege & Secret Isolation:** Server-side secrets (`MONGODB_URI`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PRIVATE_KEY`) must **never** be prefixed with `VITE_` or exposed to the client bundle.
2. **Graceful Degradation:** Optional integrations (YouTube Data API, Cloudflare Pages, GitHub OAuth) degrade gracefully with clear user-facing messages rather than crashing the system.
3. **No Real Secrets in Version Control:** Never commit `.env` or files containing plaintext credentials. Use `.env.example` as a template with placeholder values.
4. **Validation at Startup:** Backend uses Zod (`src/config/env.js`) to validate required variables at process startup, failing early if required configuration is missing or malformed.

---

## 2. Backend Environment Variables (`backend/.env`)

| Variable Name | Purpose | Required / Optional | Consuming Component | Secret? | Safe Configuration Guidance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | Required (`development`, `test`, `production`) | Core server, logging, error sanitizer | No | Set to `production` in live deployments to disable detailed error stack traces. |
| `PORT` | HTTP listener port | Optional (Default: `8000`) | `src/index.js` | No | Match the port expected by container orchestrator (e.g. Render uses `10000`). |
| `API_PREFIX` | Base URI routing prefix | Optional (Default: `/api/v1`) | `src/app.js` | No | Keep default `/api/v1` for standard API versioning. |
| `CORS_ORIGIN` | Allowed CORS origins | Optional (Default: `*`) | `src/app.js` CORS middleware | No | Set to comma-separated explicit URLs in production (e.g., `https://your-domain.com,https://app.your-domain.com`). |
| `FRONTEND_URL` | Application frontend URL | Optional (Default: `http://localhost:8081`) | Auth redirects, CSP frame-ancestors | No | Set to authoritative frontend URL (e.g., `https://your-app.vercel.app`). |
| `APP_BASE_URL` | Base application URL | Optional | Custom email templates | No | Used for email action links. |
| `MONGODB_URI` | MongoDB connection string | **Required** | `src/core/database/db.js` | **Yes** | Use standard format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`. |
| `ADMIN_EMAIL` | Authoritative system administrator email | Optional (Default: `sampatakumarsv@gmail.com`) | `ensureAdmin` middleware | No | Email address that receives administrative privileges. |
| `FIREBASE_PROJECT_ID` | Firebase Project Identifier | **Required** | `verifyFirebaseToken` | No | Matches Firebase console project ID. |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Optional | `firebase-admin` initialization | No | From service account JSON credentials. |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | Optional | `firebase-admin` initialization | **Yes** | Must include RSA private key headers; escape newlines with `\n` in environment strings. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON file | Optional | Alternative Firebase initialization | No | Use environment variables instead of file paths in containerized environments. |
| `FIREBASE_CONTINUE_URL` | Verification redirect URL | Optional | Email verification flow | No | Target URL where students land after verifying email. |
| `SUPABASE_URL` | Supabase Project API URL | **Required** | Supabase resume storage adapter | No | Format: `https://<project-ref>.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret | **Required** | Supabase storage bucket access | **Yes** | Bypass RLS for backend storage operations. Never share with frontend. |
| `SUPABASE_STORAGE_BUCKET` | Supabase storage bucket name | Optional (Default: `resumes`) | Resume storage utils | No | Name of the bucket configured in Supabase Storage. |
| `GROQ_API_KEY` | Groq AI platform API key | **Required** | AI Orchestrator, LLM extraction, Mentor | **Yes** | Secret key from Groq Console (`gsk_...`). Enables fast Llama/GPT-OSS inference. |
| `GROQ_MODEL` | Groq LLM model name | Optional (Default: `openai/gpt-oss-120b`) | AI Orchestrator | No | Supported model: `openai/gpt-oss-120b` or `llama-3.3-70b-versatile`. |
| `EMAIL_PROVIDER` | Email delivery backend | Optional (`resend`, `smtp`, `console`, `mock`) | Custom email delivery service | No | Use `console` or `mock` in local/testing; use `resend` or `smtp` in production. |
| `EMAIL_API_KEY` | Resend or SMTP API key | Optional (Required if provider is `resend`) | Email service | **Yes** | Secret key from Resend dashboard. |
| `EMAIL_FROM` | Sender display email | Optional | Email notifications | No | Format: `Smart Skill Hub <noreply@yourdomain.com>`. |
| `EMAIL_FROM_NAME` | Sender display name | Optional | Email notifications | No | Display name for outbound emails. |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Optional | Repository intelligence / API rate-limits | **Yes** | Enhances public GitHub API rate-limits from 60 req/hr to 5,000 req/hr. |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Optional | Settings & GitHub account sync | No | From GitHub Developer Settings > OAuth Apps. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | Optional | Settings & GitHub account sync | **Yes** | Never commit. Used to exchange authorization codes for tokens. |
| `GITHUB_OAUTH_CALLBACK_URL` | GitHub OAuth redirect callback URI | Optional | GitHub OAuth flow | No | Must match registered callback in GitHub OAuth app. |
| `CF_ACCOUNT_ID` | Cloudflare Account ID | Optional | Cloudflare Pages portfolio deployment | No | From Cloudflare dashboard sidebar. |
| `CF_API_TOKEN` | Cloudflare API Token | Optional | Portfolio static site deployment | **Yes** | Requires Cloudflare Pages Write permissions. |
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key | Optional | EduTube video search & details | **Yes** | From Google Cloud Console with YouTube Data API v3 enabled. |
| `MAX_RESUME_SIZE_MB` | Maximum resume upload size | Optional (Default: `10`) | Resume upload middleware | No | Restricts uploaded resume payload size in MB. |
| `EDUTUBE_MIN_DURATION_SECONDS` | Minimum video duration filter | Optional (Default: `120`) | EduTube ingestion filter | No | Excludes YouTube shorts/reels under 2 minutes. |

---

## 3. Frontend Environment Variables (`frontend/.env`)

All frontend variables **must** be prefixed with `VITE_` to be recognized by the Vite build tool.

| Variable Name | Purpose | Required / Optional | Component | Secret? | Safe Guidance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | Optional (Default: `/api/v1` or `http://localhost:8000/api/v1`) | `src/core/api/apiClient.ts` | No | In production, leave empty or set to `/api/v1` if reverse-proxied, or explicit backend URL. |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | **Required** | `src/core/auth/firebase.ts` | No (Public) | Firebase client API key for client-side authentication. Restricted by domain in Firebase Console. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | **Required** | `src/core/auth/firebase.ts` | No (Public) | Format: `<project-id>.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | **Required** | `src/core/auth/firebase.ts` | No (Public) | Matches backend `FIREBASE_PROJECT_ID`. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase FCM Sender ID | **Required** | `src/core/auth/firebase.ts` | No (Public) | Number from Firebase project settings. |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | **Required** | `src/core/auth/firebase.ts` | No (Public) | Unique web app identifier. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | Optional | `src/core/auth/firebase.ts` | No (Public) | Format: `G-XXXXXXXXXX`. |
| `VITE_ADMIN_EMAIL` | Admin client role check | Optional | `DashboardLayout.tsx` | No | Client-side visual hint only. Authoritative check is always enforced on the backend. |

---

## 4. Production Release Checklist

- [ ] All required backend variables (`MONGODB_URI`, `FIREBASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`) are configured in deployment environment.
- [ ] No server-side secrets are exposed in `frontend/.env` or client source code.
- [ ] `NODE_ENV` is explicitly set to `production`.
- [ ] Backend health and readiness endpoints respond correctly (`/api/v1/healthcheck/live`, `/api/v1/healthcheck/ready`).
- [ ] Database credentials use least-privilege database user.
