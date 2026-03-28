import { useState, useEffect } from 'react';

const STATUS_COLOR = (code) => {
  if (!code) return 'var(--muted)';
  if (code < 300) return 'var(--green)';
  if (code < 400) return 'var(--yellow)';
  return 'var(--red)';
};

export default function AuditPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit,   setLimit]   = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?limit=${limit}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [limit]);

  return (
    <div className="section-gap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>
            Request Audit Trail
          </h2>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Every API request logged to PostgreSQL
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 'var(--radius)',
              fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 10px',
            }}
          >
            {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
          <button className="btn" onClick={fetchLogs} style={{ padding: '6px 14px', fontSize: 10 }}>
            REFRESH
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', padding: '20px 0' }}>
              Loading···
            </p>
          ) : logs.length === 0 ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', padding: '20px 0' }}>
              No audit records yet. Make some API calls first.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--muted)' }}>{log.id}</td>
                    <td>
                      <span style={{
                        color: log.method === 'GET' ? 'var(--green)' : log.method === 'POST' ? 'var(--accent)' : 'var(--muted)',
                        fontWeight: 700,
                      }}>
                        {log.method}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.path}
                    </td>
                    <td style={{ color: STATUS_COLOR(log.statusCode), fontWeight: 700 }}>
                      {log.statusCode}
                    </td>
                    <td style={{ color: log.durationMs > 300 ? 'var(--yellow)' : 'var(--muted)' }}>
                      {log.durationMs}ms
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{log.ipAddress}</td>
                    <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}