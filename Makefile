.PHONY: up down logs clean restart build status shell-backend

# ── Start everything (build images first) ─────────────────────────
up:
	@echo "🚀 Starting NexusGrid..."
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up --build -d
	@echo "✅ NexusGrid is running at http://localhost"
	@echo "📊 MinIO Console: http://localhost/storage/console (proxy) or docker exec to reach :9001"

# ── Stop all containers ───────────────────────────────────────────
down:
	docker compose down

# ── Tail logs for all services ────────────────────────────────────
logs:
	docker compose logs -f

# ── Stop + remove volumes (full reset) ───────────────────────────
clean:
	docker compose down -v --remove-orphans
	@echo "🧹 All containers and volumes removed."

# ── Rebuild without cache ─────────────────────────────────────────
build:
	docker compose build --no-cache

# ── Restart a specific service: make restart s=backend ────────────
restart:
	docker compose restart $(s)

# ── Show container status ─────────────────────────────────────────
status:
	docker compose ps

# ── Shell into backend container ─────────────────────────────────
shell-backend:
	docker exec -it nexusgrid_backend sh

# ── Run frontend dev server ───────────────────────────────────────
frontend:
	cd frontend && npm install && npm run dev