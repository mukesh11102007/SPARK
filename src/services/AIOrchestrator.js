import { GoogleGenAI } from '@google/genai';

// API key loaded from environment variable — set VITE_GEMINI_API_KEY in your .env file
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const generateAppFromVoice = async (transcript) => {
  console.log('[AIOrchestrator] Generating app from voice transcript:', transcript);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert React developer. Generate a valid React component structure and logic for the following user request. Only return a JSON object with the filename as the key and code string as the value. Do not include markdown formatting like \`\`\`json.
      
      User Request: "${transcript}"`,
    });

    const text = response.text;
    console.log('[AIOrchestrator] Raw Gemini Response:', text);
    
    try {
       // Attempt to parse if it's clean JSON
       const files = JSON.parse(text);
       return files;
    } catch (e) {
       console.warn("[AIOrchestrator] Failed to parse JSON, returning raw text. Please ensure the model returns strict JSON.");
       return { "GeneratedComponent.jsx": text };
    }
  } catch (error) {
    console.error('[AIOrchestrator] Failed to generate app via Gemini:', error);
    throw error;
  }
};
