# ◈ NEXUSGRID

**A production-ready unified infrastructure platform.**  
Metadata storage · File storage · Live observability · Single-ingress routing via Nginx.

---

```
                     ┌─────────────────────────────────────┐
                     │         CLIENT / BROWSER / CURL      │
                     └──────────────┬──────────────────────┘
                                    │ :80  ← only exposed port
                     ┌──────────────▼──────────────────────┐
                     │         NGINX REVERSE PROXY           │
                     │   rate limiting · gzip · JSON logs    │
                     └───────┬──────────────┬──────────────┘
                             │              │
                 /api/*      │              │ /storage/*
              ┌──────────────▼───┐     ┌───▼──────────────┐
              │   BACKEND        │     │   MINIO           │
              │   Node/Express   │     │   S3-compatible   │
              │   :3000          │     │   Object Storage  │
              └──┬───────────┬───┘     └──────────────────┘
                 │           │
     ┌───────────▼──┐  ┌─────▼────────┐
     │  POSTGRESQL  │  │    REDIS      │
     │  Metadata +  │  │    Cache      │
     │  Audit Logs  │  │    TTL 60s    │
     └──────────────┘  └──────────────┘

  ← All services run on internal Docker network →
  ← Nothing except Nginx is reachable from outside →
```

---

## What's Inside

| Layer | Tech | Role |
|---|---|---|
| Reverse Proxy | Nginx 1.25 | Single entry point — routing, rate limiting, JSON logs |
| Backend API | Node.js 20 + Express | REST endpoints, business logic, file streaming |
| Database | PostgreSQL 16 | Metadata persistence + audit trail |
| Cache | Redis 7 | Metadata read cache, auto-invalidated on write |
| File Storage | MinIO | S3-compatible object storage, bucket auto-created |
| Frontend | React 18 + Vite | Live dashboard (runs outside Docker per spec) |

---

## Project Structure

```
nexusgrid/
├── docker-compose.yml              ← 5 services, 1 internal Docker network
├── .env.example                    ← every variable documented, safe to commit
├── Makefile                        ← one-command setup and operations
├── README.md                       ← you are here
├── ARCHITECTURE.md                 ← engineering justification report
│
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf                  ← routing rules, rate limits, gzip, JSON logs
│
├── backend/
│   ├── Dockerfile                  ← node:20-alpine, production deps only
│   ├── package.json
│   └── src/
│       ├── index.js                ← Express app entry + service bootstrap
│       ├── logger.js               ← Winston structured JSON logger
│       ├── config/
│       │   ├── db.js               ← PostgreSQL connection pool
│       │   ├── redis.js            ← Redis client
│       │   └── minio.js            ← MinIO client + auto bucket init (10 retries)
│       ├── middleware/
│       │   ├── auditLogger.js      ← async request audit → PostgreSQL
│       │   └── cache.js            ← Redis get/set + prefix invalidation
│       └── routes/
│           ├── health.js           ← GET  /api/health
│           ├── metadata.js         ← POST /api/metadata · GET /api/metadata
│           ├── files.js            ← POST /api/upload-file · GET /api/get-file
│           ├── audit.js            ← GET  /api/audit
│           └── metrics.js          ← GET  /api/metrics
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js              ← proxies /api and /storage → Nginx :80
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 ← 4-tab navigation shell
│       ├── styles.css              ← industrial dark theme (amber + black)
│       └── components/
│           ├── HealthDashboard.jsx ← live service status + metrics tiles
│           ├── MetadataPanel.jsx   ← store and retrieve metadata records
│           ├── FilePanel.jsx       ← drag-drop upload + file retrieval/preview
│           └── AuditPanel.jsx      ← paginated request audit trail table
│
└── db/
    └── init.sql                    ← schema auto-applied on first postgres start
```

---

## How to Run

### Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2) → https://docs.docker.com/get-docker/
- **Node.js 18+** → https://nodejs.org (frontend only — not containerized per spec)
- **Git**

---

### 1 · Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/nexusgrid.git
cd nexusgrid
```

---

### 2 · Set up environment variables

```bash
cp .env.example .env
```

> The defaults work out of the box for local development. No edits required.

---

### 3 · Start all backend services

```bash
make up
```

This builds all Docker images and starts 5 containers in the background:

```
✔ nexusgrid_nginx     → http://localhost  (port 80, ONLY exposed port)
✔ nexusgrid_backend   → internal :3000
✔ nexusgrid_postgres  → internal :5432  (auto-runs db/init.sql on first start)
✔ nexusgrid_redis     → internal :6379
✔ nexusgrid_minio     → internal :9000  (bucket auto-created on backend start)
```

Wait ~15 seconds, then verify:

```bash
make status
# All containers should show status: healthy
```

---

### 4 · Start the frontend

Open a new terminal:

```bash
make frontend
# OR:  cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** — the React dashboard will load.

> Vite proxies `/api/*` and `/storage/*` through Nginx on port 80, so all traffic flows through the reverse proxy — even in development.

---

### 5 · Smoke test everything

```bash
# ── Health check ──────────────────────────────────────────────────
curl http://localhost/api/health
# → {"status":"ok","services":{"postgres":"ok","redis":"ok","minio":"ok"}}

# ── Store metadata ────────────────────────────────────────────────
curl -X POST http://localhost/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Doc","description":"Integration test","filePath":"/storage/nexusgrid-files/test.pdf"}'

# ── Retrieve metadata ─────────────────────────────────────────────
curl http://localhost/api/metadata

# ── Upload a file ─────────────────────────────────────────────────
curl -X POST http://localhost/api/upload-file \
  -F "file=@/path/to/any/file.png"
# → {"objectName":"1712345678-file.png","filePath":"/storage/nexusgrid-files/..."}

# ── Get the file back ─────────────────────────────────────────────
curl "http://localhost/api/get-file?name=PASTE_OBJECT_NAME_HERE" -o out.png

# ── Audit trail ───────────────────────────────────────────────────
curl http://localhost/api/audit?limit=20

# ── Metrics snapshot ──────────────────────────────────────────────
curl http://localhost/api/metrics
```

---

## All Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Deep health check — postgres, redis, minio each verified |
| `POST` | `/api/metadata` | Store `{title, description, filePath}` → PostgreSQL |
| `GET` | `/api/metadata` | All metadata records (Redis cached, 60s TTL) |
| `POST` | `/api/upload-file` | Upload file (form field: `file`, max 50MB) → MinIO |
| `GET` | `/api/get-file?name=X` | Stream file by object name from MinIO |
| `GET` | `/api/audit` | Full request audit log. Supports `?limit=N` (max 500) |
| `GET` | `/api/metrics` | Uptime, heap, DB counts, error rate, Redis memory |
| `GET` | `/nginx-health` | Nginx liveness check |
| `GET` | `/storage/*` | Proxied MinIO object access |

---

## Makefile Commands

| Command | What it does |
|---|---|
| `make up` | Build images + start all 5 containers detached |
| `make down` | Stop all containers |
| `make logs` | Tail all container logs (Ctrl+C to exit) |
| `make status` | Show health status of all containers |
| `make clean` | Stop everything + delete all volumes (full reset) |
| `make build` | Force rebuild all images without cache |
| `make restart s=backend` | Restart a single service by name |
| `make shell-backend` | Open a shell inside the backend container |
| `make frontend` | Install npm deps + start Vite dev server |

---

## Network Architecture

Only **port 80 (Nginx)** is exposed to your machine. All other services communicate exclusively over the internal `nexusgrid_net` Docker bridge network.

```
Host :80  →  nginx
             ├── /api/*      →  backend:3000
             ├── /storage/*  →  minio:9000
             └── /           →  static files

Internal only (not reachable from host):
  backend  ←→  postgres:5432
  backend  ←→  redis:6379
  backend  ←→  minio:9000
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `nexusgrid` | Database name |
| `POSTGRES_USER` | `nexus` | DB username |
| `POSTGRES_PASSWORD` | `supersecretpassword` | DB password |
| `REDIS_PASSWORD` | `redissecret` | Redis auth password |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | `minioadmin123` | MinIO secret key |
| `MINIO_BUCKET` | `nexusgrid-files` | Bucket name (auto-created) |
| `CACHE_TTL_SECONDS` | `60` | Redis cache TTL in seconds |
| `NODE_ENV` | `production` | Node environment |

---

## Bonus Features

| Feature | Endpoint | Detail |
|---|---|---|
| **Request Audit Trail** | `GET /api/audit` | Every API call logged async to PostgreSQL — method, path, status, duration, IP |
| **Redis Cache** | auto | Metadata GETs served from cache; writes auto-invalidate |
| **Live Metrics** | `GET /api/metrics` | Uptime, heap, error rate, avg response time, Redis memory |
| **MinIO Auto-Init** | — | Bucket created + public-read policy applied on first backend start |
| **Nginx Rate Limiting** | — | 30 req/s general, 5 req/s on upload — per client IP |
| **Structured JSON Logs** | — | Winston logs from backend in JSON — grep/pipe friendly |

---

## Resetting to a Clean Slate

```bash
make clean   # removes all containers AND their volumes
make up      # fresh start — postgres re-runs init.sql, MinIO re-creates bucket
```

---

## Troubleshooting

**`make status` shows unhealthy containers?**
```bash
make logs    # check startup errors
```

**Backend says "MinIO init attempt N failed"?**
MinIO takes a few seconds to start. The backend retries 10 times with 2s backoff — wait and it will self-resolve.

**Port 80 already in use?**
Edit `docker-compose.yml` and change `"80:80"` to `"8080:80"`, then update Vite proxy target to `http://localhost:8080`.

**Frontend shows network errors?**
Make sure `make up` completed and backend is healthy before starting the frontend.

---

*Built for the Connect the Dots — Infrastructure Integration Challenge.*