import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';

export const CodeEditor = ({ files = {}, onFilesChange, onSelectFile, theme, activeFile, readOnly = false, workspaceId }) => {
  const safeFiles = files || {};
  const fileKeys = Object.keys(safeFiles);
  const currentFile = activeFile || fileKeys[0] || 'App.jsx';
  const [useFallback, setUseFallback] = useState(false);
  const textareaRef = useRef(null);

  const currentCode = safeFiles[currentFile] || '';

  const socketRef = useRef(null);

  useEffect(() => {
    if (!workspaceId || readOnly) return;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.emit('join-workspace', workspaceId);

    socket.on('remote-code-change', (newFiles) => {
      onFilesChange(newFiles);
    });

    return () => {
      socket.disconnect();
    };
  }, [workspaceId, readOnly]);

  const handleCodeChange = (value) => {
    if (readOnly) return;
    const newFiles = { ...files, [currentFile]: value };
    onFilesChange(newFiles);
    if (socketRef.current && workspaceId) {
      socketRef.current.emit('code-change', { workspaceId, files: newFiles });
    }
  };

  const getLanguage = (fname) => {
    if (fname.endsWith('.json')) return 'json';
    if (fname.endsWith('.html')) return 'html';
    if (fname.endsWith('.css')) return 'css';
    return 'javascript';
  };

  // Auto-indentation and Tab support for fallback editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      handleCodeChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lineCount = (currentCode.match(/\n/g) || []).length + 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column', background: '#0d1117' }}>
      {/* File Tabs Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '2px', padding: '6px 12px 0', overflowX: 'auto' }}>
          {fileKeys.map(f => (
            <button
              key={f}
              onClick={() => onSelectFile && onSelectFile(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px 6px 0 0',
                background: currentFile === f ? '#1f6feb' : 'transparent',
                border: 'none',
                color: currentFile === f ? '#ffffff' : '#8b949e',
                fontSize: '0.8rem',
                fontWeight: currentFile === f ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              📄 {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px' }}>
          <button
            onClick={() => setUseFallback(!useFallback)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: '#21262d',
              border: '1px solid #30363d',
              color: '#c9d1d9',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {useFallback ? '⚡ Switch to Monaco' : '📝 Switch to Lightweight Editor'}
          </button>
        </div>
      </div>

      {readOnly && (
        <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
          🔒 Read-Only Mode — You have Viewer access. Contact workspace Owner to enable editing.
        </div>
      )}

      {/* Editor Main Container */}
      <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {!useFallback ? (
          <Editor
            height="100%"
            language={getLanguage(currentFile)}
            theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
            value={currentCode}
            onChange={handleCodeChange}
            onMount={() => setUseFallback(false)}
            options={{
              readOnly: readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              formatOnPaste: true,
              automaticLayout: true,
            }}
          />
        ) : (
          /* Custom Pro Code Editor with Line Numbers */
          <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0d1117' }}>
            <div style={{
              width: '44px', padding: '16px 8px', background: '#161b22', color: '#484f58',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: '1.5',
              textAlign: 'right', userSelect: 'none', borderRight: '1px solid #30363d',
              whiteSpace: 'pre-wrap', flexShrink: 0
            }}>
              {lineNumbers}
            </div>
            <textarea
              ref={textareaRef}
              readOnly={readOnly}
              value={currentCode}
              onChange={e => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                flex: 1, height: '100%', padding: '16px',
                background: '#0d1117', color: '#e6edf3',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.5',
                border: 'none', outline: 'none', resize: 'none', tabSize: 2,
                whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
