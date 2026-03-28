import { useState, useEffect } from 'react';

export default function MetadataPanel() {
  const [form,    setForm]    = useState({ title: '', description: '', filePath: '' });
  const [records, setRecords] = useState([]);
  const [msg,     setMsg]     = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/metadata');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setMsg({ type: 'error', text: 'Title is required.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }
      setMsg({ type: 'success', text: 'Metadata stored successfully.' });
      setForm({ title: '', description: '', filePath: '' });
      await fetchRecords();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-gap">
      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* ── Create form ── */}
        <div className="card">
          <p className="card-title">Store Metadata</p>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Enter title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>File Path</label>
            <input
              type="text"
              placeholder="/storage/bucket/filename.ext"
              value={form.filePath}
              onChange={e => setForm(f => ({ ...f, filePath: e.target.value }))}
            />
          </div>
          <button className="btn solid" onClick={handleSubmit} disabled={loading}>
            {loading ? 'STORING···' : 'STORE METADATA'}
          </button>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </div>

        {/* ── Records list ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p className="card-title" style={{ margin: 0 }}>Stored Records</p>
            <button className="btn" onClick={fetchRecords} style={{ padding: '4px 12px', fontSize: 10 }}>
              REFRESH
            </button>
          </div>
          {records.length === 0 ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              No records yet.
            </p>
          ) : (
            records.map(r => (
              <div key={r.id} style={{
                borderBottom: '1px solid var(--border)', paddingBottom: 14,
                marginBottom: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>
                    {r.title}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                    #{r.id}
                  </span>
                </div>
                {r.description && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                    {r.description}
                  </p>
                )}
                {r.filePath && (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>
                    {r.filePath}
                  </p>
                )}
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
