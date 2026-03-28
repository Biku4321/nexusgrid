import { useState, useEffect, useCallback } from 'react';

const REFRESH_MS = 10_000;

export default function HealthDashboard() {
  const [health,  setHealth]  = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [hRes, mRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/metrics'),
      ]);
      const [h, m] = await Promise.all([hRes.json(), mRes.json()]);
      setHealth(h);
      setMetrics(m);
      setLastRefresh(new Date());
    } catch {
      setHealth({ status: 'error', services: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  const statusBadge = (val) => {
    if (loading || val === undefined) return <span className="badge loading">···</span>;
    const ok = val === 'ok';
    return <span className={`badge ${ok ? 'ok' : 'error'}`}>{ok ? 'ONLINE' : 'ERROR'}</span>;
  };

  return (
    <div className="section-gap">

      {/* ── Title row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: 3, color: 'var(--text)', textTransform: 'uppercase' }}>
          <span className="live-dot" />
          Live System Health
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
              updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button className="btn" onClick={fetchAll} style={{ padding: '6px 14px', fontSize: 10 }}>
            REFRESH
          </button>
        </div>
      </div>

      {/* ── Overall status ── */}
      <div className="card">
        <p className="card-title">Overall Status</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700,
            color: health?.status === 'ok' ? 'var(--green)' : health?.status === 'degraded' ? 'var(--yellow)' : 'var(--red)'
          }}>
            {loading ? '···' : health?.status?.toUpperCase() ?? 'UNKNOWN'}
          </span>
          {health?.timestamp && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              {new Date(health.timestamp).toISOString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Service checks ── */}
      <div className="card">
        <p className="card-title">Service Checks</p>
        {['postgres', 'redis', 'minio'].map(svc => (
          <div className="service-row" key={svc}>
            <span className="service-name">{svc.toUpperCase()}</span>
            {statusBadge(health?.services?.[svc])}
          </div>
        ))}
      </div>

      {/* ── Metrics tiles ── */}
      {metrics && (
        <>
          <div className="grid-4">
            <div className="stat-tile">
              <p className="stat-label">Uptime</p>
              <p className="stat-value">{formatUptime(metrics.system.uptime)}</p>
            </div>
            <div className="stat-tile">
              <p className="stat-label">Heap Used</p>
              <p className="stat-value">{metrics.system.memoryUsed}</p>
            </div>
            <div className="stat-tile">
              <p className="stat-label">Metadata Records</p>
              <p className="stat-value">{metrics.database.metadataRecords}</p>
            </div>
            <div className="stat-tile">
              <p className="stat-label">Audit Records</p>
              <p className="stat-value">{metrics.database.auditRecords}</p>
            </div>
          </div>
          <div className="grid-3">
            <div className="stat-tile">
              <p className="stat-label">Errors (1h)</p>
              <p className={`stat-value ${metrics.performance.errorsLastHour > 0 ? 'warn' : 'ok'}`}>
                {metrics.performance.errorsLastHour}
              </p>
            </div>
            <div className="stat-tile">
              <p className="stat-label">Avg Response</p>
              <p className="stat-value">{metrics.performance.avgResponseTimeMs}ms</p>
            </div>
            <div className="stat-tile">
              <p className="stat-label">Redis Memory</p>
              <p className="stat-value">{metrics.cache.redisMemory}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatUptime(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
