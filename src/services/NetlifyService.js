import { zipSync, strToU8 } from 'fflate';

const buildStandaloneHtml = (filesMap, cleanName) => {
  let allCode = '';
  Object.entries(filesMap).forEach(([filename, code]) => {
    const clean = code
      .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
      .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
      .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'class $1')
      .replace(/export\s+default\s+/g, 'var DefaultExport = ');
    allCode += `/* ── ${filename} ── */\n${clean}\n\n`;
  });

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanName}</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
      html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; }
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
          var Target = typeof DefaultExport !== 'undefined' ? DefaultExport : (typeof App !== 'undefined' ? App : null);
          if (Target) root.render(React.createElement(Target));
          else root.render(React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } }, 'App Hosted Successfully'));
        } catch (err) {
          document.body.innerHTML = '<div style="color:red;padding:2rem;font-family:monospace;">' + err.message + '</div>';
        }
      })();
    </script>
  </body>
</html>`;
};

export const deployToNetlify = async (filesMap, projectName = 'spark-app') => {
  if (!filesMap || Object.keys(filesMap).length === 0) {
    throw new Error('No files to deploy. Generate a component first.');
  }

  const token = import.meta.env.VITE_NETLIFY_TOKEN;
  if (!token) {
    throw new Error('NETLIFY_TOKEN_MISSING');
  }

  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30) || 'spark-app';
  const html = buildStandaloneHtml(filesMap, cleanName);

  // Step 1: Create a new Netlify site
  const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `${cleanName}-${Date.now()}` }),
  });

  if (!siteRes.ok) {
    const err = await siteRes.json();
    throw new Error(err.message || 'Failed to create Netlify site');
  }

  const site = await siteRes.json();
  const siteId = site.id;

  // Step 2: Deploy the zip to the site
  const zipData = { 'index.html': strToU8(html) };
  Object.entries(filesMap).forEach(([path, content]) => { zipData[path] = strToU8(content); });
  const zippedArray = zipSync(zipData);
  const zipBlob = new Blob([zippedArray], { type: 'application/zip' });

  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/zip',
    },
    body: zipBlob,
  });

  if (!deployRes.ok) {
    const err = await deployRes.json();
    throw new Error(err.message || 'Netlify deployment failed');
  }

  const deploy = await deployRes.json();
  return deploy.ssl_url || `https://${site.subdomain}.netlify.app`;
};
