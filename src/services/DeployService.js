/**
 * Deploys the generated project as a real static Vercel site.
 * SPARK owns the token — users just click Share and get a real hosted URL.
 */

// Transform JSX source into browser-runnable code (shared logic with FastPreviewIframe)
const transformCodeForBrowser = (code) => {
  // Step 1: Extract component name from export default
  let componentName = null;
  const fnMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  const clsMatch = code.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/);
  if (fnMatch) componentName = fnMatch[1];
  else if (clsMatch) componentName = clsMatch[1];

  // Step 2: Collect named React hooks from import statements
  const reactHooks = new Set(['useState','useEffect','useRef','useCallback','useMemo','useReducer','useContext','useId','useLayoutEffect','useInsertionEffect','useTransition','useDeferredValue','useImperativeHandle','useDebugValue','createContext','memo','forwardRef','lazy','Suspense','Fragment']);
  const destructured = new Set();
  code.replace(/import\s+React\s*,?\s*\{([^}]+)\}\s+from\s+['"]react['"]/g, (_, imports) => {
    imports.split(',').forEach(s => {
      const name = s.trim();
      if (name && reactHooks.has(name)) destructured.add(name);
    });
  });

  let clean = code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^import\s+.*?;?\s*$/gm, '')
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
    .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'class $1')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+default\s+/g, 'window.DefaultExport = ');

  // Step 3: Prepend React hooks destructuring
  const prefix = destructured.size > 0
    ? `const { ${[...destructured].join(', ')} } = React;\n`
    : `const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext } = React;\n`;

  // Step 4: Register component at end
  const suffix = componentName ? `\nwindow.DefaultExport = ${componentName};` : '';

  return prefix + clean + suffix;
};

const buildStandaloneHtml = (filesMap, projectName) => {
  let allCode = '';
  Object.entries(filesMap).forEach(([filename, code]) => {
    const clean = transformCodeForBrowser(code);
    allCode += `/* ── ${filename} ── */\n${clean}\n\n`;
  });

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName || 'SPARK App'}</title>
    <meta name="description" content="Built with SPARK Studio" />
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
      html, body { margin: 0; padding: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
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
            root.render(React.createElement('div', {
              style: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:'1.2rem', color:'#64748b' }
            }, 'App hosted successfully.'));
          }
        } catch (err) {
          console.error('[SPARK Deploy Error]', err);
          document.getElementById('root').innerHTML =
            '<div style="color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;padding:2rem;margin:2rem;border-radius:12px;font-family:monospace;white-space:pre-wrap;">' +
            '<strong>Runtime Error:</strong>\\n' + err.message + '</div>';
        }
      })();
    </script>
  </body>
</html>`;
};

export const deployProject = async (filesMap, projectName = 'spark-app', workspaceId = '') => {
  if (!filesMap || Object.keys(filesMap).length === 0) {
    throw new Error('No files to deploy. Generate a component first.');
  }

  const token = import.meta.env.VITE_VERCEL_TOKEN;
  if (!token) throw new Error('No deployment token configured. Contact SPARK support.');

  const baseName = projectName || 'spark-app';
  const suffix = workspaceId ? `-${workspaceId.split('-')[0]}` : '';
  const cleanName = `${baseName}${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 50);

  const html = buildStandaloneHtml(filesMap, projectName);

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: cleanName || 'spark-app',
      files: [{ file: 'index.html', data: html }],
      projectSettings: { framework: null, outputDirectory: '.' },
      target: 'production',
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('[Vercel Deploy Error]', result);
    throw new Error(result.error?.message || `Deployment failed (${response.status})`);
  }

  const deployUrl = result.url;
  if (!deployUrl) throw new Error('Deployment created but no URL returned.');
  return `https://${deployUrl}`;
};
