-- ── NexusGrid Database Schema ─────────────────────────────────────

-- Metadata table
CREATE TABLE IF NOT EXISTS metadata (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  file_path   VARCHAR(500),
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Audit log table (bonus feature)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  method      VARCHAR(10)   NOT NULL,
  path        VARCHAR(500)  NOT NULL,
  status_code INT,
  ip_address  VARCHAR(60),
  duration_ms INT,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Index for fast audit queries
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metadata_created_at ON metadata(created_at DESC);

-- Auto-update updated_at on metadata changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metadata_updated_at
  BEFORE UPDATE ON metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();