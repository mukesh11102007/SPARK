import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const MonacoEditorPanel = ({ code, fileName, onSave, onClose }) => {
  const [currentCode, setCurrentCode] = useState(code);

  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      padding: '40px', boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)',
        borderRadius: '12px 12px 0 0', padding: '16px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fa fa-code" style={{ color: 'var(--accent-color, #4d3df7)' }}></i>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'monospace' }}>{fileName}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onSave(currentCode)}
            style={{
              padding: '8px 16px', background: 'var(--accent-color, #4d3df7)',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: '600'
            }}>
            Save Changes
          </button>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'transparent',
              color: 'var(--text-main)', border: '1px solid var(--panel-border)',
              borderRadius: '6px', cursor: 'pointer'
            }}>
            Close
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={currentCode}
          onChange={(value) => setCurrentCode(value)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 20 },
            scrollBeyondLastLine: false
          }}
        />
      </div>
    </div>
  );
};
