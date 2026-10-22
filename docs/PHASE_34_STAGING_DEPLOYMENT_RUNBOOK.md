# SMART SKILL HUB — PHASE 34 STAGING DEPLOYMENT RUNBOOK
## Operational Runbook: Staging Deployment, Operations, Observability & Recovery

**Document Version:** 1.0.0  
**Target Environment:** Staging  
**Application:** Smart Skill Hub (Integrated Platform)  
**Date:** October 22, 2026  
**Auditor / Engineering Roles:** Senior DevOps Engineer, Release Engineer, Application Security Engineer, QA Architect  

---

## 1. Overview & Operational Objectives

This runbook provides the definitive, reproducible operational instructions for deploying, managing, monitoring, backing up, and recovering the Smart Skill Hub staging platform.

### Architectural Principles
- **No Direct Host Exposure of Untrusted Containers:** Public HTTP/S traffic terminates at Nginx (`ssh-frontend`), which reverse-proxies `/api/v1/` requests to the internal Node.js backend (`ssh-backend`).
- **Internal Database Isolation:** MongoDB (`ssh-mongodb`) is bound exclusively to the private Docker bridge network (`ssh-internal-network`), completely inaccessible from the public network.
- **Fail-Closed Execution Sandbox:** In staging deployments where an isolated cloud runner VM has not yet been provisioned, `CODING_EXECUTION_ENABLED=false` is enforced at the server level. Untrusted student code is never executed on the application host or inside the backend container.
- **Durable Persistence:** Student profiles, resumes, and database collections persist across container recreation, redeployment, and host reboots via Docker named volumes (`mongodb_data`, `uploads_data`).

---

## 2. Deployment Topology & Container Architecture

```
                             [ Staging Ingress / Browser Client ]
                                             │
                                             │ HTTP/S (Port 8080 / 443)
                                             ▼
                             ┌─────────────────────────────────┐
                             │          ssh-frontend           │
                             │       Nginx 1.27 (Alpine)       │
                             │       Non-root (UID 101)        │
                             │   spa: try_files $uri /index    │
                             └────────────────┬────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │ /api/v1/* Reverse Proxy                       │ Static Web Assets
                      ▼                                               │ Cached HTML/JS/CSS
     ┌─────────────────────────────────┐                              └────────────────────
     │           ssh-backend           │
     │        Node.js 22-Alpine        │
     │       Non-root (UID 1000)       │
     │      trust proxy = 1 (Nginx)    │
     │    rate limiting + helmet sec   │
     └────────────────┬────────────────┘
                      │
       ┌──────────────┴──────────────┬───────────────────────────────┐
       │ Internal TCP:27017          │ mTLS (TCP:2376)               │ Outbound HTTPS (443)
       ▼                             ▼                               ▼
┌──────────────┐              ┌──────────────┐              ┌────────────────────────┐
│ ssh-mongodb  │              │ remote-runner│              │ External SaaS APIs     │
│ Mongo 7.0    │              │ (Dedicated VM│              │ • Firebase Admin IAM   │
│ Non-root 999 │              │  Isolated)   │              │ • Groq Cloud AI LLM    │
└──────┬───────┘              │ CODING_EXEC= │              │ • YouTube Data API v3  │
       │                      │ false when   │              │ • Supabase Storage     │
┌──────┴───────┐              │ unprovisioned│              └────────────────────────┘
│ mongodb_data │              └──────────────┘
│ (Persistent) │
└──────────────┘
```

### Network Boundaries
| Network Name | Driver | Purpose | Services Attached |
| :--- | :--- | :--- | :--- |
| `ssh-public-network` | bridge | Front-facing reverse proxy and ingress routing | `ssh-frontend`, `ssh-backend` |
| `ssh-internal-network` | bridge | Internal backend-to-database communication | `ssh-backend`, `ssh-mongodb` |

---

## 3. Prerequisites & System Requirements

### Host Environment
- **Operating System:** Linux (Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, or AlmaLinux 9 recommended).
- **CPU / RAM:** Minimum 2 vCPU, 4 GB RAM (8 GB recommended for staging load).
- **Storage:** Minimum 30 GB SSD with durable persistent volume support.
- **Docker Engine:** Version 24.0.0 or higher.
- **Docker Compose:** Version 2.20.0 or higher (v2 plugin: `docker compose`).
- **Network Ports:**
  - `8080/tcp` (or `80`/`443` for standard HTTP/S reverse proxy).
  - Backend `8000/tcp` should **not** be published to public interfaces in production (rehearsal maps `127.0.0.1:8000` for debugging).
  - MongoDB `27017/tcp` is bound to `127.0.0.1:27017` in local testing; in cloud staging, omit host port publishing completely.

---

## 4. Staging Configuration Management

### Secrets & Environment Variable Policy
1. **Never commit actual `.env` files to git.** Keep real credentials exclusively on the staging host.
2. `backend/.env.staging.example` and `frontend/.env.staging.example` define canonical variables with safe placeholders.
3. Private server credentials (Firebase service account JSON, Groq API key, MongoDB credentials) must live exclusively on the backend server.
4. Client variables (`frontend/.env`) must **never** contain private keys, service-role keys, or database credentials.

### Backend Staging Configuration (`backend/.env`)
Create `backend/.env` on the staging host based on `backend/.env.staging.example`:

```bash
# Node Environment
NODE_ENV=staging
PORT=8000
FRONTEND_URL=http://localhost:8080

# Database Configuration (Internal Docker Service Name)
MONGODB_URI=mongodb://mongodb:27017/smartskillhub
MONGODB_DATABASE=smartskillhub

# Coding Runner Staging Safety Flag
# When false: returns safe "system_error" status without executing untrusted code on host.
# Set to true only after dedicated mTLS runner VM is provisioned.
CODING_EXECUTION_ENABLED=false

# Remote Docker Engine over mTLS (Required if CODING_EXECUTION_ENABLED=true)
DOCKER_HOST=
DOCKER_TLS_VERIFY=0
DOCKER_CERT_PATH=

# AI Mentor & Learning Intelligence (Groq Cloud)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Video Learning (EduTube)
YOUTUBE_API_KEY=AIzaSy_your_youtube_api_key_here

# Firebase Admin Authentication
FIREBASE_PROJECT_ID=smart-skill-hub-staging
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@smart-skill-hub-staging.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloud Storage (Supabase) - Optional; falls back to local volume automatically
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_BUCKET_RESUMES=resumes

# Local Storage Directory (Mapped to Docker Volume uploads_data)
UPLOAD_STORAGE_PATH=/app/uploads/resumes
```

### Frontend Staging Configuration (`frontend/.env`)
Create `frontend/.env` on the staging host:

```bash
# Frontend Staging Environment
VITE_API_URL=/api/v1
VITE_APP_ENV=staging

# Public Firebase Client Configuration (No private keys)
VITE_FIREBASE_API_KEY=AIzaSy_your_public_client_key
VITE_FIREBASE_AUTH_DOMAIN=smart-skill-hub-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-skill-hub-staging
VITE_FIREBASE_STORAGE_BUCKET=smart-skill-hub-staging.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

---

## 5. Deployment Procedures

### Step 5.1: Validate Docker Compose Configuration
Prior to starting or rebuilding the stack, validate the compose configuration syntax and variable interpolation:
```bash
docker compose config --quiet
echo "Exit code: $?"
# Expected: Exit code 0 (no warnings or syntax errors)
```

### Step 5.2: Build and Start Containers
Build production multi-stage images and start all services in detached mode:
```bash
docker compose up -d --build
```

### Step 5.3: Verify Container Health & Status
```bash
docker compose ps
```
**Expected Output:**
```
NAME          IMAGE                                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ssh-backend   ssh_integrated_project-backend       "docker-entrypoint.s…"   backend    10 seconds ago   Up (healthy)              127.0.0.1:8000->8000/tcp
ssh-frontend  ssh_integrated_project-frontend      "/docker-entrypoint.…"   frontend   10 seconds ago   Up                        0.0.0.0:8080->80/tcp
ssh-mongodb   mongo:7.0-jammy                      "docker-entrypoint.s…"   mongodb    10 seconds ago   Up (healthy)              127.0.0.1:27017->27017/tcp
```

### Step 5.4: Seed Staging Academic & Role Benchmarks (First-time or Refresh)
To populate baseline career roles, skills benchmarks, and degree catalogs in MongoDB:
```bash
docker compose exec backend npm run seed:academic
```

---

## 6. Verification & Health Probes

### 6.1 Frontend HTTP Accessibility & Ingress
```bash
curl -I http://localhost:8080/
# Expected: HTTP/1.1 200 OK
# Server: nginx/...
# Content-Type: text/html
```

### 6.2 SPA Deep-Link Navigation
Verify that Nginx's `try_files $uri $uri/ /index.html` fallback works for client-side routes:
```bash
curl -I http://localhost:8080/dashboard/mentor
# Expected: HTTP/1.1 200 OK
# Content-Type: text/html
```

### 6.3 Backend Process Liveness Probe
```bash
curl -s http://localhost:8080/api/v1/healthcheck/live
# Expected JSON Response:
# {"status":"live","timestamp":"...","uptime":...,"module":"CORE"}
```

### 6.4 Backend Dependency Readiness Probe
```bash
curl -s http://localhost:8080/api/v1/healthcheck/ready
# Expected JSON Response (HTTP 200):
# {"status":"ready","timestamp":"...","database":"connected","module":"CORE"}
```

### 6.5 Coding Sandbox Execution Safety Probe
Verify that untrusted code execution is safely intercepted:
```bash
curl -s http://localhost:8080/api/v1/coding/sandbox/status
# Expected JSON:
# {
#   "success": true,
#   "data": {
#     "executionEnabled": false,
#     "dockerAvailable": false,
#     "message": "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned."
#   }
# }
```

Submit a test execution payload to confirm fail-closed behavior:
```bash
curl -s -X POST http://localhost:8080/api/v1/coding/run \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(1+1);"}'
# Expected JSON:
# {
#   "status": "system_error",
#   "error": "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned.",
#   "output": "",
#   "executionTimeMs": 0
# }
```

---

## 7. Observability, Logging & Diagnostics

### 7.1 Inspecting Live Container Logs
```bash
# Follow aggregated logs across all services
docker compose logs -f --tail=100

# View backend logs only
docker compose logs -f --tail=100 backend

# View frontend (Nginx access and error logs)
docker compose logs -f --tail=100 frontend

# View MongoDB logs
docker compose logs -f --tail=100 mongodb
```

### 7.2 Diagnosing Outages: Backend Failure vs. Database Unavailability
| Diagnostic Symptom | Probable Cause | Diagnostic Command | Remediation |
| :--- | :--- | :--- | :--- |
| `/api/v1/healthcheck/ready` returns **HTTP 503** with `database: "disconnected"` | MongoDB process stopped or network partition | `docker compose logs mongodb` | Check MongoDB container state; restart via `docker compose restart mongodb`. |
| Nginx returns **HTTP 502 Bad Gateway** on `/api/v1/*` | Backend container crashed or restarting | `docker compose logs backend --tail=50` | Inspect Node uncaught exceptions, check `NODE_ENV` / env validation. |
| Ingress port 8080 returns **Connection Refused** | Frontend container stopped | `docker compose ps frontend` | Restart frontend via `docker compose up -d frontend`. |
| Nginx rate limit warning: `express-rate-limit ValidationError` | Missing `trust proxy` | Verified fixed in Phase 34 (`app.set("trust proxy", 1)`) | Verify backend has latest build. |

### 7.3 Verifying Secret Redaction in Logs
Verify that sensitive API keys, Firebase private keys, or passwords never appear in log output:
```bash
docker compose logs backend | grep -iE "(AIzaSy|gsk_|PRIVATE KEY|BEGIN PRIVATE)"
# Expected: Empty result (no matches).
```

---

## 8. Persistence, Backup & Restore Guidance

### 8.1 Docker Volume Inventory
Smart Skill Hub uses two named persistent volumes:
- `mongodb_data`: Stores B-tree data files, indexes, and write-ahead transaction logs (`/data/db`).
- `uploads_data`: Stores student uploaded resume files and parsed assets (`/app/uploads/resumes`).

### 8.2 Database Backup (Hot Dump)
Create a consistent, timestamped BSON archive from the running MongoDB container:
```bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Execute mongodump inside container and stream compressed archive
docker compose exec -T mongodb mongodump --archive --gzip --db smartskillhub > "$BACKUP_DIR/mongodb_smartskillhub_$BACKUP_DATE.gz"

echo "Backup completed: $BACKUP_DIR/mongodb_smartskillhub_$BACKUP_DATE.gz"
```

### 8.3 Database Restore
To restore data to a staging or disaster recovery instance:
```bash
RESTORE_FILE="$BACKUP_DIR/mongodb_smartskillhub_YYYYMMDD_HHMMSS.gz"

docker compose exec -T mongodb mongorestore --archive --gzip --drop < "$RESTORE_FILE"
echo "Restore completed."
```
> [!CAUTION]
> The `--drop` flag replaces existing collections in `smartskillhub`. Use only during disaster recovery or intentional staging reset.

### 8.4 Uploads Volume Backup
```bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker run --rm \
  -v ssh_integrated_project_uploads_data:/source:ro \
  -v $(pwd)/backups:/destination \
  alpine tar czf /destination/uploads_data_$BACKUP_DATE.tar.gz -C /source .
```

---

## 9. Recovery Procedures

### 9.1 Routine Container Restart
Restarting containers does **not** destroy data volumes:
```bash
# Restart single service
docker compose restart backend

# Restart entire stack safely
docker compose down
docker compose up -d
```

### 9.2 Simulating & Recovering from a Database Outage
1. **Stop database:**
   ```bash
   docker compose stop mongodb
   ```
2. **Verify readiness degradation:**
   ```bash
   curl -i http://localhost:8080/api/v1/healthcheck/ready
   # Returns HTTP/1.1 503 Service Unavailable
   ```
3. **Restart database:**
   ```bash
   docker compose start mongodb
   ```
4. **Verify automatic recovery:**
   ```bash
   curl -i http://localhost:8080/api/v1/healthcheck/ready
   # Returns HTTP/1.1 200 OK, database: "connected"
   ```

### 9.3 Recovering from a Failed Image Build or Deployment
If a new image build fails or contains an unexpected regression:
1. Re-deploy the previously accepted commit:
   ```bash
   git checkout <PREVIOUS_ACCEPTED_COMMIT>
   docker compose up -d --build
   ```
2. Or roll back to the previously tagged Docker images:
   ```bash
   docker compose down
   # Roll back code checkout
   git checkout cd0d189f77f98fb7ffcc3fa8f5c3f3fa54e5883a
   docker compose up -d --build
   ```

---

## 10. Enabling the Dedicated Remote Coding Runner (Post-Cloud Provisioning)

When a dedicated isolated cloud VM has been provisioned and mutual TLS (mTLS) certificates are generated:

### Step 10.1: Copy Runner Certificates to Backend
Store client mTLS certificates in `backend/certs/`:
- `backend/certs/ca.pem`
- `backend/certs/cert.pem`
- `backend/certs/key.pem`
Ensure file permissions are restricted: `chmod 600 backend/certs/key.pem`.

### Step 10.2: Update Backend Configuration
Edit `backend/.env`:
```bash
CODING_EXECUTION_ENABLED=true
DOCKER_HOST=tcp://<RUNNER_VM_PRIVATE_IP>:2376
DOCKER_TLS_VERIFY=1
DOCKER_CERT_PATH=/app/certs
```

### Step 10.3: Restart Backend Container
```bash
docker compose up -d --build backend
```

### Step 10.4: Verify Runner Health
```bash
curl -s http://localhost:8080/api/v1/coding/sandbox/status
# Expected: executionEnabled: true, dockerAvailable: true
```

---

## 11. Security Hardening Summary

1. **Non-Root Execution:** Backend runs as UID 1000 (`node`), Frontend runs as UID 101 (`nginx`), MongoDB runs as UID 999 (`mongodb`).
2. **Reverse Proxy Rate Limiting:** Nginx buffers and proxies client requests, while Express rate limiting enforces per-IP request throttling. `trust proxy = 1` prevents IP spoofing.
3. **Zero Docker Socket Mounting:** Host Docker socket (`/var/run/docker.sock`) is never mounted into the public backend container.
4. **Sandboxed Remote Runner Policy:** If enabled, code execution runs with `NetworkDisabled: true`, `CapDrop: ALL`, `Memory: 128MB`, `NanoCPUs: 500000000` (0.5 CPU), and `PidsLimit: 32`.
5. **No Secrets in Frontend:** Private keys, service account JSONs, and database URLs remain server-side only.

---

## 12. Staging Operational Checklist

Before declaring staging open for student and QA evaluation:
- [x] Docker Compose configuration validated (`docker compose config --quiet`).
- [x] Backend and Frontend multi-stage production images built cleanly.
- [x] Ingress accessibility verified (`http://localhost:8080/` -> 200 OK).
- [x] SPA deep-linking verified (`http://localhost:8080/dashboard/mentor` -> 200 OK).
- [x] Liveness probe verified (`/api/v1/healthcheck/live` -> 200 OK).
- [x] Readiness probe verified (`/api/v1/healthcheck/ready` -> 200 OK).
- [x] Database persistence across container restarts verified (`mongodb_data`).
- [x] Database outage and recovery behavior empirically confirmed (HTTP 503 -> HTTP 200).
- [x] Coding sandbox staged safely with `CODING_EXECUTION_ENABLED=false` (HTTP 200 safe system message).
- [x] Container logs audited for secret redaction.
- [x] Operational runbook and recovery procedures documented.
