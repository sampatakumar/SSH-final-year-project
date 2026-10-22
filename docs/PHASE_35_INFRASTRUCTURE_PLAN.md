# SMART SKILL HUB — PHASE 35 INFRASTRUCTURE PLAN
## Staging Hosting Architecture, Provider Sizing, Security & Cost Analysis

**Document Version:** 1.0.0  
**Status:** Preflight Certified (Planning Phase)  
**Date:** October 22, 2026  
**Auditor / Engineering Roles:** Senior DevOps Architect, Cloud Security Engineer, Release Manager  
**Target Application:** Smart Skill Hub (Integrated Platform)  
**Target Environment:** First External Staging Deployment  

---

## 1. Executive Summary & Design Principles

Phase 35 establishes the definitive, cost-optimized, and secure infrastructure design for the initial external staging deployment of Smart Skill Hub.

### Core Architectural Principles
1. **Simplicity Over Over-Engineering:** Deploy using the existing, empirically verified Docker Compose stack (`ssh_integrated_project`). Avoid introducing Kubernetes, distributed service meshes, or complex managed services until student traffic and organizational needs require them.
2. **Strict Network Isolation:** Expose exclusively public HTTP/HTTPS ports (80/443). The MongoDB database, backend Node.js process, and internal network components remain completely unexposed to the public Internet.
3. **Fail-Closed Coding Sandbox:** In accordance with Phase 34 safeguards, untrusted code execution is disabled by default (`CODING_EXECUTION_ENABLED=false`). Untrusted student code is never run on the staging host or inside the backend container.
4. **Predictable Student Budget:** Target a predictable monthly spend between **$7.00 and $28.00/month**, eliminating runaway egress, snapshot, or managed service surcharges.
5. **Zero Cloud Infrastructure Provisioning Prior to Approval:** This document serves as the planning baseline. No VMs, cloud databases, domains, or network interfaces will be provisioned without explicit user authorization.

---

## 2. Staging Deployment Topology

The recommended architecture runs on a single hardened Virtual Private Server (VPS), deploying the three core containers connected via segmented Docker bridge networks:

```
                                [ Public Internet / Students ]
                                               │
                                               │ HTTPS (443) / HTTP (80 -> Redirect)
                                               ▼
                              ┌─────────────────────────────────┐
                              │     Cloudflare / DNS & CDN      │ (Optional DDOS / TLS termination)
                              └────────────────┬────────────────┘
                                               │
                                               │ Public IP (TCP 80, 443, SSH)
                                               ▼
┌─ STAGING HOST (Hardened Linux VPS: Ubuntu 22.04 LTS / 24.04 LTS) ───────────────────┐
│                                                                                      │
│   UFW Firewall: Allow 80, 443, SSH (Key-Only); Deny All Others                     │
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────────┐   │
│   │ ssh-frontend Container (Nginx 1.27 Alpine, UID 101 non-root)                 │   │
│   │ • Terminate TLS / Let's Encrypt certificates                                 │   │
│   │ • Serve SPA static bundle (/index.html fallback)                             │   │
│   │ • Reverse proxy /api/v1/ -> ssh-backend:8000                                 │   │
│   └──────────────────────┬───────────────────────────────────────────────────────┘   │
│                          │                                                           │
│   [ ssh-public-network ] │ Internal Bridge (HTTP:8000)                               │
│                          ▼                                                           │
│   ┌──────────────────────────────────────────────────────────────────────────────┐   │
│   │ ssh-backend Container (Node.js 22 Alpine, UID 1000 non-root)                 │   │
│   │ • Express REST API (trust proxy = 1)                                         │   │
│   │ • CODING_EXECUTION_ENABLED=false (Safeguard active)                          │   │
│   │ • Health Probes (/api/v1/healthcheck/live & /ready)                          │   │
│   └──────────────────────┬───────────────────────────────────────────────────────┘   │
│                          │                                                           │
│   [ ssh-internal-network]│ Internal Only (internal: true, TCP:27017)                 │
│                          ▼                                                           │
│   ┌──────────────────────────────────────────────────────────────────────────────┐   │
│   │ ssh-mongodb Container (MongoDB 7.0 Jammy, UID 999 non-root)                  │   │
│   │ • Persistent storage mapped to named volume: ssh_mongodb_data                │   │
│   │ • Zero host port publishing                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   Durable Docker Volumes:                                                            │
│   • ssh_mongodb_data  -> /var/lib/docker/volumes/ssh_mongodb_data/_data              │
│   • ssh_uploads_data  -> /var/lib/docker/volumes/ssh_uploads_data/_data              │
│                                                                                      │
│   Automated Host Cron:                                                               │
│   • Daily mongodump archive to /var/backups/smartskillhub/ (gzip compressed)        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Hosting Options & Detailed Cost Comparison

To select the most practical and cost-effective hosting provider for an academic/student project, four reputable cloud and VPS providers were researched using current (October 2026) verified pricing:

### Option Sizing Baseline
- **Compute:** 2 vCPUs (shared), 4 GB RAM.
- **Storage:** 40 GB to 80 GB SSD / NVMe.
- **Bandwidth:** Minimum 2 TB outbound per month (inbound free).
- **Public IPv4:** 1 dedicated public IPv4 address.
- **Operating System:** Ubuntu 22.04 LTS / 24.04 LTS x86_64.

---

### Comparative Evaluation Table

| Evaluation Criterion | 1. Hetzner Cloud (Recommended) | 2. DigitalOcean Droplet | 3. AWS Lightsail | 4. Linode (Akamai) |
| :--- | :--- | :--- | :--- | :--- |
| **Instance Plan / Class** | **CX23** (Cost-Optimized Intel/AMD) | **Basic Droplet** (Regular SSD) | **Lightsail 4GB Bundle** | **Shared CPU 4GB** |
| **vCPU & Architecture** | 2 vCPUs (Shared Intel/AMD) | 2 vCPUs (Shared) | 2 vCPUs (Shared) | 2 vCPUs (Shared) |
| **RAM** | 4 GB | 4 GB | 4 GB | 4 GB |
| **Storage** | 40 GB NVMe SSD | 80 GB SSD | 80 GB SSD | 80 GB SSD |
| **Included Traffic** | 20 TB / month | 4 TB / month | 4 TB / month (lower in APAC) | 4 TB / month |
| **Base Instance Price** | €5.49 / mo (~$6.49 USD) | $24.00 / mo | $24.00 / mo | $24.00 / mo |
| **Public IPv4 Fee** | €0.60 / mo (~$0.70 USD) | Included in $24 bundle | Included in $24 bundle | Included in $24 bundle |
| **Automated Backups** | +20% instance cost (~€1.10 / mo) | +20% base cost ($4.80 / mo) | Snapshots ($0.05/GB -> ~$4.00) | $5.00 / mo |
| **Total Estimated Monthly Cost** | **~€7.19 / mo (~$8.30 USD)** | **$28.80 / mo** | **~$28.00 / mo** | **$29.00 / mo** |
| **Upgrade Sizing Tier** | **CX33** (4 vCPU, 8GB RAM, 80GB NVMe) = €8.49/mo (~$10.60 USD total) | 4 vCPU, 8GB RAM = $48.00 / mo | 4 vCPU, 8GB RAM = $44.00 / mo | 4 vCPU, 8GB RAM = $48.00 / mo |
| **Data Center Locations** | Germany (Falkenstein, Nuremberg), Finland (Helsinki), US East/West (+20%) | NYC, SFO, Frankfurt, London, Singapore, Bangalore | US East/West, Frankfurt, London, Mumbai, Tokyo | Newark, Frankfurt, London, Mumbai, Singapore |
| **Official Pricing Source** | [hetzner.com/cloud](https://www.hetzner.com/cloud), [costgoat.com](https://costgoat.com) (Oct 2026) | [digitalocean.com/pricing](https://www.digitalocean.com/pricing) (Oct 2026) | [aws.amazon.com/lightsail/pricing](https://aws.amazon.com/lightsail/pricing/) (Oct 2026) | [akamai.com/pricing](https://www.akamai.com/products/linode) (Oct 2026) |

---

### Detailed Provider Trade-Off Analysis

#### 1. Hetzner Cloud CX23 / CX33 (Strongly Recommended for Cost & Value)
- **Strengths:** By far the lowest monthly cost (~$8.30/month including IPv4 and backups). Fast NVMe storage. Exceptional 20 TB bandwidth allowance. The next upgrade tier (CX33: 4 vCPU, 8 GB RAM) is only €8.49/mo (~$10.60/month total), making scaling virtually frictionless on a student budget.
- **Trade-offs:** Main data centers are located in Germany and Finland; US locations have a ~20% surcharge. Account verification occasionally requires credit card authorization or passport identification for anti-fraud.
- **Verdict:** **Primary Recommendation.**

#### 2. DigitalOcean Basic Droplet (Alternative for Developer Ergonomics)
- **Strengths:** Ubiquitous global data centers (including Bangalore and Singapore for low Asian latency). Clean web interface, simple automated backups, and 1-click firewall configuration.
- **Trade-offs:** 3x higher cost ($28.80/month with backups). 40 GB larger disk (80 GB vs 40 GB), but unnecessary for early staging.
- **Verdict:** Viable fallback if European data centers are unacceptable or Hetzner verification is problematic.

#### 3. AWS Lightsail
- **Strengths:** Simple AWS entry point, predictable monthly cap, easy DNS management via Route 53.
- **Trade-offs:** Same base price as DigitalOcean ($24.00/mo without backups). Snapshots are billed separately at $0.05/GB/month. Bandwidth quotas in Asia-Pacific (e.g. Mumbai) are significantly restricted compared to US/EU regions.
- **Verdict:** Acceptable only if AWS credits are already available to the project.

#### 4. Linode / Akamai Cloud
- **Strengths:** Excellent customer support, solid Linux documentation.
- **Trade-offs:** Priced identically to DigitalOcean ($24/mo + $5 backup = $29/mo) with no material performance advantage for Docker Compose workloads.
- **Verdict:** Viable, but offers no distinct advantage over Hetzner or DigitalOcean.

---

## 4. Domain, DNS & HTTPS Plan

### Domain Strategy
- **Option A (Custom Domain - Recommended):** Register a standard top-level domain (e.g. `smartskillhub.com`, `smartskillhub.org`, or `smartskillhub.dev`) via Cloudflare Registrar or Namecheap.
  - Estimated cost: **$10.00 – $14.00 / year** (~$1.00 / month).
- **Option B (Free Subdomain / Dynamic DNS):** Use DuckDNS (`smartskillhub.duckdns.org`) or FreeDNS for zero-cost early staging.

### DNS Records
| Record Type | Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| `A` | `staging.smartskillhub.com` | `<STAGING_PUBLIC_IPV4>` | Primary staging ingress |
| `CAA` | `staging.smartskillhub.com` | `0 issue "letsencrypt.org"` | Restrict TLS issuance to Let's Encrypt |

### TLS / HTTPS Automation Plan
- **Certificate Authority:** Let's Encrypt (free, automated, industry standard).
- **Renewal Mechanism:** Run `certbot` on the staging host with a systemd timer (or Dockerized Certbot container) performing automated renewal every 60 days.
- **TLS Hardening (Nginx):**
  - Protocols: `TLSv1.2 TLSv1.3` (disable older SSLv3, TLSv1.0, TLSv1.1).
  - Ciphers: Modern secure ciphers (ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256).
  - HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains` enforced via Helmet.
  - Automatic HTTP -> HTTPS 301 redirection on port 80.

---

## 5. Security & Network Hardening Design

### 5.1 Host Firewall (UFW) Rules
The staging host firewall must default to denying all incoming traffic:
```bash
# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow standard web ingress
ufw allow 80/tcp comment 'HTTP (Let\'s Encrypt & redirect)'
ufw allow 443/tcp comment 'HTTPS (Web Traffic)'

# Restrict SSH (Use key-only authentication; optionally limit to trusted admin IP)
ufw allow 22/tcp comment 'SSH Administration'

# Enable firewall
ufw enable
```

### 5.2 SSH Administrative Access Policy
1. **Password Authentication:** Completely disabled in `/etc/ssh/sshd_config` (`PasswordAuthentication no`, `PermitRootLogin prohibit-password` or `no`).
2. **Cryptographic Standard:** ed25519 public key authentication exclusively (`ssh-ed25519`).
3. **Brute-Force Protection:** Deploy `fail2ban` configured to ban IP addresses after 5 failed authentication attempts for 24 hours.

### 5.3 Docker Network & Daemon Security
1. **No Public Docker Daemon:** The Docker Engine API (`tcp://...`) is **never** bound to a public network interface.
2. **No Docker Socket Mounting:** The host socket `/var/run/docker.sock` is **never** mounted into the public `backend` or `frontend` containers.
3. **Internal Network Isolation:** `mongo` is attached exclusively to `ssh-internal-network` with `internal: true`. The Docker daemon blocks all external routing to the database container.
4. **Port Publishing Restriction:** In staging/production, remove host port mapping `127.0.0.1:27017:27017` from `docker-compose.yml` so that MongoDB is reachable only through container DNS `mongo:27017` within `ssh-internal-network`.

---

## 6. Environment & Secret Management

### 6.1 Secret Storage Architecture
1. **Zero Secrets in Git:** All actual `.env` files are excluded by `.gitignore`. Templates (`.env.staging.example`) contain placeholders only.
2. **Host File Security:** On the staging server, `backend/.env` and `frontend/.env` must be owned by the deployment user with restricted permissions:
   ```bash
   chmod 600 /opt/smartskillhub/backend/.env
   chmod 600 /opt/smartskillhub/frontend/.env
   ```
3. **Separation of Concerns:**
   - **Frontend:** Contains only public client tokens (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`). Never contains service-role keys, private RSA keys, or database connection strings.
   - **Backend:** Contains server-side service credentials (`FIREBASE_PRIVATE_KEY`, `GROQ_API_KEY`, `MONGODB_URI`).

### 6.2 Credential Rotation & Revocation Protocol
| Credential | Rotation Trigger | Rotation Steps | Downtime Impact |
| :--- | :--- | :--- | :--- |
| **Firebase Service Account** | Compromise or 180-day cycle | 1. Generate new key in GCP IAM.<br>2. Update `FIREBASE_PRIVATE_KEY` in `backend/.env`.<br>3. `docker compose restart backend`.<br>4. Delete old key in GCP IAM. | Zero downtime |
| **Groq Cloud API Key** | Compromise or quota rotation | 1. Issue new key in Groq Console.<br>2. Update `GROQ_API_KEY`.<br>3. `docker compose restart backend`.<br>4. Revoke old key. | Zero downtime |
| **MongoDB Password** | Host compromise | 1. Update user password in Mongo admin.<br>2. Update `MONGODB_URI`.<br>3. Restart backend. | < 5 seconds |

### 6.3 Log Redaction & Retention Policy
- Winston/Express loggers sanitize sensitive headers (`Authorization: Bearer ***`) and query parameters.
- Docker log rotation configured in `/etc/docker/daemon.json` or compose file:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "20m"
      max-file: "5"
  ```
  Prevents disk exhaustion from unmanaged stdout/stderr logging.

---

## 7. Persistent Storage, Backups & Disaster Recovery

### 7.1 Volume Architecture
- `ssh_mongodb_data`: Holds database files, collections, and indexes at `/data/db`.
- `ssh_uploads_data`: Holds uploaded student resumes and generated artifacts at `/app/uploads/resumes`.

### 7.2 Automated Backup Schedule (Cron)
A nightly backup script `/opt/smartskillhub/scripts/backup.sh` runs at 02:00 UTC via cron:
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/smartskillhub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# 1. Hot MongoDB dump
docker compose -f /opt/smartskillhub/docker-compose.yml exec -T mongo \
  mongodump --archive --gzip --db smartskillhub > "$BACKUP_DIR/mongo_$TIMESTAMP.gz"

# 2. Archive uploads volume
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /var/lib/docker/volumes/ssh_uploads_data/_data .

# 3. Retention: Delete backups older than 14 days
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +14 -delete
```

### 7.3 Recovery Time Objective (RTO) & Recovery Point Objective (RPO)
- **RTO (Target Recovery Time):** Under 15 minutes to restore the stack and reload data from backup.
- **RPO (Maximum Data Loss Window):** 24 hours (nightly automated backup).

---

## 8. Coding Sandbox Infrastructure Plan (Future Isolated Runner)

### 8.1 Staging Safeguard Retention
In the initial staging phase, code execution is server-disabled (`CODING_EXECUTION_ENABLED=false`). The backend returns:
```json
{
  "status": "system_error",
  "error": "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned.",
  "dockerAvailable": false
}
```
Students can view tasks, edit code in Monaco, and view problem constraints without triggering code execution.

### 8.2 Future Dedicated Runner Host Specification
When authorized to enable untrusted code execution, provision a **separate dedicated runner VM** (e.g. Hetzner CX23 or DigitalOcean Droplet):
- **Host Separation:** Must run on a completely separate VM from the backend and database.
- **Mutual TLS (mTLS):** Remote Docker daemon listens strictly on `tcp://<RUNNER_IP>:2376` requiring client certificate verification.
- **Firewall:** Port 2376 accessible strictly and exclusively from the backend staging host public/private IP.
- **Container Sandbox Policy:**
  - `NetworkDisabled: true` (Zero outbound/inbound internet access).
  - `CapDrop: ALL` (Drops all Linux kernel capabilities).
  - `Memory: 128MB` (Strict cgroup memory cap).
  - `NanoCPUs: 500000000` (0.5 CPU cap).
  - `PidsLimit: 32` (Fork bomb protection).
  - `Timeout: 5000ms` (Hard SIGKILL execution timer).
  - Read-only root filesystem with ephemeral `/tmp` execution directory.

---

## 9. Capacity Planning & Upgrade Triggers

### Staging Sizing Envelope
| Metric | Expected Staging Load (50 concurrent students) | Threshold / Upgrade Trigger |
| :--- | :--- | :--- |
| **RAM Usage** | ~1.8 GB – 2.4 GB (Nginx + Node + Mongo) | > 80% (3.2 GB of 4 GB) -> Upgrade to 8 GB (CX33) |
| **CPU Utilization** | < 15% average; brief spikes to 40% during resume parsing | > 70% sustained for 10 minutes |
| **Disk Storage** | ~4 GB (OS + Docker images) + ~1 GB data | > 75% disk capacity (30 GB of 40 GB) |
| **Outbound Bandwidth** | < 50 GB / month | Approaching 2 TB (generous 20 TB headroom) |

---

## 10. Summary Cost Checklist (Recommended Staging Budget)

| Line Item | Provider & Service | Monthly Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Compute & Memory** | Hetzner Cloud CX23 (2 vCPU, 4 GB RAM, 40 GB NVMe) | €5.49 (~$6.49 USD) | Standard monthly flat rate |
| **Public IPv4** | Hetzner Cloud IPv4 Add-on | €0.60 (~$0.70 USD) | Required for public web ingress |
| **Automated Backups** | Hetzner Daily Snapshots (20%) | €1.10 (~$1.30 USD) | Rolling daily snapshots |
| **Domain Registration** | Cloudflare Registrar (e.g. `.com`) | ~$1.00 USD ($12/yr) | Optional if using free dynamic DNS |
| **TLS / SSL Certificates** | Let's Encrypt | $0.00 (Free) | Automated via Certbot |
| **Outbound Bandwidth** | Hetzner Cloud (20 TB included) | $0.00 | Far exceeds staging requirements |
| **Total Estimated Staging Cost** | | **~€7.19 – €8.00 / mo (~$8.50 – $9.50 USD)** | **Predictable, zero runaway charges** |

*(Alternative: DigitalOcean Basic Droplet @ $28.80 / month with backups if US/Asia data center is preferred).*
