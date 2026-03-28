import { useState } from 'react';
import HealthDashboard from './components/HealthDashboard.jsx';
import MetadataPanel   from './components/MetadataPanel.jsx';
import FilePanel       from './components/FilePanel.jsx';
import AuditPanel      from './components/AuditPanel.jsx';
import './index.css';

const TABS = [
  { id: 'health',   label: 'System Health' },
  { id: 'metadata', label: 'Metadata'       },
  { id: 'files',    label: 'File Storage'   },
  { id: 'audit',    label: 'Audit Log'      },
];

export default function App() {
  const [tab, setTab] = useState('health');

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">◈</span>
            <span className="logo-text">NEXUSGRID</span>
          </div>
          <nav className="nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="main">
        {tab === 'health'   && <HealthDashboard />}
        {tab === 'metadata' && <MetadataPanel   />}
        {tab === 'files'    && <FilePanel        />}
        {tab === 'audit'    && <AuditPanel       />}
      </main>

      <footer className="footer">
        <span>NexusGrid Infrastructure Platform</span>
        <span className="footer-sep">·</span>
        <span>All traffic routed via Nginx</span>
      </footer>
    </div>
  );
}