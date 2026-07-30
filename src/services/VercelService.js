export const deployToVercel = async (filesMap, projectName = 'spark-generated-app') => {
  const token = import.meta.env.VITE_VERCEL_TOKEN;
  if (!token) throw new Error("Vercel token not configured.");

  // Convert filesMap (filename -> string) to Vercel API format
  const files = Object.entries(filesMap).map(([file, data]) => ({ file, data }));

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50) || 'spark-app',
      target: 'production',
      files,
      projectSettings: {
        framework: 'vite',
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[Vercel Deploy Error]', result);
    throw new Error(result.error?.message || 'Deployment failed');
  }

  // Vercel returns the URL as result.url
  return `https://${result.url}`;
};
