import { GoogleGenAI } from '@google/genai';

const WEBHOOK_URL = 'https://api.agents.snsihub.ai/webhook-test/Db';
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// ── Extract React code from any response format ─────────────────────────────
const extractCode = (raw, projectName) => {
  let text = raw.trim();

  try {
    const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());

    // n8n Text-mode: _responseData holds the code
    if (parsed._responseData && typeof parsed._responseData === 'string' && parsed._responseData.trim()) {
      text = parsed._responseData.trim();
    }
    // n8n items array (what the webhook is actually returning!)
    else if (Array.isArray(parsed.items) && parsed.items[0]) {
      const j = parsed.items[0].json;
      // ✅ Gemini API format inside n8n: content.parts[0].text
      const candidate =
        j?.content?.parts?.[0]?.text ||   // <-- Gemini format (this is what your n8n returns!)
        j?.text || j?.content || j?.output || j?.message || j?.code || j?.result;
      if (typeof candidate === 'string' && candidate.trim()) text = candidate.trim();
    }
    // Direct file map {"Component.jsx": "..."}
    else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      const vals = Object.values(parsed);
      if (vals.some(v => typeof v === 'string' && (v.includes('import') || v.includes('export') || v.includes('function')))) {
        return parsed;
      }
      const cf = parsed.code || parsed.result || parsed.output || parsed.data || parsed.response || parsed.content || parsed.message;
      if (typeof cf === 'string' && cf.trim()) text = cf.trim();
    }
  } catch {}

  // Treat as raw code
  const clean = text.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  if (clean.length > 30 && (clean.includes('import') || clean.includes('export') || clean.includes('function') || clean.includes('const '))) {
    return { [`${projectName.replace(/\s+/g, '')}App.jsx`]: clean };
  }

  return null;
};

// ── Gemini fallback ─────────────────────────────────────────────────────────
const generateWithGemini = async (prompt, projectName) => {
  console.log('[AIOrchestrator] Falling back to Gemini API...');
  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert React developer. Generate a single complete React component for the following request. 
Return ONLY the raw JSX/React code. Do not include markdown, no \`\`\`, no explanation.

Project name: ${projectName}
Request: ${prompt}`,
  });
  const raw = resp.text || '';
  const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  return { [`${projectName.replace(/\s+/g, '')}App.jsx`]: clean };
};

// ── Main export ─────────────────────────────────────────────────────────────
export const generateAppFromVoice = async (prompt, projectName = 'MyProject') => {
  console.log('[AIOrchestrator] Generating for:', { prompt, projectName });

  // 2-minute timeout on webhook
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, projectName }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[AIOrchestrator] Webhook failed, falling back to Gemini...');
      return await generateWithGemini(prompt, projectName);
    }

    const rawText = await response.text();
    console.log('[AIOrchestrator] Raw webhook response:', rawText);

    const files = extractCode(rawText, projectName);
    if (files) return files;

    // Webhook returned empty/metadata — fall back to Gemini
    console.warn('[AIOrchestrator] Webhook returned no code. Falling back to Gemini...');
    return await generateWithGemini(prompt, projectName);

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.warn('[AIOrchestrator] Webhook timed out. Falling back to Gemini...');
      return await generateWithGemini(prompt, projectName);
    }
    throw e;
  }
};

// ── Refine existing code via Gemini ──────────────────────────────────────────
export const refineAppCode = async (existingCode, problemStatement, projectName, filename) => {
  console.log('[AIOrchestrator] Refining code with Gemini...');
  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert React developer. 
The user generated a React component, but wants to improve it to perfectly match their problem statement.

Project name: ${projectName}
Problem Statement / Refinement Request: ${problemStatement}

Current Code:
\`\`\`jsx
${existingCode}
\`\`\`

Return ONLY the completely updated and refined raw JSX/React code. Do not include markdown, no \`\`\`, no explanation. It must be a complete drop-in replacement.`,
  });
  
  const raw = resp.text || '';
  const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  const outName = filename || `${projectName.replace(/\s+/g, '')}App.jsx`;
  return { [outName]: clean };
};

// ── Review & auto-fix generated code before applying to canvas ────────────────
export const reviewAndFixCode = async (files, originalPrompt, projectName) => {
  const firstFile = Object.entries(files)[0];
  if (!firstFile) return { files, review: null };

  const [filename, code] = firstFile;

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a senior React code reviewer.

Original user request: "${originalPrompt}"
Project name: "${projectName}"

Generated code:
\`\`\`jsx
${code}
\`\`\`

Your job:
1. Check if the code matches the user's request.
2. Check for any syntax errors, missing imports, undefined variables.
3. Check that the component is self-contained and doesn't rely on external CSS files (use inline styles).
4. If there are problems, fix ALL of them and return corrected code.
5. Always return a JSON object in this exact format:
{
  "status": "ok" | "fixed",
  "issues": ["list of issues found, or empty array"],
  "code": "THE COMPLETE FIXED OR ORIGINAL JSX CODE HERE (no markdown, no backticks)"
}`,
  });

  try {
    const text = (resp.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);
    const fixedCode = (result.code || code).replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    return {
      files: { [filename]: fixedCode },
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
