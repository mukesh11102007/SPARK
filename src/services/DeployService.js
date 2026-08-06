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
    ? `var { ${[...destructured].join(', ')} } = React;\n`
    : `var { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext } = React;\n`;

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
    <script src="https://unpkg.com/regenerator-runtime@0.14.0/runtime.js"></script>
    <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/styled-components@6.1.13/dist/styled-components.min.js"></script>
    <script src="https://unpkg.com/@emotion/react@11.13.3/dist/emotion-react.umd.min.js"></script>
    <script src="https://unpkg.com/@emotion/styled@11.13.0/dist/emotion-styled.umd.min.js"></script>
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
          // Setup styled-components global mapping
          if (window.styled && window.styled.default) {
            window.styled = window.styled.default;
          }
          if (window.styled) {
            window.createGlobalStyle = window.styled.createGlobalStyle;
            window.keyframes = window.styled.keyframes;
            window.ThemeProvider = window.styled.ThemeProvider;
          }

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

const getTeamId = async (token) => {
  try {
    const res = await fetch('https://api.vercel.com/v2/teams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.teams && data.teams.length > 0) {
        return data.teams[0].id;
      }
    }
  } catch (e) {
    console.error('[Vercel] Failed to fetch team ID', e);
  }
  return null;
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

  // Build full Vite project structure instead of standalone HTML
  const vercelFiles = [];
  Object.entries(filesMap).forEach(([filename, code]) => {
    vercelFiles.push({ file: `src/${filename}`, data: code });
  });

  let mainComponent = Object.keys(filesMap)
    .map(f => f.replace(/\.jsx?$/, ''))
    .find(c => /^[A-Z]/.test(c)) || 'App';

  for (const candidate of Object.keys(filesMap)) {
    const candidateName = candidate.replace(/\.jsx?$/, '');
    if (!/^[A-Z]/.test(candidateName)) continue; // Must be a component
    let isImported = false;
    for (const [filename, code] of Object.entries(filesMap)) {
      if (filename === candidate) continue;
      if (code.includes(`import ${candidateName}`) || code.includes(`from './${candidateName}'`)) {
        isImported = true;
        break;
      }
    }
    if (!isImported) {
      mainComponent = candidateName;
      // Prioritize files that look like main entry points
      if (candidateName.toLowerCase().includes('app') || candidateName.toLowerCase().includes('main') || candidateName.toLowerCase().includes('page')) {
        break;
      }
    }
  }

  if (!filesMap['App.jsx']) {
    let appJsxData = `import React from 'react';\nimport { BrowserRouter, Routes, Route } from 'react-router-dom';\n`;
    const components = Object.keys(filesMap)
      .map(f => f.replace(/\.jsx?$/, ''))
      .filter(c => /^[A-Z]/.test(c)); // Only include files starting with a Capital letter (React components)

    components.forEach(c => {
      appJsxData += `import ${c} from './${c}';\n`;
    });
    
    appJsxData += `\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <div style={{fontFamily:'Inter,sans-serif'}}>\n        <Routes>\n`;
    
    components.forEach(c => {
      const path = c === mainComponent ? '/' : `/${c}`;
      appJsxData += `          <Route path="${path}" element={<${c} />} />\n`;
      if (c === mainComponent) {
        appJsxData += `          <Route path="/${c}" element={<${c} />} />\n`;
      }
    });

    appJsxData += `        </Routes>\n      </div>\n    </BrowserRouter>\n  );\n}`;
    
    vercelFiles.push({ file: 'src/App.jsx', data: appJsxData });
  }

  vercelFiles.push({
    file: 'index.html',
    data: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${projectName || 'SPARK App'}</title>\n    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://unpkg.com/styled-components@6.1.13/dist/styled-components.min.js"></script>\n    <script src="https://unpkg.com/@emotion/react@11.13.3/dist/emotion-react.umd.min.js"></script>\n    <script src="https://unpkg.com/@emotion/styled@11.13.0/dist/emotion-styled.umd.min.js"></script>\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>`
  });

  vercelFiles.push({
    file: 'package.json',
    data: `{\n  "name": "${cleanName}",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1", "@supabase/supabase-js": "^2.42.0", "styled-components": "^6.1.13", "@emotion/react": "^11.13.3", "@emotion/styled": "^11.13.0", "react-router-dom": "^6.22.3" },\n  "devDependencies": { "@vitejs/plugin-react": "^4.2.1", "vite": "^5.2.0" }\n}`
  });

  vercelFiles.push({
    file: 'vite.config.js',
    data: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })`
  });

  vercelFiles.push({
    file: 'src/main.jsx',
    data: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<App />)`
  });

  const teamId = await getTeamId(token);
  const teamParam = teamId ? `?teamId=${teamId}` : '';

  const response = await fetch(`https://api.vercel.com/v13/deployments${teamParam}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: cleanName || 'spark-app',
      files: vercelFiles,
      projectSettings: { framework: 'vite', outputDirectory: 'dist' },
      target: 'production',
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('[Vercel Deploy Error]', result);
    throw new Error(result.error?.message || `Deployment failed (${response.status})`);
  }

  // Disable Vercel Authentication (SSO Protection) for this project
  if (result.projectId) {
    try {
      const patchRes = await fetch(`https://api.vercel.com/v9/projects/${result.projectId}${teamParam}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssoProtection: null,
          passwordProtection: null
        }),
      });
      if (!patchRes.ok) {
        console.warn('[Vercel Deploy] PATCH request failed with status:', patchRes.status, await patchRes.json());
      }
    } catch (err) {
      console.warn('[Vercel Deploy] Failed to disable SSO protection', err);
    }
  }

  const deployUrl = result.url;
  if (!deployUrl) throw new Error('Deployment created but no URL returned.');
  return `https://${deployUrl}`;
};
