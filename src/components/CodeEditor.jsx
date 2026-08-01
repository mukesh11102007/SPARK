import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor = ({ files = {}, onFilesChange, theme, activeFile }) => {
  const safeFiles = files || {};

  const handleEditorChange = (value) => {
    onFilesChange({ ...files, [activeFile]: value });
  };

  if (!activeFile) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Monaco Editor Full Screen */}
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language="javascript"
          theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
          value={safeFiles[activeFile] || ''}
          onChange={handleEditorChange}
          options={{
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
