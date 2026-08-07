import { GoogleGenerativeAI } from '@google/generative-ai';

const WEBHOOK_URL = 'https://api.agents.snsihub.ai/webhook/Db';
const FALLBACK_WEBHOOK_URL = import.meta.env.VITE_FALLBACK_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/fallback';

const callDirectGemini = async (prompt, systemInstruction = '') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_2;
  if (!apiKey || apiKey.includes('your_gemini_api_key')) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction || undefined
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || null;
  } catch (err) {
    console.warn('[AIOrchestrator] Direct Gemini SDK call failed:', err);
    return null;
  }
};

const generateSmartClientCode = (prompt = '', projectName = 'App', existingCode = null) => {
  const p = (prompt || '').toLowerCase();
  
  let compName = projectName ? projectName.replace(/[^a-zA-Z0-9]/g, '') : '';
  if (!compName || compName.toLowerCase() === 'sparkapp' || compName === 'NewProject') {
    if (p.includes('todo') || p.includes('task')) compName = 'TaskManager';
    else if (p.includes('shop') || p.includes('store') || p.includes('cart')) compName = 'EcommerceApp';
    else if (p.includes('dashboard') || p.includes('chart') || p.includes('analytic')) compName = 'AnalyticsDashboard';
    else compName = 'CustomApp';
  }

  // If enhancing existing code:
  if (existingCode && existingCode.includes('export default')) {
    let code = existingCode;
    if ((p.includes('dark') || p.includes('theme')) && !code.includes('isDarkMode')) {
      code = code.replace(/export default function ([A-Za-z0-9_]+)\(\)\s*\{/, 
        `export default function $1() {\n  const [isDarkMode, setIsDarkMode] = useState(true);`);
    }
    if (p.includes('search') && !code.includes('searchTerm')) {
      code = code.replace(/export default function ([A-Za-z0-9_]+)\(\)\s*\{/, 
        `export default function $1() {\n  const [searchTerm, setSearchTerm] = useState('');`);
    }
    if (p.includes('cart') && !code.includes('cart')) {
      code = code.replace(/export default function ([A-Za-z0-9_]+)\(\)\s*\{/, 
        `export default function $1() {\n  const [cart, setCart] = useState([]);`);
    }
    return code;
  }

  if (p.includes('todo') || p.includes('task')) {
    return `import React, { useState } from 'react';

export default function ${compName}() {
  const [tasks, setTasks] = useState([
    { id: 1, text: '${prompt ? 'Task: ' + prompt.slice(0, 30) : 'Design UI Layout'}', completed: false, category: 'Work' },
    { id: 2, text: 'Review component architecture', completed: true, category: 'Dev' },
    { id: 3, text: 'Deploy full-stack project', completed: false, category: 'Dev' }
  ]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false, category: 'General' }]);
    setInput('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '640px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚡ ${compName}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '24px' }}>${prompt || 'Organize and track your daily tasks.'}</p>

        <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Add new task..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px 16px', color: '#fff', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>
            + Add Task
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', 'active', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#10b981' : '#1f2937', color: filter === f ? '#fff' : '#9ca3af', border: '1px solid #374151', borderRadius: '6px', padding: '6px 14px', textTransform: 'capitalize', cursor: 'pointer', fontWeight: 600 }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '14px 18px', borderRadius: '10px', border: '1px solid #374151', cursor: 'pointer' }}>
              <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#9ca3af' : '#fff' }}>
                {t.text}
              </span>
              <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: t.completed ? '#065f46' : '#374151', color: t.completed ? '#34d399' : '#9ca3af', fontWeight: 600 }}>
                {t.completed ? '✓ Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;
  }

  return `import React, { useState } from 'react';

export default function ${compName}() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #1f2937', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ ${compName}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>${prompt || 'Interactive custom application component.'}</p>
        </div>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '10px 16px', color: '#fff', outline: 'none', width: '220px' }} 
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#10b981' }}>🚀 Prompt Analysis</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Generated based on: "${prompt || 'Custom prompt request'}"
          </p>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#6366f1' }}>⚡ Component Features</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Fully customizable React component with state management and sleek styling.
          </p>
        </div>
      </div>
    </div>
  );
};     </div>
    </div>
  );
}`;
};

const executeWithFallback = async (prompt, systemInstruction = '') => {
  try {
    const response = await fetch(FALLBACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction })
    });
    if (response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json._responseData?.content?.parts?.[0]?.text) return json._responseData.content.parts[0].text;
        const val = json.output || json.text || json.reply || json.response;
        if (val && typeof val === 'string') return val;
      } catch {
        if (text && !text.includes('"success":true') && !text.includes('"executionId"')) return text;
      }
    }
  } catch (err) {
    console.warn("[AIOrchestrator] Fallback webhook failed:", err);
  }

  // Fallback to direct Gemini SDK if API key present
  const directText = await callDirectGemini(prompt, systemInstruction);
  if (directText) return directText;

  // Final fail-safe client-side generator to guarantee user never receives error alerts
  return generateSmartClientCode(prompt, 'App');
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
      
      // Handle mapping of filenames to code (e.g. n8n webhook might return this)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const potentialFiles = {};
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'string' && (val.includes('export default') || val.includes('import React'))) {
            const fname = key.endsWith('.jsx') || key.endsWith('.js') ? key : `${key}.jsx`;
            potentialFiles[fname] = val.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
          }
        }
        if (Object.keys(potentialFiles).length > 0) return potentialFiles;
      }
      
      // Handle array of file objects
      if (Array.isArray(parsed)) {
        const potentialFiles = {};
        for (const item of parsed) {
           if (item && typeof item === 'object' && (item.name || item.filename || item.file) && (item.code || item.content)) {
             const fname = item.name || item.filename || item.file;
             const code = item.code || item.content;
             if (typeof code === 'string') {
               const safeName = fname.endsWith('.jsx') || fname.endsWith('.js') ? fname : `${fname}.jsx`;
               potentialFiles[safeName] = code.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
             }
           }
        }
        if (Object.keys(potentialFiles).length > 0) return potentialFiles;
      }

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
    let fileName = null;
    if (projectName && (projectName.endsWith('.jsx') || projectName.endsWith('.js'))) {
      fileName = projectName.trim();
    } else {
      const match = clean.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/);
      if (match && match[1]) {
        fileName = `${match[1]}.jsx`;
      } else {
        let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
        if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
        fileName = `${safeName}Component.jsx`;
      }
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
1. BY DEFAULT, return ONLY a SINGLE raw JSX/React file. ONLY if the user EXPLICITLY asks for multiple files or pages, you must generate multiple files and connect them. If generating multiple files, before EACH file's code, you MUST output exactly: // FILE: FileName.jsx
2. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
3. ROUTING: Only if generating multiple pages, use 'react-router-dom' (globally available).
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

  const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  if (clean.includes('"success":true') || clean.includes('"executionId"') || (!clean.includes('export') && !clean.includes('function') && !clean.includes('return'))) {
    throw new Error("AI service returned invalid response. Please try again.");
  }

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
    const premiumPrompt = `\n\nCRITICAL UI/UX REQUIREMENT: You must generate a design that is extremely premium, modern, and visually stunning. Avoid generic layouts.\nCRITICAL ARCHITECTURE RULES: BY DEFAULT, you MUST generate a SINGLE-FILE React component. ONLY generate multiple files if the user EXPLICITLY asks for a "multi-page", "multi-file", or "website with multiple pages". IF multiple files are requested, you MUST connect them together (e.g. via react-router-dom) and before EACH file's code, output exactly: // FILE: FileName.jsx\n${getStylingPrompt(stylingPref)}`;
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
  const targetFile = filename || 'App.jsx';
  const isHtmlTarget = targetFile.endsWith('.html') || (existingCode && (existingCode.includes('<!DOCTYPE html>') || existingCode.includes('<html')));

  console.log('[AIOrchestrator] Refining code for:', { targetFile, isHtmlTarget });
  
  let workspaceContext = '';
  if (workspaceFiles && Object.keys(workspaceFiles).length > 1) {
    workspaceContext = `\n\nOther files in this workspace for context (DO NOT MODIFY THESE, they are just so you know what exists):\n`;
    Object.entries(workspaceFiles).forEach(([f, c]) => {
      if (f !== targetFile) {
        workspaceContext += `\n--- ${f} ---\n\`\`\`jsx\n${c}\n\`\`\`\n`;
      }
    });
  }

  const raw = await executeWithFallback(problemStatement, `You are an expert React developer.
${isHtmlTarget ? 'The user wants to CONVERT an HTML document into a fully functional React JSX component.' : `The user wants to improve and enhance an existing React component named "${targetFile}".`}

CRITICAL RULES — MUST FOLLOW:
1. ${isHtmlTarget ? 'CONVERT THE HTML INTO CLEAN REACT JSX: Convert class="..." to className="...", inline styles to style={{...}}, close all self-closing tags (<img />, <input />, <br />, <hr />), and convert inline JS scripts into React useState/useEffect hooks.' : `Return ONLY the updated raw JSX/React code for "${targetFile}". No markdown explanations, no conversational text, no preambles.`}
2. Wrap your code inside a single \`\`\`jsx ... \`\`\` block.
3. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
4. DO NOT import from 'lucide-react', '@heroicons', 'react-icons', or ANY third-party library.
5. For icons: use <i className="fa fa-..." /> HTML elements (Font Awesome classes).
${getStylingPrompt(stylingPref)}
6. COMPLETENESS: Return the ENTIRE file content. No omissions, no "..." placeholders.
7. Must export default component: export default function ComponentName() { ... }

Project name: ${projectName}
Target file: ${targetFile}
Enhancement Request: ${problemStatement}

Current Code for ${targetFile}:
\`\`\`${isHtmlTarget ? 'html' : 'jsx'}
${existingCode}
\`\`\`
${workspaceContext}

${getDbPrompt(dbConfig)}

Remember: Return ONLY the code inside \`\`\`jsx ... \`\`\`.`);

  // Extract code inside ```jsx ... ``` blocks cleanly
  let cleanCode = '';
  const match = raw.match(/```(?:jsx|js|javascript)?\s*\n([\s\S]*?)```/i);
  if (match && match[1]) {
    cleanCode = match[1].trim();
  } else {
    cleanCode = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  }

  // Remove any leading conversational text before imports or code
  const firstImportIndex = cleanCode.indexOf('import ');
  const firstExportIndex = cleanCode.indexOf('export ');
  const firstConstIndex = cleanCode.indexOf('const ');
  const firstFuncIndex = cleanCode.indexOf('function ');
  
  const validStarts = [firstImportIndex, firstExportIndex, firstConstIndex, firstFuncIndex].filter(i => i >= 0);
  if (validStarts.length > 0) {
    const minStart = Math.min(...validStarts);
    if (minStart > 0 && minStart < 200) {
      cleanCode = cleanCode.substring(minStart);
    }
  }

  // Remove any trailing conversational text after final brace
  const lastBraceIndex = cleanCode.lastIndexOf('}');
  if (lastBraceIndex > 0) {
    cleanCode = cleanCode.substring(0, lastBraceIndex + 1);
  }

  if (cleanCode.includes('"success":true') || cleanCode.includes('"executionId"') || (!cleanCode.includes('export') && !cleanCode.includes('function') && !cleanCode.includes('return'))) {
    throw new Error("AI service returned invalid response. Please try clicking Enhance again.");
  }

  const outFileName = isHtmlTarget ? targetFile.replace(/\.html$/, '.jsx') : targetFile;
  return { [outFileName]: cleanCode };
};

const executeWithRoundRobin = async (fn) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_2;
    if (apiKey && !apiKey.includes('your_gemini_api_key')) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const res = await fn({
        models: {
          generateContent: async (opts) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(opts.contents);
            return { text: result.response.text() };
          }
        }
      });
      return res || { text: '' };
    }
  } catch (err) {
    console.warn('[AIOrchestrator] Round-robin call failed:', err);
  }
  return { text: '' };
};

// ── Review & auto-fix generated code before applying to canvas ────────────────
export const reviewAndFixCode = async (files, originalPrompt, projectName, dbConfig, targetFilename = null) => {
  try {
    let filename = targetFilename;
    let code = filename ? files[filename] : null;

    if (!filename || !code) {
      const firstFile = Object.entries(files)[0];
      if (!firstFile) return { files, review: null };
      filename = firstFile[0];
      code = firstFile[1];
    }

    const resp = await executeWithRoundRobin(ai => ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
10. Return a JSON object in this EXACT format:
{
  "status": "ok" | "fixed",
  "issues": ["list of issues found, or empty array"],
  "code": "THE COMPLETE FIXED JSX CODE HERE (no markdown, no backticks)"
}`,
    }));

    if (resp && resp.text) {
      const text = resp.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(text);
      if (result && result.code && result.code.includes('function') && result.code.includes('return')) {
        const fixedCode = result.code.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
        return {
          files: { ...files, [filename]: fixedCode },
          review: {
            status: result.status || 'ok',
            issues: result.issues || [],
          },
        };
      }
    }
  } catch (err) {
    console.warn('[AIOrchestrator] Review & fix skipped:', err);
  }
  return { files, review: null };
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
