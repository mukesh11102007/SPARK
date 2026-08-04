import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor = ({ files = {}, onFilesChange, theme, activeFile, readOnly = false }) => {
  const safeFiles = files || {};

  const handleEditorChange = (value) => {
    if (readOnly) return;
    onFilesChange({ ...files, [activeFile]: value });
  };

  if (!activeFile) return null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column' }}>
      {readOnly && (
        <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
          🔒 Read-Only Mode — You have Viewer access. Contact workspace Owner to enable editing.
        </div>
      )}
      <div style={{ flex: 1, height: '100%' }}>
        <Editor
          height="100%"
          language="javascript"
          theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
          value={safeFiles[activeFile] || ''}
          onChange={handleEditorChange}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-family)',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
};
