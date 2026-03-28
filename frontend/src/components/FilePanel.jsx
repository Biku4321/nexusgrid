import { useState, useRef } from 'react';

export default function FilePanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadMsg,    setUploadMsg]    = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);

  const [getFileName, setGetFileName] = useState('');
  const [getResult,   setGetResult]   = useState(null);
  const [getMsg,      setGetMsg]      = useState(null);
  const [getting,     setGetting]     = useState(false);

  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg(null);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await fetch('/api/upload-file', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadResult(data);
      setUploadMsg({ type: 'success', text: 'File uploaded successfully.' });
      setSelectedFile(null);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleGetFile = async () => {
    if (!getFileName.trim()) return;
    setGetting(true);
    setGetMsg(null);
    setGetResult(null);
    try {
      const res = await fetch(`/api/get-file?name=${encodeURIComponent(getFileName.trim())}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'File not found');
      }
      const contentType = res.headers.get('Content-Type') || '';
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setGetResult({ url, contentType, name: getFileName.trim() });
      setGetMsg({ type: 'success', text: 'File retrieved.' });
    } catch (err) {
      setGetMsg({ type: 'error', text: err.message });
    } finally {
      setGetting(false);
    }
  };

  const isImage = (ct) => ct.startsWith('image/');

  return (
    <div className="section-gap">
      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* ── Upload ── */}
        <div className="card">
          <p className="card-title">Upload File</p>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef} type="file"
              onChange={e => setSelectedFile(e.target.files[0])}
            />
            {selectedFile ? (
              <>
                <p className="drop-zone-text">Selected:</p>
                <p className="drop-zone-file">{selectedFile.name}</p>
                <p className="drop-zone-text" style={{ marginTop: 4 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <p className="drop-zone-text">DROP FILE HERE OR CLICK TO BROWSE</p>
            )}
          </div>
          <button
            className="btn solid" onClick={handleUpload}
            disabled={uploading || !selectedFile}
          >
            {uploading ? 'UPLOADING···' : 'UPLOAD TO MINIO'}
          </button>
          {uploadMsg && <div className={`msg ${uploadMsg.type}`}>{uploadMsg.text}</div>}

          {uploadResult && (
            <div style={{ marginTop: 16, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>UPLOAD RESULT</p>
              {[
                ['Object Name', uploadResult.objectName],
                ['File Path',   uploadResult.filePath],
                ['Size',        `${(uploadResult.size / 1024).toFixed(1)} KB`],
                ['Type',        uploadResult.mimetype],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Retrieve ── */}
        <div className="card">
          <p className="card-title">Retrieve File</p>
          <div className="form-group">
            <label>Object Name</label>
            <input
              type="text"
              placeholder="1234567890-myfile.png"
              value={getFileName}
              onChange={e => setGetFileName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGetFile()}
            />
          </div>
          <button
            className="btn solid" onClick={handleGetFile}
            disabled={getting || !getFileName.trim()}
          >
            {getting ? 'FETCHING···' : 'GET FILE'}
          </button>
          {getMsg && <div className={`msg ${getMsg.type}`}>{getMsg.text}</div>}

          {getResult && (
            <div style={{ marginTop: 16 }}>
              {isImage(getResult.contentType) ? (
                <img
                  src={getResult.url} alt={getResult.name}
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                />
              ) : (
                <a
                  href={getResult.url} download={getResult.name}
                  className="btn" style={{ display: 'inline-block', marginTop: 8 }}
                >
                  DOWNLOAD {getResult.name}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
