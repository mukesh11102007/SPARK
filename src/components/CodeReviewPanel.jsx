import React, { useState } from 'react';

// A panel shown in the bottom AI BUILDER tab when code is pending review
export const CodeReviewPanel = ({ pendingFiles, originalPrompt, projectName, onApply, onDiscard, reviewResult, isReviewing }) => {
  const [activeFile, setActiveFile] = useState(() => pendingFiles ? Object.keys(pendingFiles)[0] : null);

  if (!pendingFiles || Object.keys(pendingFiles).length === 0) return null;

  const files = Object.keys(pendingFiles);
  const currentCode = pendingFiles[activeFile || files[0]] || '';

  const statusColor = reviewResult?.status === 'fixed' ? '#ffa657' : reviewResult?.status === 'ok' ? '#56d364' : '#79c0ff';
  const statusText = reviewResult?.status === 'fixed' ? '⚠️ Issues found & auto-fixed' : reviewResult?.status === 'ok' ? '✅ Code looks good' : '🔍 Review pending...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', borderTop: '1px solid #30363d' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e6edf3', letterSpacing: '0.5px' }}>
            🔍 CODE REVIEW
          </span>
          {isReviewing && (
            <span style={{ fontSize: '0.72rem', color: '#79c0ff', animation: 'pulse 1.5s infinite' }}>Reviewing...</span>
          )}
          {reviewResult && !isReviewing && (
            <span style={{ fontSize: '0.72rem', color: statusColor, fontWeight: 600 }}>{statusText}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onDiscard}
            style={{ padding: '3px 10px', borderRadius: '4px', background: 'transparent', border: '1px solid #f14c4c', color: '#f14c4c', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕ Discard
          </button>
          <button
            onClick={() => onApply(pendingFiles)}
            disabled={isReviewing}
            style={{ padding: '3px 10px', borderRadius: '4px', background: isReviewing ? '#333' : 'linear-gradient(135deg, #6e40c9, #58a6ff)', border: 'none', color: '#fff', fontSize: '0.75rem', cursor: isReviewing ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            ✓ Apply to Canvas
          </button>
        </div>
      </div>

      {/* Issues list if any */}
      {reviewResult?.issues && reviewResult.issues.length > 0 && (
        <div style={{ padding: '6px 12px', background: 'rgba(255,166,87,0.08)', borderBottom: '1px solid rgba(255,166,87,0.2)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#ffa657', fontWeight: 700, marginBottom: '4px' }}>ISSUES DETECTED & AUTO-FIXED:</div>
          {reviewResult.issues.map((issue, i) => (
            <div key={i} style={{ fontSize: '0.7rem', color: '#cdb', opacity: 0.8, marginBottom: '2px' }}>• {issue}</div>
          ))}
        </div>
      )}

      {/* File tabs */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: '2px', padding: '4px 8px', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0, overflowX: 'auto' }}>
          {files.map(f => (
            <button
              key={f}
              onClick={() => setActiveFile(f)}
              style={{ padding: '2px 10px', borderRadius: '4px', background: activeFile === f ? '#1f6feb' : 'transparent', border: 'none', color: activeFile === f ? '#fff' : '#8b949e', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Code display */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        <pre style={{
          margin: 0,
          fontSize: '0.72rem',
          lineHeight: 1.6,
          color: '#e6edf3',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {currentCode}
        </pre>
      </div>
    </div>
  );
};
