import React, { useEffect, useRef, useState } from 'react';

// Transform JSX source into browser-runnable code
const transformCodeForBrowser = (code) => {
  if (!code) return '';
  
  // Step 1: Extract component name from export default
  let componentName = null;
  const fnMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  const clsMatch = code.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/);
  const constMatch = code.match(/export\s+default\s+([A-Za-z0-9_]+)/);
  
  if (fnMatch) componentName = fnMatch[1];
  else if (clsMatch) componentName = clsMatch[1];
  else if (constMatch && constMatch[1] !== 'function' && constMatch[1] !== 'class') componentName = constMatch[1];

  // Step 2: Collect all named hooks/items destructured from 'react'
  const reactHooks = new Set(['useState','useEffect','useRef','useCallback','useMemo','useReducer','useContext','useId','useLayoutEffect','useInsertionEffect','useTransition','useDeferredValue','useImperativeHandle','useDebugValue','createContext','memo','forwardRef','lazy','Suspense','Fragment']);
  const destructured = new Set();
  
  code.replace(/import\s+React\s*,?\s*\{([^}]+)\}\s+from\s+['"]react['"]/gs, (_, imports) => {
    imports.split(',').forEach(s => {
      const name = s.trim();
      if (name && reactHooks.has(name)) destructured.add(name);
    });
  });

  let clean = code
    // Remove lucide-react imports
    .replace(/import\s+(?:(?:\s*\{[\s\S]*?\}\s*|\s*\*\s*as\s+\w+\s*|\s*[\w$]+\s*,?\s*(?:\{[\s\S]*?\}\s*)?)\s+from\s+)?['"]lucide-react['"];?/gi, '')
    // Remove ALL other import statements safely without wiping intermediate code
    .replace(/import\s+(?:(?:\s*\{[\s\S]*?\}\s*|\s*\*\s*as\s+\w+\s*|\s*[\w$]+\s*,?\s*(?:\{[\s\S]*?\}\s*)?)\s+from\s+)?['"][^'"]+['"];?/gi, '')
    .replace(/import\s+['"][^'"]+['"];?/gi, '')
    // Convert top-level const declarations to var so concatenated files don't collide
    .replace(/^const\s+/gm, 'var ')
    // export default function Name → var Name = function
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'var $1 = function')
    // export default class Name → class Name
    .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'class $1')
    // export const / export function → plain
    .replace(/export\s+const\s+/g, 'var ')
    .replace(/export\s+function\s+([A-Za-z0-9_]+)/g, 'var $1 = function')
    // top-level function declarations → var Name = function
    .replace(/^function\s+([A-Za-z0-9_]+)/gm, 'var $1 = function')
    // any remaining export default
    .replace(/export\s+default\s+/g, 'window.DefaultExport = ');

  // Step 3: Prepend React hook destructuring so useState etc. are defined
  let prefix = `var { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext } = React;\n`;
  if (destructured.size > 0) {
    prefix = `var { ${[...destructured].join(', ')} } = React;\n`;
  }

  // Step 4: Append component registration at END
  let suffix = '';
  if (componentName) {
    suffix = `\nif (typeof ${componentName} !== 'undefined') window.DefaultExport = ${componentName};`;
  }

  return prefix + clean + suffix;
};

export const FastPreviewIframe = ({ generatedFiles, activePreviewFile, onSelectFrontendFile }) => {
  const iframeRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [error, setError] = useState(null);

  const isBackendFile = (filename, code = '') => {
    if (filename === 'server.js' || filename === 'server.ts' || filename === 'vercel.json' || filename === 'package.json') return true;
    if (code.includes("require('express')") || code.includes('require("express")') || code.includes('express()')) return true;
    return false;
  };

  const isCodeFile = (filename) => /\.(jsx|js|tsx|ts)$/i.test(filename) || !filename.includes('.');

  useEffect(() => {
    if (!generatedFiles || Object.keys(generatedFiles).length === 0 || !iframeRef.current) return;

    setError(null);
    let allCode = '';

    // Filter out backend files from browser React bundle
    Object.entries(generatedFiles).forEach(([filename, code]) => {
      if (filename !== activePreviewFile && isCodeFile(filename) && !isBackendFile(filename, code)) {
        const clean = transformCodeForBrowser(code);
        allCode += `/* ── ${filename} ── */\n${clean}\n\n`;
      }
    });

    const validFrontendFiles = Object.keys(generatedFiles).filter(f => isCodeFile(f) && !isBackendFile(f, generatedFiles[f] || ''));
    const targetFile = (activePreviewFile && generatedFiles[activePreviewFile] && isCodeFile(activePreviewFile) && !isBackendFile(activePreviewFile, generatedFiles[activePreviewFile])) 
      ? activePreviewFile 
      : validFrontendFiles[0] || Object.keys(generatedFiles)[0];

    if (targetFile && generatedFiles[targetFile] && !isBackendFile(targetFile, generatedFiles[targetFile])) {
      const clean = transformCodeForBrowser(generatedFiles[targetFile]);
      allCode += `/* ── ${targetFile} (Active) ── */\n${clean}\n\n`;
    }

    const docHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script>
    // Browser polyfill for CommonJS require/module/exports so Express server files never crash
    window.process = { env: { NODE_ENV: 'development', PORT: 5000 } };
    window.module = { exports: {} };
    window.exports = window.module.exports;
    window.require = function(mod) {
      if (mod === 'react') return window.React;
      if (mod === 'react-dom') return window.ReactDOM;
      if (mod === 'express') {
        var mockApp = function() {
          return {
            use: function() { return mockApp; },
            get: function() { return mockApp; },
            post: function() { return mockApp; },
            put: function() { return mockApp; },
            delete: function() { return mockApp; },
            listen: function(p, fn) { if (fn) fn(); return mockApp; }
          };
        };
        mockApp.json = function() { return function() {}; };
        mockApp.urlencoded = function() { return function() {}; };
        return mockApp;
      }
      if (mod === 'cors') return function() { return function() {}; };
      return {};
    };
  </script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@remix-run/router@1.15.3/dist/router.umd.min.js"></script>
  <script src="https://unpkg.com/react-router@6.22.3/dist/umd/react-router.production.min.js"></script>
  <script src="https://unpkg.com/react-router-dom@6.22.3/dist/umd/react-router-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
  <script>
    if (window.define && window.define.amd) { delete window.define.amd; delete window.define; }
  </script>
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/styled-components@6.1.13/dist/styled-components.min.js"></script>
  <script src="https://unpkg.com/@emotion/react@11.13.3/dist/emotion-react.umd.min.js"></script>
  <script src="https://unpkg.com/@emotion/styled@11.13.0/dist/emotion-styled.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    html, body { margin: 0; padding: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: #0d0d12; color: #f8fafc; }
    #root { min-height: 100vh; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      var rootEl = document.getElementById('root');
      function showError(title, msg) {
        rootEl.innerHTML = '<div style="color:#f87171;background:#1e1b4b;border:1px solid #6366f1;padding:1.5rem;margin:1.5rem;border-radius:12px;font-family:monospace;font-size:13px;white-space:pre-wrap;">' +
          '<strong style="font-size:14px;color:#818cf8;display:block;margin-bottom:8px;">⚠️ ' + title + '</strong>' +
          msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
      }

      try {
        var rawCode = ${JSON.stringify(allCode)};
        window.LucideIcons = new Proxy({}, { get: function(target, prop) { return function() { return React.createElement('span', {className: 'lucide-mock'}, '['+prop+']'); } } });
        
        if (window.styled && window.styled.default) {
          window.styled = window.styled.default;
        }
        if (window.styled) {
          window.createGlobalStyle = window.styled.createGlobalStyle;
          window.keyframes = window.styled.keyframes;
          window.ThemeProvider = window.styled.ThemeProvider;
        }

        if (window.ReactRouterDOM) {
          window.BrowserRouter = window.ReactRouterDOM.BrowserRouter;
          window.MemoryRouter = window.ReactRouterDOM.MemoryRouter;
          window.Routes = window.ReactRouterDOM.Routes;
          window.Route = window.ReactRouterDOM.Route;
          window.Link = window.ReactRouterDOM.Link;
          window.useNavigate = window.ReactRouterDOM.useNavigate;
          window.useLocation = window.ReactRouterDOM.useLocation;
          window.useParams = window.ReactRouterDOM.useParams;
        }
        if (!window.supabase || !window.supabase.createClient) {
          window.supabase = {
            createClient: function() {
              return {
                from: function() {
                  return {
                    select: function() { return Promise.resolve({ data: [], error: null }); },
                    insert: function() { return Promise.resolve({ data: [], error: null }); },
                    update: function() { return Promise.resolve({ data: [], error: null }); },
                    delete: function() { return Promise.resolve({ data: [], error: null }); },
                    on: function() { return { subscribe: function() {} }; }
                  };
                }
              };
            }
          };
        }
        
        var compiledCode = '';
        try {
          compiledCode = Babel.transform(rawCode, { presets: ['react'] }).code;
        } catch (compileErr) {
          showError('Syntax / Compilation Error', compileErr.message);
          return;
        }

        var runner = new Function(compiledCode);
        runner();

        var container = document.getElementById('root');
        var root = ReactDOM.createRoot(container);
        var Target = window.DefaultExport;

        if (!Target) {
          var funcs = Object.keys(window).filter(function(k) {
            return typeof window[k] === 'function' && /^[A-Z]/.test(k) && k !== 'React' && k !== 'ReactDOM';
          });
          if (funcs.length > 0) Target = window[funcs[0]];
        }

        if (Target) {
          if (window.ReactRouterDOM) {
            root.render(React.createElement(window.ReactRouterDOM.MemoryRouter, null, React.createElement(Target)));
          } else {
            root.render(React.createElement(Target));
          }
        } else {
          showError('Export Error', 'Component loaded, but no default export or main component was found in this file.\\nMake sure your component includes: export default function ComponentName() { ... }');
        }
      } catch (runtimeErr) {
        showError('Runtime Error', runtimeErr.message + (runtimeErr.stack ? '\\n\\n' + runtimeErr.stack : ''));
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
  }, [generatedFiles, activePreviewFile]);

  if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
    return (
      <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.85rem', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:32 }}>⚛️</div>
        <div>Generate a component to see live preview</div>
      </div>
    );
  }

  const selectedCode = generatedFiles[activePreviewFile] || '';
  if (activePreviewFile && isBackendFile(activePreviewFile, selectedCode)) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', padding: '32px' }}>
        <div style={{ maxWidth: '540px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: '#10b981', fontWeight: 800 }}>
            Serverless Backend API File ({activePreviewFile})
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            This is your Node.js Express backend API server file. It is automatically bundled into a Serverless Function when you click <strong>Deploy</strong>!
          </p>
          <button 
            onClick={() => onSelectFrontendFile && onSelectFrontendFile('App.jsx')}
            style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            👁️ Preview Frontend UI (App.jsx)
          </button>
        </div>
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
