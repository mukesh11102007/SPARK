import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor = ({ files = {}, onFilesChange, onSelectFile, theme, activeFile, readOnly = false }) => {
  const safeFiles = files || {};
  const fileKeys = Object.keys(safeFiles);
  const currentFile = activeFile || fileKeys[0] || 'App.jsx';
  const [monacoFailed, setMonacoFailed] = useState(false);

  const handleEditorChange = (value) => {
    if (readOnly) return;
    onFilesChange({ ...files, [currentFile]: value });
  };

  const getLanguage = (fname) => {
    if (fname.endsWith('.json')) return 'json';
    if (fname.endsWith('.html')) return 'html';
    if (fname.endsWith('.css')) return 'css';
    return 'javascript';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column', background: '#0d0d12' }}>
      {/* File Tabs Bar */}
      {fileKeys.length > 0 && (
        <div style={{ display: 'flex', gap: '2px', padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d', overflowX: 'auto', flexShrink: 0 }}>
          {fileKeys.map(f => (
            <button
              key={f}
              onClick={() => onSelectFile && onSelectFile(f)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px 4px 0 0',
                background: currentFile === f ? '#1f6feb' : 'transparent',
                border: 'none',
                color: currentFile === f ? '#ffffff' : '#8b949e',
                fontSize: '0.78rem',
                fontWeight: currentFile === f ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📄 {f}
            </button>
          ))}
        </div>
      )}

      {readOnly && (
        <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
          🔒 Read-Only Mode — You have Viewer access. Contact workspace Owner to enable editing.
        </div>
      )}

      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        {!monacoFailed ? (
          <Editor
            height="100%"
            language={getLanguage(currentFile)}
            theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
            value={safeFiles[currentFile] || ''}
            onChange={handleEditorChange}
            onMount={() => setMonacoFailed(false)}
            options={{
              readOnly: readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              formatOnPaste: true,
            }}
          />
        ) : (
          <textarea
            readOnly={readOnly}
            value={safeFiles[currentFile] || ''}
            onChange={e => handleEditorChange(e.target.value)}
            style={{
              width: '100%', height: '100%', padding: '16px',
              background: '#0d0d12', color: '#e6edf3',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '14px',
              border: 'none', outline: 'none', resize: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};
