✅ Objectives

Pass all end-to-end integration tests (/api/health, /api/metadata, /api/upload-file, /api/get-file)
Route ALL traffic through Nginx reverse proxy
Containerize every backend service with Docker Compose
Isolate services via internal Docker network
Provide a minimal but polished React UI
Bonus: Add real-time system health dashboard
Bonus: Add request audit logging (unique differentiator)
Bonus: Add Redis caching for metadata reads
Bonus: Expose /api/metrics endpoint for observability


⚡ Unique Features (Hackathon Differentiators)
FeatureWhy It WinsRedis metadata cachingShows performance awarenessAudit log trail (/api/audit)Shows production-thinkingLive system health dashboard in UIShows observability mindsetMinIO bucket auto-init on startupShows operational maturityRate limiting in NginxShows security awarenessOne-command setup (make up)Shows DX polishStructured JSON loggingShows real-world engineering

🛠 Tech Stack
LayerChoiceReasonReverse ProxyNginxBattle-tested, config is transparent to judgesBackendNode.js + ExpressFast to build, easy to readDatabasePostgreSQLRelational, robust, widely respectedCacheRedisMetadata read caching, fastFile StorageMinIOS3-compatible, self-hostedFrontendReact + ViteMinimal, fastContainerizationDocker ComposeSimple, reproducibleLoggingWinston (JSON)Structured, production-grade

📁 Complete Folder Structure
nexusgrid/
├── docker-compose.yml
├── .env.example
├── Makefile                        ← one-command setup
├── README.md
├── ARCHITECTURE.md                 ← engineering justification report
│
├── nginx/
│   ├── nginx.conf                  ← main reverse proxy config
│   └── Dockerfile
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js                ← Express app entry
│   │   ├── config/
│   │   │   ├── db.js               ← PostgreSQL connection
│   │   │   ├── redis.js            ← Redis connection
│   │   │   └── minio.js            ← MinIO client + bucket init
│   │   ├── routes/
│   │   │   ├── health.js           ← GET /api/health
│   │   │   ├── metadata.js         ← POST/GET /api/metadata
│   │   │   ├── files.js            ← POST /api/upload-file, GET /api/get-file
│   │   │   ├── audit.js            ← GET /api/audit (bonus)
│   │   │   └── metrics.js          ← GET /api/metrics (bonus)
│   │   ├── middleware/
│   │   │   ├── auditLogger.js      ← logs every request to DB
│   │   │   └── cache.js            ← Redis cache middleware
│   │   └── logger.js               ← Winston structured logger
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── MetadataPanel.jsx
│           ├── FilePanel.jsx
│           └── HealthDashboard.jsx ← live system health (bonus)
│
└── db/
    └── init.sql                    ← auto-creates tables on first run

🚀 Initial Commands
Run these in order from the project root:
bash# 1. Clone / create the project folder
mkdir nexusgrid && cd nexusgrid

# 2. Copy environment variables
cp .env.example .env

# 3. Start everything (first run builds all images)
docker compose up --build -d

# 4. Check all services are healthy
docker compose ps

# 5. Run the frontend locally (not containerized per spec)
cd frontend
npm install
npm run dev
Or with the Makefile shortcut:
bashmake up        # build + start all containers
make logs      # tail all logs
make down      # stop everything
make clean     # stop + remove volumes (fresh reset)
```

---

## 🗺 Routing Map (inside Nginx)
```
/            → frontend (React dev server or static)
/api/*       → backend:3000
/storage/*   → minio:9000  (proxied, not directly exposed)
```

---

## 📦 Docker Services Summary
```
nginx        → port 80 (only publicly exposed port)
backend      → internal only (port 3000)
postgres     → internal only (port 5432)
redis        → internal only (port 6379)
minio        → internal only (ports 9000/9001)
Only Nginx on port 80 is exposed. Everything else is locked inside the nexusgrid_net internal Docker network — this directly addresses the judges' "minimal exposure" criterion.

📝 Next Steps
Want me to now generate the actual code for each file? I can produce:

docker-compose.yml + .env.example
nginx/nginx.conf
backend/src/ — all routes, middleware, config
frontend/src/ — React UI with health dashboard
db/init.sql
Makefile + README.md + ARCHITECTURE.md