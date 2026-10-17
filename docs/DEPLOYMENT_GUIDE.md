# Smart Skill Hub (SSH) — Production Deployment & Verification Guide

This guide provides step-by-step instructions for deploying, configuring, verifying, and troubleshooting the Smart Skill Hub platform across staging and production environments.

---

## 1. System Architecture & Prerequisites

### 1.1 Required Software & Runtime Versions
- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **npm**: `v9.x` or higher
- **MongoDB**: `v6.0` or higher (MongoDB Atlas or self-hosted Replica Set)
- **Docker Engine / Docker Desktop**:
  - **Linux**: Docker CE `20.10+` with `/var/run/docker.sock` access for the runtime user.
  - **Windows**: Docker Desktop with WSL2 integration (Ubuntu or default distribution) and named pipe access (`//./pipe/docker_engine`).
- **Google Cloud / Firebase Project**: With Identity Platform and Firebase Authentication enabled.
- **Supabase Storage**: With a designated private bucket for resume assets.
- **Groq Cloud API Key**: Providing access to `openai/gpt-oss-120b` for intelligence features.

---

## 2. Environment Configuration Reference

### 2.1 Backend Environment Configuration (`backend/.env`)

| Variable | Required | Default / Example | Description & Security Best Practice |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Set to `production` in live deployments to suppress stack traces in error envelopes. |
| `PORT` | No | `8000` | Port on which Express HTTP server listens. |
| `API_PREFIX` | No | `/api/v1` | URL prefix for all REST endpoints. |
| `CORS_ORIGIN` | Yes | `https://smartskillhub.edu` | Comma-separated list of approved frontend origins. Never use `*` in production with credentials. |
| `FRONTEND_URL` | No | `https://smartskillhub.edu` | Primary frontend web application URL (used for CSP frame-ancestors and email links). |
| `MONGODB_URI` | Yes | `mongodb+srv://...` | MongoDB connection string. Must target an isolated database with authentication. |
| `ADMIN_EMAIL` | No | `admin@smartskillhub.edu` | Designated administrator email address granting primary fallback administrative privileges. |
| `FIREBASE_PROJECT_ID` | Yes | `smart-skill-hub-prod` | Firebase project identifier for token verification. |
| `FIREBASE_CLIENT_EMAIL` | No | `firebase-adminsdk@...` | Service account client email (optional when using Application Default Credentials). |
| `FIREBASE_PRIVATE_KEY` | No | `-----BEGIN PRIVATE KEY-----...` | Service account private key. Store in secure secret managers. |
| `SUPABASE_URL` | Yes | `https://xyz.supabase.co` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbGci...` | Supabase service role key for object storage management. |
| `SUPABASE_STORAGE_BUCKET` | No | `resumes` | Storage bucket identifier for resume files. |
| `GROQ_API_KEY` | Yes | `gsk_...` | Groq Cloud API key for AI Mentor and intelligence pipelines. |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Target LLM model for AI-powered features. |
| `GITHUB_CLIENT_ID` | No | `Ov23...` | GitHub OAuth application Client ID for user repository analysis. |
| `GITHUB_CLIENT_SECRET` | No | `ghs_...` | GitHub OAuth application Client Secret. |
| `GITHUB_OAUTH_CALLBACK_URL` | No | `https://api.smartskillhub.edu/github/callback` | Authorized OAuth redirect callback URL. |

> [!CAUTION]
> Never commit real secrets, private keys, or API tokens to source control. Use environment variable injection or secret managers (e.g., AWS Secrets Manager, GCP Secret Manager, Vault).

### 2.2 Frontend Environment Configuration (`frontend/.env`)

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `VITE_API_URL` | Yes | `https://api.smartskillhub.edu/api/v1` | Base API URL. In production, if omitted, the application falls back safely to `${window.location.origin}/api/v1` rather than localhost. |
| `VITE_FIREBASE_API_KEY` | Yes | `AIzaSy...` | Firebase client API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `smart-skill-hub.firebaseapp.com` | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `smart-skill-hub-prod` | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Yes | `smart-skill-hub.appspot.com` | Firebase storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | `1234567890` | Firebase Cloud Messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes | `1:1234567890:web:...` | Firebase web application ID. |

---

## 3. Database & Firebase Setup

### 3.1 MongoDB Configuration
1. Create a dedicated database (e.g., `smart_skill_hub_prod`).
2. Ensure network access is restricted to the backend application servers/containers.
3. Indexes are created automatically by Mongoose schemas on startup (e.g., `firebaseUid`, `owner`, `email`).
4. Ensure the connection string includes TLS encryption (`+srv` or `ssl=true`).

### 3.2 Firebase Authentication Configuration
1. In Firebase Console, navigate to **Build > Authentication > Sign-in method**.
2. Enable **Google** and **Email/Password**.
3. Under Email/Password settings, ensure email verification is enforced before account activation.
4. Under **Settings > Authorized domains**, add your production frontend domain (e.g., `smartskillhub.edu`).

---

## 4. Docker Sandbox Setup & Containment Verification

The coding assessment engine uses isolated Docker containers to evaluate untrusted student code safely.

### 4.1 Windows Host Setup Steps
If deploying or testing on a Windows host:
1. Open PowerShell as Administrator and ensure WSL2 is enabled:
   ```powershell
   wsl --install -d Ubuntu
   ```
2. Download and install Docker Desktop:
   - Navigate to [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
   - Complete installation with "Use WSL 2 instead of Hyper-V" checked.
3. Launch Docker Desktop and verify the daemon is running:
   ```powershell
   docker version
   docker run --rm hello-world
   ```
4. Pull the lightweight Node.js execution image used by the sandbox:
   ```powershell
   docker pull node:20-alpine
   ```

### 4.2 Linux Host Setup Steps
```bash
# 1. Install Docker Engine
sudo apt-get update && sudo apt-get install -y docker.io

# 2. Add application service user to docker group
sudo usermod -aG docker $USER

# 3. Enable and start daemon
sudo systemctl enable --now docker

# 4. Pull sandbox runner image
docker pull node:20-alpine
```

### 4.3 Sandbox Isolation Boundaries
Every student submission container is executed with:
- `--network=none`: Zero external internet or host network access.
- `--read-only`: Read-only root filesystem.
- `--tmpfs /tmp:rw,noexec,nosuid,size=16m`: Temporary memory filesystem for execution files only.
- `--cap-drop=ALL`: Complete Linux capabilities dropped.
- `--security-opt=no-new-privileges:true`: Prevents privilege escalation.
- `--user=node`: Non-root execution.
- `--memory=128m --cpus=0.5`: Hardware resource capping.
- Strict 5000ms wall-clock timeout with automatic container termination and cleanup.

---

## 5. Build, Test & Start Commands

### 5.1 Backend Commands
```bash
cd backend

# Install production dependencies
npm ci

# Run complete test suite (Docker tests skip cleanly if daemon is stopped)
npm test

# Run specific integration audit suite
npm test -- test/phase13.deployment.hardening.test.js

# Start backend server
npm start
```

### 5.2 Frontend Commands
```bash
cd frontend

# Install dependencies
npm ci

# Run frontend tests
npm test -- --run

# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Health Checks & Diagnostics

The platform provides multi-tier health endpoints to distinguish service availability:

### 6.1 `GET /api/v1/healthcheck`
Returns comprehensive subsystem status:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "status": "ok",
    "application": "healthy",
    "timestamp": "2026-10-17T06:55:00.000Z",
    "uptimeSeconds": 1420,
    "services": {
      "database": {
        "status": "connected",
        "connected": true,
        "readyState": 1
      },
      "dockerSandbox": {
        "available": true,
        "reason": null
      },
      "aiProvider": {
        "configured": true,
        "model": "openai/gpt-oss-120b"
      }
    }
  },
  "message": "Service is healthy"
}
```

### 6.2 `GET /api/v1/healthcheck/health`
Lightweight HTTP 200 liveness probe suitable for Kubernetes, Docker Swarm, or AWS ALB health checks.

### 6.3 `GET /api/v1/coding/sandbox/status`
Reports live Docker daemon connectivity, container capability limits, and execution constraints.

---

## 7. Common Startup Failures & Troubleshooting

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| `Invalid environment configuration: MONGODB_URI is required` | Missing or blank `.env` variable | Inspect `.env` against `backend/src/config/env.js`. Ensure all required variables are set. |
| `dockerAvailable: false` with `open //./pipe/docker_engine: The system cannot find the file specified` | Docker daemon is stopped or WSL2 is not installed | Start Docker Desktop or execute `systemctl start docker` on Linux. Note: Coding submissions will return safe availability errors until Docker starts. |
| `Missing Firebase ID token` (401 on protected routes) | Unauthenticated client request or expired token | Ensure the frontend client successfully completes Firebase sign-in and passes the Bearer token in the `Authorization` header. |
| CORS origin rejected (403 or blocked by browser) | Origin mismatch in `CORS_ORIGIN` | Add the frontend domain to `CORS_ORIGIN` in `backend/.env`. |
| Error stack traces visible in responses | `NODE_ENV` is set to `development` | Set `NODE_ENV=production` in the production environment. |

---

## 8. Pre-Deployment and Post-Deployment Smoke Test Runbook

### Pre-Deployment Checklist
- [ ] Working tree on `expand-test` is verified clean.
- [ ] Backend test suite passes: `npm test` in `backend` (0 failures).
- [ ] Frontend test suite passes: `npm test -- --run` in `frontend` (0 failures).
- [ ] Production bundle compiles without error: `npm run build` in `frontend`.
- [ ] No secrets or private keys committed to Git.

### Post-Deployment Verification
1. **Liveness Probe**: Call `GET /api/v1/healthcheck/health` — must return 200 OK.
2. **Detailed Diagnostic**: Call `GET /api/v1/healthcheck` — verify `database.status === "connected"`.
3. **Authentication**: Sign in via Google / Email in frontend — verify session token and `/api/v1/auth/me` profile response.
4. **Academic Profile**: Verify degree and branch selections persist and display in profile.
5. **Skill Gaps & Multi-Role**: Navigate to Skill Gaps page — verify role requirements benchmark against official catalog.
6. **AI Mentor**: Submit a mentor question — verify structured, evidence-backed advice returns.
7. **Resume Export**: Open Resume Builder — verify editing, ATS score, and PDF generation succeed.
8. **Sandbox Status**: Check `GET /api/v1/coding/sandbox/status` — verify container isolation status.
9. **Admin Security**: Access `/api/v1/admin/users` with student token — verify request is rejected with 403 Forbidden.
