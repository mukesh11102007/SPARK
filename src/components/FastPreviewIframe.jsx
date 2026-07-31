import React, { useEffect, useRef } from 'react';

// Transform JSX source into browser-runnable code
const transformCodeForBrowser = (code) => {
  // Step 1: Extract component name from export default
  let componentName = null;
  const fnMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  const clsMatch = code.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/);
  if (fnMatch) componentName = fnMatch[1];
  else if (clsMatch) componentName = clsMatch[1];

  // Step 2: Collect all named hooks/items destructured from 'react'
  const reactHooks = new Set(['useState','useEffect','useRef','useCallback','useMemo','useReducer','useContext','useId','useLayoutEffect','useInsertionEffect','useTransition','useDeferredValue','useImperativeHandle','useDebugValue','createContext','memo','forwardRef','lazy','Suspense','Fragment']);
  const destructured = new Set();
  code.replace(/import\s+React\s*,?\s*\{([^}]+)\}\s+from\s+['"]react['"]/g, (_, imports) => {
    imports.split(',').forEach(s => {
      const name = s.trim();
      if (name && reactHooks.has(name)) destructured.add(name);
    });
  });

  let clean = code
    // Remove ALL import statements entirely
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    // Remove any remaining lone import lines
    .replace(/^import\s+.*?;?\s*$/gm, '')
    // export default function Name → function Name
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
    // export default class Name → class Name
    .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'class $1')
    // export const / export function → plain
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    // any remaining export default
    .replace(/export\s+default\s+/g, 'window.DefaultExport = ');

  // Step 3: Prepend React hook destructuring so useState etc. are defined
  let prefix = '';
  if (destructured.size > 0) {
    prefix = `const { ${[...destructured].join(', ')} } = React;\n`;
  } else {
    // Always make hooks available even if not explicitly imported
    prefix = `const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext } = React;\n`;
  }

  // Step 4: Append component registration at END
  let suffix = '';
  if (componentName) {
    suffix = `\nwindow.DefaultExport = ${componentName};`;
  }

  return prefix + clean + suffix;
};

export const FastPreviewIframe = ({ generatedFiles }) => {
  const iframeRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!generatedFiles || Object.keys(generatedFiles).length === 0 || !iframeRef.current) return;

    let allCode = '';
    Object.entries(generatedFiles).forEach(([filename, code]) => {
      const clean = transformCodeForBrowser(code);
      allCode += `/* ── ${filename} ── */\n${clean}\n\n`;
    });

    const docHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    html, body { margin: 0; padding: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; }
    #root { min-height: 100vh; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    (function() {
      try {
        ${allCode}
        var container = document.getElementById('root');
        var root = ReactDOM.createRoot(container);
        var Target = window.DefaultExport || (typeof App !== 'undefined' ? App : null);
        if (!Target) {
          var funcs = Object.keys(window).filter(function(k) {
            return typeof window[k] === 'function' && /^[A-Z]/.test(k) && k !== 'React' && k !== 'ReactDOM';
          });
          if (funcs.length > 0) Target = window[funcs[0]];
        }
        if (Target) {
          root.render(React.createElement(Target));
        } else {
          root.render(React.createElement('div', { style: { padding:'2rem', textAlign:'center', color:'#64748b' } }, 'Component loaded.'));
        }
      } catch (err) {
        console.error('[Preview Error]', err);
        document.getElementById('root').innerHTML =
          '<div style="color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;padding:1.5rem;margin:1rem;border-radius:8px;font-family:monospace;font-size:13px;white-space:pre-wrap;">' +
          '<strong>Preview Error:</strong>\\n' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = new Blob([docHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframeRef.current.src = url;

    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, [generatedFiles]);

  if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
    return (
      <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.85rem', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:32 }}>⚛️</div>
        <div>Generate a component to see live preview</div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title="Live Preview"
      style={{ width:'100%', height:'100%', border:'none', background:'#fff' }}
    />
  );
};
