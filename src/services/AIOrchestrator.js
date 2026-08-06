const WEBHOOK_URL = 'https://api.agents.snsihub.ai/webhook/Db';
const FALLBACK_WEBHOOK_URL = import.meta.env.VITE_FALLBACK_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/fallback';

const executeWithFallback = async (prompt, systemInstruction = '') => {
  try {
    const response = await fetch(FALLBACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction })
    });
    if (!response.ok) throw new Error(`Fallback webhook failed: ${response.status}`);
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json._responseData?.content?.parts?.[0]?.text) return json._responseData.content.parts[0].text;
      return json.output || json.text || json.reply || json.response || text;
    } catch {
      return text;
    }
  } catch (err) {
    console.error("[AIOrchestrator] Fatal: Fallback webhook also failed.", err);
    throw new Error("Both primary and fallback AI services are currently unavailable.");
  }
};

// Helper to recursively find JS/JSX code in nested JSON objects
const findCodeInObject = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.includes('export default') || trimmed.includes('return (') || (trimmed.includes('import React') && trimmed.includes('function'))) {
      return trimmed;
    }
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findCodeInObject(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    const priorityKeys = ['code', 'response', 'text', 'content', 'output', 'items', 'json', 'body', 'data', 'result'];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findCodeInObject(obj[key]);
        if (found) return found;
      }
    }
    for (const val of Object.values(obj)) {
      const found = findCodeInObject(val);
      if (found) return found;
    }
  }
  return null;
};

// ── Extract React code from any response format ─────────────────────────────
const extractCode = (raw, projectName) => {
  let text = raw.trim();

  // 1. Try parsing multiple files using "// FILE: filename.jsx" delimiter
  const fileRegex = /\/\/\s*FILE:\s*([a-zA-Z0-9_.-]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/gi;
  let hasFiles = false;
  const files = {};
  
  let fileMatch;
  while ((fileMatch = fileRegex.exec(text)) !== null) {
    hasFiles = true;
    let fileName = fileMatch[1].trim();
    if (!fileName.endsWith('.jsx') && !fileName.endsWith('.js')) fileName += '.jsx';
    const fileCode = fileMatch[2].replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    if (fileCode) files[fileName] = fileCode;
  }
  
  if (hasFiles && Object.keys(files).length > 0) {
    return files;
  }

  // 2. Try parsing JSON format
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
      const extracted = findCodeInObject(parsed);
      if (extracted) {
        text = extracted;
      } else {
        return null; // Return null so caller falls back to Gemini API
      }
    } catch {}
  }

  // Treat as raw code
  const clean = text.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  if (!clean.startsWith('{') && !clean.startsWith('[') && clean.length > 50 && (clean.includes('export default') || (clean.includes('function') && clean.includes('return')))) {
    const match = clean.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/);
    let fileName;
    if (match && match[1]) {
      fileName = `${match[1]}.jsx`;
    } else {
      let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
      if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
      fileName = `${safeName}Component.jsx`;
    }
    return { [fileName]: clean };
  }

  return null;
};

// ── Styling Prompt Helper ───────────────────────────────────────────────────
const getStylingPrompt = (preference) => {
  switch (preference) {
    case 'tailwind':
      return `5. **STYLING**: You MUST use Tailwind CSS utility classes (e.g., className="bg-blue-500 hover:bg-blue-600"). Do not use inline styles or styled-components. Assume a standard Tailwind installation is present.`;
    case 'inline':
      return `5. **STYLING**: Use ONLY inline styles (style={{...}}). Do not use Tailwind, external CSS, or styled-components.`;
    case 'css-modules':
      return `5. **STYLING**: You MUST use CSS Modules. Assume you can import styles via \`import styles from './styles.module.css';\` and apply them via \`className={styles.container}\`.`;
    case 'emotion':
      return `5. **STYLING**: You MUST use Emotion (\`@emotion/react\` or \`@emotion/styled\`). Import it like \`import styled from '@emotion/styled';\`. DO NOT use inline styles.`;
    case 'styled-components':
    default:
      return `5. **STYLING**: DO NOT use inline styles unless absolutely necessary. You MUST use \`styled-components\` for styling to support pseudo-classes like :hover and media queries. Import it like \`import styled from 'styled-components';\`.`;
  }
};

// ── Supabase Prompt Helper ───────────────────────────────────────────────────
const getDbPrompt = (dbConfig) => {
  if (!dbConfig || dbConfig.status !== 'active') return '';
  return `
[SUPABASE REAL-TIME DATABASE INTEGRATION REQUIRED]
The user has provisioned a real Supabase database. You MUST write this component to interact with it!
- Do NOT import '@supabase/supabase-js'. It is loaded via CDN and available as \`window.supabase\`.
- Initialize the client OUTSIDE the component: 
  \`const supabase = window.supabase.createClient('${dbConfig.url}', '${dbConfig.anonKey}');\`
- Use the exact table name: '${dbConfig.table}' (this is a NoSQL-like logs table).
- The ONLY columns in this table are: \`id\`, \`created_at\`, \`workspace_id\`, and \`payload\`.
- CRITICAL: You CANNOT insert custom columns like 'name', 'price', etc. You MUST wrap ALL your app data inside the JSONB \`payload\` column!
- Example Insert:
  \`await supabase.from('${dbConfig.table}').insert([{ workspace_id: '${dbConfig.workspaceId}', payload: { type: 'YourModelName', field1: 'value1', field2: 'value2' } }]);\`
- Example Fetch:
  \`const { data } = await supabase.from('${dbConfig.table}').select('*').eq('workspace_id', '${dbConfig.workspaceId}');\`
- Extract your actual data from the \`payload\` column when reading (e.g. \`item.payload.field1\`).
- IMPORTANT: Set up real-time subscriptions in a useEffect to listen for inserts/updates/deletes on this table:
  \`supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public', table: '${dbConfig.table}', filter: 'workspace_id=eq.${dbConfig.workspaceId}' }, (payload) => { /* handle realtime update */ }).subscribe();\`
- The UI MUST reflect real data fetched from this Supabase table.
`;
};

const generateWithGemini = async (prompt, projectName, dbConfig, stylingPref = 'styled-components') => {
  console.log('[AIOrchestrator] Falling back to Webhook Fallback...');
  const raw = await executeWithFallback(prompt, `You are an expert React developer. Generate a complete React application for the following request.

CRITICAL RULES — MUST FOLLOW:
1. If generating a single file, return ONLY raw JSX/React code. If generating multiple files (like a multi-page app), before EACH file's code, you MUST output exactly: // FILE: FileName.jsx
2. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
3. ROUTING: For multi-page apps, you MUST create an App.jsx that uses react-router-dom for routing. 'react-router-dom' is globally available, so import it like: import { BrowserRouter, MemoryRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
4. DO NOT import from 'lucide-react', '@heroicons', 'react-icons', or ANY third-party library.
5. For icons: use <i className="fa fa-..." /> HTML elements (Font Awesome classes like fa-home, fa-user, fa-cog).
${getStylingPrompt(stylingPref)}
7. Each component MUST have: export default function ComponentName() { ... }
8. No TypeScript. No JSX fragments as the top-level export.
9. Code must be completely free of syntax errors, undefined variables, and runtime errors.
10. The component must be fully functional with sample/demo data included inline.
11. AESTHETICS ARE VERY IMPORTANT. The UI must be extremely premium, modern, and beautiful. Use smooth gradients, glassmorphism, dark/light sleek themes, subtle micro-animations, and modern typography.

Project name: ${projectName}
User request: ${prompt}
${getDbPrompt(dbConfig)}`);
  const files = extractCode(raw, projectName);
  if (files) return files;

  const clean = raw.replace(/\`\`\`jsx?/gi, '').replace(/\`\`\`/g, '').trim();
  const match = clean.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/);
  let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
  if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
  const fileName = (match && match[1]) ? `${match[1]}.jsx` : `${safeName}Component.jsx`;
  return { [fileName]: clean };
};

// ── Main export ─────────────────────────────────────────────────────────────
export const generateAppFromVoice = async (prompt, projectName = 'MyProject', dbConfig = null, stylingPref = 'styled-components') => {
  console.log('[AIOrchestrator] Generating for:', { prompt, projectName, stylingPref });

  // 2-minute timeout on webhook
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const premiumPrompt = `\n\nCRITICAL UI/UX REQUIREMENT: You must generate a design that is extremely premium, modern, and visually stunning. Avoid generic layouts.\nCRITICAL ROUTING & MULTI-PAGE RULES: If the user requests multiple pages or an interconnected app, you MUST generate multiple files. Before EACH file's code, output exactly: // FILE: FileName.jsx\nUse 'react-router-dom' for routing (e.g., import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom').\n${getStylingPrompt(stylingPref)}`;
    const fullPrompt = prompt + premiumPrompt + '\n' + getDbPrompt(dbConfig);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt, projectName, dbConfig, stylingPreference: stylingPref }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[AIOrchestrator] Webhook failed, falling back...');
      return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);
    }

    const rawText = await response.text();
    console.log('[AIOrchestrator] Raw webhook response:', rawText);

    const files = extractCode(rawText, projectName);
    if (files) return files;

    // Webhook returned empty/metadata — fall back
    console.warn('[AIOrchestrator] Webhook returned no code. Falling back...');
    return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.warn('[AIOrchestrator] Webhook timed out. Falling back...');
      return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);
    }
    throw e;
  }
};

// ── Refine existing code via Gemini ──────────────────────────────────────────
export const refineAppCode = async (existingCode, problemStatement, projectName, filename, dbConfig = null, workspaceFiles = null, stylingPref = 'styled-components') => {
  console.log('[AIOrchestrator] Refining code with Gemini...', { filename });
  
  let workspaceContext = '';
  if (workspaceFiles && Object.keys(workspaceFiles).length > 1) {
    workspaceContext = `\n\nOther files in this workspace for context (DO NOT MODIFY THESE, they are just so you know what exists):\n`;
    Object.entries(workspaceFiles).forEach(([f, c]) => {
      if (f !== filename) {
        workspaceContext += `\n--- ${f} ---\n\`\`\`jsx\n${c}\n\`\`\`\n`;
      }
    });
  }

  const raw = await executeWithFallback(problemStatement, `You are an expert React developer.
The user wants to improve an existing React component.

CRITICAL RULES — MUST FOLLOW:
1. Return ONLY raw JSX/React code. No markdown, no backticks, no explanation.
2. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
3. DO NOT import from 'lucide-react', '@heroicons', 'react-icons', or ANY third-party library.
4. For icons: use <i className="fa fa-..." /> HTML elements (Font Awesome classes).
${getStylingPrompt(stylingPref)}
7. **COMPATIBILITY**: You are running in a browser environment. Do not use Node.js modules like 'fs' or 'path'.
8. **COMPLETENESS**: Return the ENTIRE file content. No omissions, no "..." placeholders.
9. PREMIUM DESIGN: Retain and enhance any premium design aesthetics (gradients, glassmorphism, animations). Never downgrade the UI to look plain.

Project name: ${projectName}
Refinement Request: ${problemStatement}

Current Code for ${filename}:
\`\`\`jsx
${existingCode}
\`\`\`
${workspaceContext}

${getDbPrompt(dbConfig)}

Remember: ONLY return the raw code.`);
  const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
  if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
  
  // If a filename was passed, sanitize it just in case it came from an old broken generation
  const safeFilename = filename ? filename.replace(/[^a-zA-Z0-9.]/g, '') : null;
  const outName = safeFilename || `${safeName}Component.jsx`;
  return { [outName]: clean };
};

// ── Review & auto-fix generated code before applying to canvas ────────────────
export const reviewAndFixCode = async (files, originalPrompt, projectName, dbConfig, targetFilename = null) => {
  let filename = targetFilename;
  let code = filename ? files[filename] : null;

  if (!filename || !code) {
    const firstFile = Object.entries(files)[0];
    if (!firstFile) return { files, review: null };
    filename = firstFile[0];
    code = firstFile[1];
  }

  const resp = await executeWithRoundRobin(ai => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a senior React code reviewer and fixer.

Original user request: "${originalPrompt}"
Project name: "${projectName}"

Generated code:
\`\`\`jsx
${code}
\`\`\`

${getDbPrompt(dbConfig)}

Your job:
1. Check if the code matches the user's request.
2. Check for any syntax errors, missing imports, undefined variables.
3. CRITICAL: Remove ALL imports from lucide-react, @heroicons, react-icons, or any third-party library. Replace icon usage with <i className="fa fa-iconname" /> (Font Awesome) HTML elements.
4. CRITICAL: The ONLY allowed import is: import React, { useState, useEffect, useRef } from 'react';
5. Ensure ALL styles are inline (style={{}}). Remove any CSS class references to external stylesheets.
6. Verify that the default export exists as: export default function ComponentName() { ... }
7. CRITICAL: If the code uses a simulated backend, localStorage, or alert() popups to simulate saving data, you MUST completely rewrite those parts to use the Supabase real-time database exactly as instructed above!
8. AESTHETICS: Ensure the code produces an extremely premium, stunning, and modern UI. If the styling looks too basic, enhance it with gradients, shadows, and better spacing using inline styles.
9. Fix ALL problems and return corrected code.
9. Return a JSON object in this EXACT format:
{
  "status": "ok" | "fixed",
  "issues": ["list of issues found, or empty array"],
  "code": "THE COMPLETE FIXED JSX CODE HERE (no markdown, no backticks)"
}`,
  }));

  try {
    const text = (resp.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);
    const fixedCode = (result.code || code).replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    return {
      files: { ...files, [filename]: fixedCode },
      review: {
        status: result.status || 'ok',
        issues: result.issues || [],
      },
    };
  } catch {
    // If JSON parse fails, return original code with no review
    return { files, review: null };
  }
};

// ── Auto-Heal: Fix code based on error logs ───────────────────────────────────
export const autoHealCode = async (files, errorLog, dbConfig) => {
  const firstFile = Object.entries(files)[0];
  if (!firstFile) return files;
  const [filename, code] = firstFile;

  console.log('[AIOrchestrator] Auto-healing code...');
  const resp = await executeWithRoundRobin(ai => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert React debugger. The following React component crashed.

Error Log:
${errorLog}

${getDbPrompt(dbConfig)}

Your job: Component Code:
\`\`\`jsx
${code}
\`\`\`

Fix the code to resolve the error. Return ONLY the complete corrected raw JSX/React code. Do not include markdown, no \`\`\`, no explanation.`
  }));

  try {
    const raw = resp.text || '';
    const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    return { ...files, [filename]: clean };
  } catch {
    return files;
  }
};

export const chatWithProject = async (files, userMessage, sessionId = 'default-session') => {
  const fileContext = Object.entries(files || {})
    .map(([name, code]) => `File: ${name}\n\`\`\`javascript\n${code}\n\`\`\``)
    .join('\n\n');

  const CHAT_WEBHOOK_URL = import.meta.env.VITE_CHATBOT_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/chatbot';

  try {
    // 1. Try the n8n webhook to save tokens
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userMessage, fileContext })
    });

    if (response.ok) {
      const text = await response.text();
      // Try to parse the webhook JSON and extract the actual message text
      try {
        const json = JSON.parse(text);
        
        // Handle n8n raw node output structures
        if (json._responseData?.content?.parts?.[0]?.text) {
          return json._responseData.content.parts[0].text;
        }
        
        // Handle standard webhook payload keys
        if (json.output) return json.output;
        if (json.text) return json.text;
        if (json.reply) return json.reply;
        if (json.response) return json.response;
        if (json.message) return json.message;
        
        // If it's a nested array from n8n (e.g. [{output: "..."}])
        if (Array.isArray(json) && json[0]) {
           return json[0].output || json[0].text || json[0].message || text;
        }

        return text; // Fallback to raw string if no known key is found
      } catch {
        return text;
      }
    }
    throw new Error(`Webhook failed with status: ${response.status}`);
  } catch (err) {
    console.warn('[AIOrchestrator] Chat webhook failed, falling back to Gemini API...', err);
    
    // 2. Fallback to Fallback Webhook
    return await executeWithFallback(prompt, `You are a helpful AI developer assistant embedded in a code editor.\nThe user is asking you a question about their current workspace.\n\nHere are the current files in the workspace:\n${fileContext}`);
  }
};
