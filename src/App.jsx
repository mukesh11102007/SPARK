import React, { useState, useEffect, useCallback } from 'react';
import { AutomationProvider, useAutomation } from './contexts/AutomationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasEditor } from './components/CanvasEditor';
import { bootWebContainer } from './services/WebContainerService';
import { generateAppFromVoice, refineAppCode, reviewAndFixCode, autoHealCode, formatCodeForDeploy } from './services/AIOrchestrator';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { UserIdentityModal } from './components/UserIdentityModal';
import {
  getOrCreateUserIdentity, getOrCreateWorkspaceId, getWorkspaceInviteUrl,
  joinWorkspacePresence, broadcastCodeGenerated, fetchWorkspaceFiles, broadcastNotification
} from './services/SupabaseService';
import { provisionUserDatabase, fetchWorkspaceDatabase } from './services/DatabaseService';
import sdk from '@stackblitz/sdk';
import { FastPreviewIframe } from './components/FastPreviewIframe';
import { deployProject } from './services/DeployService';
import { AuthModal } from './components/AuthModal';
import { CodeEditor } from './components/CodeEditor';
import { Dashboard } from './components/Dashboard';
import { ProjectChatBot } from './components/ProjectChatBot';
import { MyAppsPanel } from './components/MyAppsPanel';
import { SparkLite } from './components/SparkLite';
import { API_BASE_URL } from './config';

// ── Sidebar sub-components ─────────────────────────────────────────────────────

const WorkflowDashboard = () => {
  const { statuses } = useAutomation();
  const workflows = [
    { id: 'watchdog', name: 'Watchdog', desc: 'Error Handling' },
    { id: 'deployment', name: 'Deployment', desc: 'Vercel CI/CD' },
    { id: 'errorAlert', name: 'Error-Alert', desc: 'Discord / Telegram' },
    { id: 'versionControl', name: 'Version-Control', desc: 'Rollback / History' },
  ];
  return (
    <div className="sidebar-section">
      <h3>AUTOMATIONS</h3>
      <div className="dashboard-list">
        {workflows.map(wf => (
          <div key={wf.id} className="dashboard-item">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{wf.name}</div>
              <div style={{ opacity: 0.45, fontSize: '0.68rem' }}>{wf.desc}</div>
            </div>
            <span className={`status-dot status-${statuses[wf.id] || 'idle'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FileExplorer = ({ onAddFile, onFileUpload }) => {
  const [newFile, setNewFile] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newFile.trim()) { onAddFile(newFile.trim()); setNewFile(''); }
  };
  
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    for (const file of selectedFiles) {
      if (file.name.endsWith('.zip')) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(file);
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              zipEntry.async('string').then(content => {
                const cleanName = relativePath.replace(/^[^/]+\//, ''); // Strip root dir if present
                if (cleanName && !cleanName.includes('node_modules') && !cleanName.startsWith('.')) {
                  onFileUpload(cleanName, content);
                }
              });
            }
          });
        } catch (err) {
          console.error('[Zip Uploader] Failed to unpack zip:', err);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          onFileUpload(file.name, event.target.result);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = null;
  };

  return (
    <div className="sidebar-section">
      <h3>PROJECT FILES</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <label style={{ 
          cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center', 
          alignItems: 'center', gap: '6px', background: 'var(--accent, #4d3df7)', 
          color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
        }} title="Upload custom files or project zip">
          <span style={{ fontSize: '14px' }}>⬆️</span> Upload
          <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </label>
        <button 
          onClick={() => onAddFile('NewComponent.jsx')} 
          style={{
            cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center', 
            alignItems: 'center', gap: '6px', background: 'var(--glass-bg)', 
            color: 'var(--text-main)', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', border: 'none'
          }} title="Create new file">
          <span style={{ fontSize: '14px' }}>➕</span> New
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Filename (e.g. Button.jsx)"
          className="ide-input"
          value={newFile}
          onChange={(e) => setNewFile(e.target.value)}
        />
      </form>
      <button 
        onClick={() => {
          onFileUpload('App.jsx', `import React, { useState, useEffect } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [status, setStatus] = useState('Checking Express API...');

  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setStatus('⚡ Connected to Express Backend API (/api/todos)');
        setLoading(false);
      })
      .catch(() => {
        setStatus('⚠️ Full-Stack Serverless Mode (Mock API active)');
        setItems([
          { id: 1, text: 'Build React Frontend', completed: true },
          { id: 2, text: 'Deploy Express Backend API', completed: true },
          { id: 3, text: 'Test Full-Stack Deployment on Vercel', completed: false }
        ]);
        setLoading(false);
      });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item = { id: Date.now(), text: newItem, completed: false };
    setItems([...items, item]);
    setNewItem('');
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>⚡ Full-Stack Test App</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>React Frontend + Express Backend API</p>
        <div style={{ margin: '12px 0', fontSize: '0.75rem', padding: '6px 12px', background: '#1f2937', color: '#10b981', borderRadius: '20px', display: 'inline-block' }}>{status}</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input type="text" placeholder="Add task..." value={newItem} onChange={e => setNewItem(e.target.value)} style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#fff' }} />
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 700 }}>+ Add</button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#1f2937', padding: '12px 16px', borderRadius: '8px' }}>
              <span>{item.text}</span>
              <span style={{ color: item.completed ? '#34d399' : '#9ca3af', fontSize: '0.8rem' }}>{item.completed ? 'Done' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`);
          onFileUpload('server.js', `const express = require('express');\nconst cors = require('cors');\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\nlet todos = [\n  { id: 1, text: 'Build React Frontend', completed: true },\n  { id: 2, text: 'Deploy Express Backend API', completed: true },\n  { id: 3, text: 'Test Full-Stack Deployment on Vercel', completed: false }\n];\n\napp.get('/api/todos', (req, res) => res.json({ success: true, items: todos }));\napp.post('/api/todos', (req, res) => {\n  const item = { id: Date.now(), text: req.body.text, completed: false };\n  todos.push(item);\n  res.json({ success: true, item });\n});\n\nmodule.exports = app;`);
          onFileUpload('vercel.json', `{\n  "version": 2,\n  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index.js" }]\n}`);
        }}
        style={{
          marginTop: '10px', width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        🧪 Load Full-Stack Demo App
      </button>
    </div>
  );
};

const IntentToApp = ({ onAppGenerated, generatedFiles, dbConfig, projectName, setProjectName, workspaceId, setDbConfig, stylingPreference }) => {
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  // Auto-select the first file if available
  useEffect(() => {
    if (generatedFiles && Object.keys(generatedFiles).length > 0) {
      if (!selectedFile || !generatedFiles[selectedFile]) {
        setSelectedFile(Object.keys(generatedFiles).find(f => f.includes('App.jsx')) || Object.keys(generatedFiles)[0]);
      }
    }
  }, [generatedFiles, selectedFile]);

  const cookingMessages = ['🍳 Cooking up your app...', '🔥 Firing up the grill...', '✨ Sprinkling some magic...', '🤖 Teaching the robots...', '🚀 Prepping for launch...'];

  const processInput = async (input, isEnhance = false) => {
    const finalInput = (input || textInput).trim() || projectName.trim();
    if (!finalInput) { alert('Please enter what you want to build!'); return; }

    let finalProjectName = projectName.trim();
    if (!finalProjectName) {
      finalProjectName = finalInput.length > 20 ? finalInput.substring(0, 20) + '...' : finalInput;
      setProjectName(finalProjectName);
    }

    if (isEnhance && (!generatedFiles || Object.keys(generatedFiles).length === 0)) {
      alert('Please Build an app first before enhancing!');
      return;
    }

    setIsProcessing(true);
    setStatusMsg(isEnhance ? '✨ Enhancing your code...' : cookingMessages[Math.floor(Math.random() * cookingMessages.length)]);

    try {
      // Auto-provision database if user asks for real-time or db
      let activeDbConfig = dbConfig;
      const lowerInput = finalInput.toLowerCase();
      if (!activeDbConfig && workspaceId && (lowerInput.includes('real time') || lowerInput.includes('real-time') || lowerInput.includes('database') || lowerInput.includes('db'))) {
        setStatusMsg('🔌 Auto-provisioning database...');
        activeDbConfig = await provisionUserDatabase(workspaceId);
        setDbConfig(activeDbConfig);
      }

      let code;
      if (isEnhance) {
        const targetFile = (selectedFile && generatedFiles[selectedFile]) 
          ? selectedFile 
          : (Object.keys(generatedFiles).find(f => f.includes('App.jsx')) || Object.keys(generatedFiles)[0]);

        const mainCode = generatedFiles[targetFile];
        if (!mainCode) { alert('No code found to enhance. Please build an app first!'); return; }

        const enhancedCode = await refineAppCode(mainCode, finalInput, finalProjectName, targetFile, activeDbConfig, generatedFiles);
        code = { ...generatedFiles, ...enhancedCode };
      } else {
        const newCode = await generateAppFromVoice(finalInput, finalProjectName, activeDbConfig, stylingPreference);
        code = { ...(generatedFiles || {}), ...newCode };
      }

      setStatusMsg(isEnhance ? '✨ Enhancing & reviewing...' : '🔍 Reviewing code before applying...');
      onAppGenerated(code, finalInput, finalProjectName, isEnhance, isEnhance ? selectedFile : null);
      setTextInput('');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg('');
      alert(e.message || 'Something went wrong. Check the console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    const r = new SR();
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => { setIsListening(false); processInput(e.results[0][0].transcript); };
    r.onerror = () => setIsListening(false);
    r.start();
  };

  const busy = isListening || isProcessing;
  return (
    <div className="sidebar-section">
      <h3>BUILD WITH AI</h3>
      <form onSubmit={(e) => { e.preventDefault(); processInput(textInput); }}>
        {/* Project Name */}
        <input
          type="text"
          placeholder="Project Name / Prompt (e.g. build a calculator)"
          className="ide-input"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={busy}
          style={{ marginBottom: '8px' }}
        />
        {/* Prompt */}
        <textarea
          placeholder="Describe what to build... (e.g. A to-do list with dark mode)"
          className="ide-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={busy}
          rows={3}
          style={{ resize: 'vertical', marginBottom: '8px', fontFamily: 'inherit' }}
        />
        {/* File Selector for Enhancing */}
        {generatedFiles && Object.keys(generatedFiles).length > 0 && (
          <select
            className="ide-input"
            value={selectedFile || ''}
            onChange={e => setSelectedFile(e.target.value)}
            disabled={busy}
            style={{ marginBottom: '8px', background: 'var(--panel-elevated)', color: 'var(--text-main)', border: '1px solid var(--panel-border)' }}
          >
            {Object.keys(generatedFiles).map(f => (
              <option key={f} value={f} style={{ background: 'var(--panel-elevated)', color: 'var(--text-main)' }}>{f}</option>
            ))}
          </select>
        )}
        {statusMsg && (
          <div style={{ fontSize: '0.75rem', color: '#00fa9a', marginBottom: '6px' }}>
            ⏳ {statusMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button type="button" className="ide-btn" onClick={handleListen} disabled={busy}
            style={{ margin: 0, flex: 1, minWidth: '80px', background: isListening ? '#ef4444' : 'var(--panel-elevated)', border: '1px solid var(--panel-border)', color: isListening ? '#fff' : 'var(--text-main)', cursor: 'pointer' }}>
            {isListening ? '● Listening' : '🎤 Speak'}
          </button>
          <button 
            type="submit" 
            className="ide-btn" 
            disabled={busy || (!textInput.trim() && !projectName.trim())} 
            style={{ margin: 0, flex: 1, minWidth: '80px', background: busy ? 'var(--panel-elevated)' : 'var(--accent, #4D3DF7)', color: '#ffffff', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {isProcessing && statusMsg && !statusMsg.includes('Enhancing') ? 'Building...' : '⚡ Build'}
          </button>
          <button
            type="button"
            className="ide-btn"
            onClick={() => processInput(textInput, true)}
            disabled={busy || (!textInput.trim() && !projectName.trim()) || !generatedFiles || Object.keys(generatedFiles).length === 0}
            style={{ margin: 0, flex: 1, minWidth: '80px', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', color: 'var(--text-main)', cursor: (busy || !generatedFiles || Object.keys(generatedFiles).length === 0) ? 'not-allowed' : 'pointer' }}
            title="Refine existing code with the prompt above"
          >
            {isProcessing && statusMsg && statusMsg.includes('Enhancing') ? 'Enhancing...' : '✨ Enhance'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ActionsPanel = ({ onSimulateCrash }) => {
  const { runAutomation, statuses } = useAutomation();
  const isPatching = statuses.watchdog === 'active';

  const handleCrash = async () => {
    onSimulateCrash();
    try {
      await runAutomation('watchdog', {
        error: 'Simulated WebContainer Runtime Error',
        stack: 'Error: Cannot read properties of undefined (reading "map")\n    at UserList (UserList.jsx:15:23)',
      });
    } catch {
      runAutomation('errorAlert', { message: 'Watchdog failed.' });
    }
  };

  const handleDeleteWorkspace = async () => {
    const wsId = getOrCreateWorkspaceId();
    if (!confirm("Are you sure you want to delete this workspace? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem('spark_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/workspace/${wsId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {}

    try {
      const deletedList = JSON.parse(localStorage.getItem('spark_deleted_workspaces') || '[]');
      if (!deletedList.includes(wsId)) {
        deletedList.push(wsId);
        localStorage.setItem('spark_deleted_workspaces', JSON.stringify(deletedList));
      }
      const saved = JSON.parse(localStorage.getItem('spark_recent_workspaces') || '[]');
      const updated = saved.filter(w => w.id !== wsId);
      localStorage.setItem('spark_recent_workspaces', JSON.stringify(updated));
      localStorage.removeItem(`spark_personal_files_${wsId}`);
      localStorage.removeItem(`deployUrl_${wsId}`);
    } catch (e) {}

    // Clean URL parameter and redirect to dashboard
    const url = new URL(window.location.href);
    url.searchParams.delete('workspace');
    window.location.href = url.pathname;
  };

  return (
    <div className="sidebar-section">
      <h3>ACTIONS</h3>
      <button className="ide-btn ide-btn-secondary" onClick={handleCrash} disabled={isPatching}>
        {isPatching ? 'Patching via Watchdog...' : '⚠️ Simulate WC Crash'}
      </button>
      <button className="ide-btn" onClick={handleDeleteWorkspace} style={{ marginTop: '10px', background: 'rgba(220, 53, 69, 0.2)', color: '#ff6b6b', border: '1px solid #ff6b6b' }}>
        🗑️ Delete Workspace
      </button>
    </div>
  );
};

const SettingsPanel = ({ currentTheme, setTheme, identity, onLogout, workspaceId, stylingPreference, setStylingPreference, members }) => {
  const [workspaceMembers, setWorkspaceMembers] = React.useState([]);

  React.useEffect(() => {
    if (members) {
      setWorkspaceMembers(members.map(m => ({ ...m, role: m.email === identity?.email ? 'owner' : 'editor' })));
    }
  }, [members, identity]);
  const handleRoleChange = async (targetUserId, newRole) => {
    alert('SPARK Studio is now serverless! Role management is handled automatically via Supabase Presence (anyone with the workspace URL is an Editor).');
  };

  const isOwner = workspaceMembers.find(m => m.email === identity?.email)?.role === 'owner';

  return (
    <div>
      <div className="sidebar-section">
        <h3>ACCOUNT</h3>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {identity?.avatarUrl ? (
              <img src={identity.avatarUrl} alt="User" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: identity?.color || 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700
              }}>
                {identity?.initials || 'U'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{identity?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{identity?.email}</div>
            </div>
          </div>
          {identity?.developerType && (
            <div style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--glass-bg)', display: 'inline-block', borderRadius: '4px', color: 'var(--accent)', fontWeight: 600 }}>
              {identity.developerType === 'technical' ? 'Developer' : 'Non-Technical'}
            </div>
          )}
        </div>
        <button 
          className="ide-btn ide-btn-secondary" 
          style={{ width: '100%', marginTop: '5px' }}
          onClick={onLogout}
        >
          Sign Out
        </button>
      </div>

      <div className="sidebar-section">
        <h3>WORKSPACE MEMBERS</h3>
        {loadingMembers ? (
          <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Loading members...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {workspaceMembers.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '8px', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.name} {m.email === identity?.email && '(You)'}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.email}</div>
                </div>
                {isOwner && m.email !== identity?.email ? (
                  <select 
                    className="ide-input" 
                    style={{ width: 'auto', padding: '4px', marginBottom: 0, fontSize: '0.75rem' }}
                    value={m.role} 
                    onChange={e => handleRoleChange(m.id, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                ) : (
                  <div style={{ fontSize: '0.7rem', background: 'var(--glass-bg)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {m.role}
                  </div>
                )}
              </div>
            ))}
            {workspaceMembers.length === 0 && (
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Only you are in this workspace.</div>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <h3>THEME</h3>
        <select className="ide-input" value={currentTheme} onChange={(e) => setTheme(e.target.value)}>
          <option value="antigravity">Antigravity Dark</option>
          <option value="classic">VS Code Classic</option>
          <option value="light">Light Mode</option>
        </select>
      </div>
      
      <div className="sidebar-section">
        <h3>STYLING FRAMEWORK</h3>
        <select className="ide-input" value={stylingPreference} onChange={(e) => {
          setStylingPreference(e.target.value);
          localStorage.setItem('spark_styling_pref', e.target.value);
        }}>
          <option value="styled-components">Styled-Components</option>
          <option value="tailwind">Tailwind CSS</option>
          <option value="inline">Inline Styles (Vanilla)</option>
          <option value="css-modules">CSS Modules</option>
          <option value="emotion">Emotion</option>
        </select>
      </div>
    </div>
  );
};


// ── Shared helper: build StackBlitz file payload from generated files ────────
const buildProjectFiles = (generatedFiles) => {
  const files = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SPARK Generated App</title>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    'package.json': `{\n  "name": "spark-generated-app",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1", "@supabase/supabase-js": "^2.42.0" },\n  "devDependencies": { "@vitejs/plugin-react": "^4.2.1", "vite": "^5.2.0" }\n}`,
    'vite.config.js': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })`,
    'src/main.jsx': `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
    'src/App.jsx': `import React from 'react';\nexport default function App() { return <div><h1>Welcome to SPARK</h1><p>Generate a component!</p></div>; }`
  };

  let mainComponent = null;
  if (generatedFiles) {
    Object.entries(generatedFiles).forEach(([filename, code]) => {
      files[`src/${filename}`] = code;
      if (!mainComponent) mainComponent = filename.replace(/\.jsx?$/, '');
    });
  }
  
  // Only inject a wrapper App.jsx if the user hasn't explicitly generated one
  if (mainComponent && !files['src/App.jsx']) {
    files['src/App.jsx'] = `import React from 'react';\nimport ${mainComponent} from './${mainComponent}';\nexport default function App() { return (<div style={{padding:'1.5rem',fontFamily:'Inter,sans-serif'}}><${mainComponent} /></div>); }`;
  }
  return files;
};

// ── Deploy Button — Lovable-style: SPARK owns the Vercel token, users just click Share ──

const ShareButton = ({ generatedFiles, projectName, workspaceId }) => {
  const { runAutomation } = useAutomation();
  const [status, setStatus] = useState(() => {
    return localStorage.getItem(`deployUrl_${workspaceId}`) ? 'done' : 'idle';
  });
  const [link, setLink] = useState(() => {
    return localStorage.getItem(`deployUrl_${workspaceId}`) || null;
  });
  const [apiLink, setApiLink] = useState(() => {
    return localStorage.getItem(`deployApiUrl_${workspaceId}`) || null;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeploy = async () => {
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) return;
    setStatus('deploying');
    setErrorMsg('');
    try {
      const res = await deployProject(generatedFiles, projectName || 'spark-app', workspaceId);
      const mainUrl = typeof res === 'string' ? res : res.url;
      const backendUrl = typeof res === 'object' ? res.apiUrl : null;

      setLink(mainUrl);
      setApiLink(backendUrl);
      setStatus('done');

      localStorage.setItem(`deployUrl_${workspaceId}`, mainUrl);
      if (backendUrl) localStorage.setItem(`deployApiUrl_${workspaceId}`, backendUrl);

      runAutomation('deployment', { url: mainUrl, apiUrl: backendUrl, timestamp: Date.now() });
    } catch (e) {
      console.error('[Deploy]', e);
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  const hasFiles = generatedFiles && Object.keys(generatedFiles).length > 0;

  if (status === 'deploying') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#6366f1' }}>
        <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Publishing Full-Stack App...
      </div>
    );
  }

  if (status === 'done' && link) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Frontend Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px' }}>
          <span style={{ color: '#16a34a', fontSize: 11 }}>🌐 Frontend:</span>
          <a href={link} target="_blank" rel="noreferrer"
            style={{ fontSize: '0.78rem', color: '#15803d', textDecoration: 'none', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={link}
          >{link.replace('https://', '')}</a>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); }}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b' }}
          title="Copy Frontend URL"
        >Copy</button>

        {/* Backend Link if full-stack */}
        {apiLink && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px' }}>
              <span style={{ color: '#2563eb', fontSize: 11 }}>⚡ API:</span>
              <a href={apiLink} target="_blank" rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={apiLink}
              >{apiLink.replace('https://', '')}</a>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(apiLink); }}
              style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b' }}
              title="Copy Backend API URL"
            >Copy API</button>
          </>
        )}

        <button
          onClick={() => { setStatus('idle'); setLink(null); setApiLink(null); localStorage.removeItem(`deployUrl_${workspaceId}`); localStorage.removeItem(`deployApiUrl_${workspaceId}`); }}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b' }}
          title="Deploy again"
        >Redeploy</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.75rem', color: '#ef4444' }} title={errorMsg}>Deploy failed</span>
        <button
          onClick={() => setStatus('idle')}
          style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem', color: '#ef4444' }}
        >Retry</button>
      </div>
    );
  }

  return (
    <button
      className="ide-btn"
      onClick={handleDeploy}
      disabled={!hasFiles}
      style={{ margin: 0, width: 'auto', padding: '6px 16px', fontSize: '0.8rem', background: hasFiles ? 'var(--accent, #4D3DF7)' : 'var(--panel-elevated)', color: hasFiles ? '#ffffff' : 'var(--text-muted)', border: hasFiles ? 'none' : '1px solid var(--panel-border)', opacity: hasFiles ? 1 : 0.6, cursor: hasFiles ? 'pointer' : 'not-allowed' }}
      title={hasFiles ? 'Publish to cloud and get shareable link' : 'Generate a component first'}
    >
      Deploy
    </button>
  );
};

// ── Error boundary wrapper ─────────────────────────────────────────────────────
const ErrorBoundaryWrapper = ({ children }) => (
  <ErrorBoundary onAutomationTrigger={() => { }} onAutomationEnd={() => { }}>{children}</ErrorBoundary>
);

const getTemplateCode = (templateName) => {
  const name = templateName || '';
  if (name.includes('Admin') || name.includes('Dashboard')) {
    return {
      'App.jsx': `import React, { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const stats = [
    { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', icon: 'fa-dollar-sign', color: '#10b981' },
    { title: 'Subscriptions', value: '+2,350', change: '+180.1%', icon: 'fa-users', color: '#6366f1' },
    { title: 'Sales Volume', value: '+12,234', change: '+19%', icon: 'fa-shopping-cart', color: '#f59e0b' },
    { title: 'Active Now', value: '+573', change: '+201', icon: 'fa-bolt', color: '#ec4899' }
  ];

  const recentOrders = [
    { id: 'ORD-9821', user: 'Olivia Martin', email: 'olivia@email.com', amount: '$1,999.00', status: 'Completed' },
    { id: 'ORD-9822', user: 'Jackson Lee', email: 'jackson@email.com', amount: '$39.00', status: 'Processing' },
    { id: 'ORD-9823', user: 'Isabella Nguyen', email: 'isabella@email.com', amount: '$299.00', status: 'Completed' },
    { id: 'ORD-9824', user: 'William Kim', email: 'will@email.com', amount: '$99.00', status: 'Completed' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', display: 'flex', fontFamily: 'sans-serif' }}>
      <div style={{ width: 240, background: '#0f172a', borderRight: '1px solid #1e293b', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa fa-chart-line" /> AnalyticsOS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['Overview', 'Analytics', 'Customers', 'Products', 'Settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: activeTab === t ? '#1e293b' : 'transparent',
              color: activeTab === t ? '#818cf8' : '#94a3b8',
              border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.9rem'
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{activeTab} Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Real-time platform updates and metrics</p>
          </div>
          <button style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            + Export Report
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
                <span>{s.title}</span>
                <i className={'fa ' + s.icon} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '12px 0 4px' }}>{s.value}</div>
              <span style={{ fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.change} from last month</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Recent Orders</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                <th style={{ padding: 12 }}>Order ID</th>
                <th style={{ padding: 12 }}>Customer</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: 12, color: '#818cf8', fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: 12 }}>
                    <div>{o.user}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.email}</div>
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{o.amount}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ background: o.status === 'Completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: o.status === 'Completed' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,
      'README.md': `# Admin Dashboard Template\n\nA full production-ready admin dashboard pre-built with stats, filters, and transaction tables.`
    };
  }
  if (name.includes('E-Commerce') || name.includes('Store')) {
    return {
      'App.jsx': `import React, { useState } from 'react';

export default function StoreApp() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const products = [
    { id: 1, name: 'Cyberpunk Headphones', price: 299, category: 'Audio', image: '🎧' },
    { id: 2, name: 'Minimalist Mechanical Keyboard', price: 189, category: 'Peripherals', image: '⌨️' },
    { id: 3, name: 'Ultra-wide Curved Monitor 4K', price: 799, category: 'Displays', image: '🖥️' },
    { id: 4, name: 'Ergonomic Precision Mouse', price: 99, category: 'Peripherals', image: '🖱️' }
  ];

  const addToCart = (p) => {
    setCart(prev => [...prev, p]);
  };

  const total = cart.reduce((acc, i) => acc + i.price, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <h2 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: 10 }}>🛍️ TechStore Pro</h2>
        <button onClick={() => setCartOpen(true)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          🛒 Cart ({cart.length})
        </button>
      </header>

      <div style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>Next-Gen Developer Setup Gear</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>Elevate your workspace with premium accessories</p>
      </div>

      <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 24 }}>Featured Products</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>{p.image}</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{p.name}</h4>
              <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>${p.price}</div>
              <button onClick={() => addToCart(p)} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 }}>
          <div style={{ width: 360, background: '#0f172a', height: '100%', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Your Cart</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? <p style={{ color: '#64748b' }}>Cart is empty</p> : cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 600 }}>${item.price}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
                <span>Total:</span>
                <span style={{ color: '#10b981' }}>${total}</span>
              </div>
              <button onClick={() => alert('Checkout simulated!')} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`,
      'README.md': `# E-Commerce Store Template\n\nComplete storefront with shopping cart drawer and price totals.`
    };
  } else if (name.includes('Blog')) {
    return {
      'App.jsx': `import React, { useState } from 'react';

export default function BlogApp() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const posts = [
    { id: 1, title: 'Building Scalable AI Apps with React & Gemini', category: 'AI & Tech', author: 'Sarah Connor', date: 'Aug 2, 2026', readTime: '5 min read', desc: 'Discover how to integrate LLM endpoints into modern React single page applications.' },
    { id: 2, title: 'The Future of Web Development in 2027', category: 'Frontend', author: 'Alex Mercer', date: 'Jul 28, 2026', readTime: '8 min read', desc: 'Exploring WebAssembly, server components, and dynamic client compilation.' },
    { id: 3, title: 'Mastering Supabase Real-Time Data Sync', category: 'Backend', author: 'Elena Rostova', date: 'Jul 20, 2026', readTime: '4 min read', desc: 'A deep dive into PostgreSQL pub/sub channels for collaborative team tools.' }
  ];

  const filtered = selectedCategory === 'All' ? posts : posts.filter(p => p.category === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <header style={{ borderBottom: '1px solid #30363d', paddingBottom: 24, marginBottom: 32 }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 8px', color: '#58a6ff' }}>✍️ TechPulse Blog</h1>
          <p style={{ color: '#8b949e', fontSize: '1.1rem', margin: 0 }}>Articles on AI, Web Architecture, and Distributed Systems</p>
        </header>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {['All', 'AI & Tech', 'Frontend', 'Backend'].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              background: selectedCategory === cat ? '#1f6feb' : '#21262d',
              color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
            }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filtered.map(post => (
            <article key={post.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.8rem', color: '#8b949e', marginBottom: 12 }}>
                <span style={{ background: 'rgba(88,166,255,0.1)', color: '#58a6ff', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{post.category}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: '1.4rem', color: '#f0f6fc' }}>{post.title}</h2>
              <p style={{ color: '#8b949e', lineHeight: 1.6, margin: '0 0 16px' }}>{post.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#8b949e' }}>
                <span>By <strong>{post.author}</strong></span>
                <span>{post.date}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}`,
      'README.md': `# Blog Platform Template\n\nA full blog layout with category filters and post reader cards.`
    };
  } else if (name.includes('Visual') || name.includes('Canvas')) {
    return {
      'App.jsx': `import React, { useState } from 'react';

export default function CanvasApp() {
  const [cards, setCards] = useState([
    { id: 1, title: 'Feature Alpha', desc: 'Real-time collaborative canvas layout engine built for modern web IDEs.', color: '#10b981' },
    { id: 2, title: 'Feature Beta', desc: 'Drag and drop components to visually assemble your React applications.', color: '#3b82f6' },
    { id: 3, title: 'Feature Gamma', desc: 'Instant code generation and multi-user Supabase synchronization.', color: '#8b5cf6' }
  ]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Component */}
      <nav style={{ height: '64px', background: '#13131a', borderBottom: '1px solid #27272a', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4D3DF7', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 Visual Studio Layout
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: '0.9rem', color: '#a1a1aa' }}>
          <span style={{ cursor: 'pointer', color: '#fff' }}>Home</span>
          <span style={{ cursor: 'pointer' }}>Features</span>
          <span style={{ cursor: 'pointer' }}>Documentation</span>
        </div>
        <button style={{ background: '#4D3DF7', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
          Get Started
        </button>
      </nav>

      {/* Hero Component */}
      <section style={{ padding: '80px 32px', background: 'radial-gradient(circle at center, rgba(37,99,235,0.15) 0%, rgba(10,10,15,0) 70%)', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Visual Prototyping Canvas
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          You assembled this interface on the visual canvas. Edit the generated React code below or preview it live!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
            Explore Components
          </button>
        </div>
      </section>

      {/* Cards Grid Component */}
      <section style={{ flex: 1, padding: '60px 32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 24, color: '#f3f4f6' }}>Canvas Component Cards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {cards.map(c => (
            <div key={c.id} style={{ background: '#13131a', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, marginBottom: 16 }}></div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#fff' }}>{c.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, flex: 1, margin: '0 0 16px' }}>{c.desc}</p>
              <button style={{ background: 'transparent', color: c.color, border: '1px solid ' + c.color, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                View Details →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Component */}
      <footer style={{ background: '#13131a', borderTop: '1px solid #27272a', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        <p style={{ margin: 0 }}>© 2026 Spark Studio Canvas Engine. Built visually with React & Supabase.</p>
      </footer>
    </div>
  );
}`,
      'README.md': `# Visual Prototyping Canvas App\n\nThis app was created from the visual Canvas editor with Navbar, Hero Section, Cards, and Footer.`
    };
  } else {
    return {
      'App.jsx': `import React from 'react';

export default function PortfolioApp() {
  const projects = [
    { title: 'AI Code Assistant', tech: 'React • Python • Gemini', desc: 'An intelligent coding copilot built for modern web IDEs.' },
    { title: 'DeFi Liquidity Protocol', tech: 'Solidity • Web3.js', desc: 'Automated market maker protocol with real-time analytics.' },
    { title: 'Cloud Infrastructure Engine', tech: 'Go • Docker • K8s', desc: 'High-speed cluster orchestration tool.' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: 'sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👨‍💻</div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 12px', background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Alex Rivers</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '0 0 24px' }}>Senior Full Stack Engineer & AI Systems Architect</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Get in Touch</button>
            <button style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>View GitHub</button>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 12 }}>Featured Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {projects.map(p => (
            <div key={p.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>{p.tech}</span>
              <h3 style={{ margin: '8px 0', fontSize: '1.2rem' }}>{p.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
      'README.md': `# Portfolio Template\n\nA modern developer portfolio pre-built with project cards and hero banner.`
    };
  }
  
  if (name.includes('Canvas') || name.includes('Visual')) {
    return {
      'App.jsx': `import React, { useState } from 'react';

export default function VisualPrototypingCanvas() {
  const [nodes, setNodes] = useState([
    { id: 1, x: 100, y: 150, title: 'Header.jsx', type: 'component' },
    { id: 2, x: 400, y: 100, title: 'Hero.jsx', type: 'component' },
    { id: 3, x: 400, y: 250, title: 'Footer.jsx', type: 'component' }
  ]);
  
  const [dragNode, setDragNode] = useState(null);

  const handlePointerDown = (e, id) => {
    e.target.setPointerCapture(e.pointerId);
    setDragNode({ id, startX: e.clientX, startY: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!dragNode) return;
    const dx = e.clientX - dragNode.startX;
    const dy = e.clientY - dragNode.startY;
    setNodes(nodes.map(n => n.id === dragNode.id ? { ...n, x: n.x + dx, y: n.y + dy } : n));
    setDragNode({ id: dragNode.id, startX: e.clientX, startY: e.clientY });
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    setDragNode(null);
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#f8fafc', position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, background: '#fff', padding: '12px 24px', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontWeight: 600, color: '#0f172a', zIndex: 10 }}>
        Visual Component Architecture
      </div>
      
      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      
      <div style={{ position: 'absolute', inset: 0 }} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d={\`M 250 180 C 325 180, 325 130, 400 130\`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
          <path d={\`M 250 180 C 325 180, 325 280, 400 280\`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
        </svg>

        {nodes.map(n => (
          <div
            key={n.id}
            onPointerDown={(e) => handlePointerDown(e, n.id)}
            style={{
              position: 'absolute',
              left: n.x,
              top: n.y,
              width: 150,
              background: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
              cursor: 'grab',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontWeight: 600 }}>
              <i className="fa fa-cube" /> {n.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, display: 'inline-block', width: 'fit-content' }}>
              React Node
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`
    };
  }

  // Fallback default
  return {
    'App.jsx': `import React from 'react';

export default function App() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 16px' }}>Welcome to SPARK</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Your new project is ready to build!</p>
      </div>
    </div>
  );
}`
  };
};

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('spark_current_view') || 'dashboard');
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [manualFile, setManualFile] = useState(null);
  const [wcBooted, setWcBooted] = useState(false);
  const [activeTab, setActiveTab] = useState('ai builder');
  const [activeActivity, setActiveActivity] = useState(() => localStorage.getItem('spark_active_activity') || 'explorer');
  const [sparkMode, setSparkMode] = useState(() => localStorage.getItem('spark_mode') || 'pro'); // 'pro' | 'simple'
  const [updateAppTarget, setUpdateAppTarget] = useState(null); // app record from MyAppsPanel for Update flow
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeSourceFile, setActiveSourceFile] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('spark_theme') || 'antigravity');
  const [stylingPreference, setStylingPreference] = useState(() => localStorage.getItem('spark_styling_pref') || 'styled-components');
  const [wcCrashLog, setWcCrashLog] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [workspaceType, setWorkspaceType] = useState(() => localStorage.getItem('spark_workspace_type') || 'team'); // 'personal' | 'team'
  
  useEffect(() => {
    localStorage.setItem('spark_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('spark_active_activity', activeActivity);
  }, [activeActivity]);

  // Auto-select activeSourceFile when files are loaded
  useEffect(() => {
    if (generatedFiles && Object.keys(generatedFiles).length > 0) {
      if (!activeSourceFile || !generatedFiles[activeSourceFile]) {
        // Prefer files containing App.jsx or the first file
        const firstFile = Object.keys(generatedFiles).find(f => f.toLowerCase().includes('app.jsx')) || Object.keys(generatedFiles)[0];
        setActiveSourceFile(firstFile);
      }
    }
  }, [generatedFiles, activeSourceFile]);

  useEffect(() => {
    localStorage.setItem('spark_workspace_type', workspaceType);
  }, [workspaceType]);
  const [personalFiles, setPersonalFiles] = useState({});
  const [teamFiles, setTeamFiles] = useState(null);
  const [personalProjectName, setPersonalProjectName] = useState('New Project');
  const [teamProjectName, setTeamProjectName] = useState('spark-app');
  
  // Use the appropriate project name based on active workspace
  const appProjectName = workspaceType === 'personal' ? personalProjectName : teamProjectName;
  const setAppProjectName = (newName) => {
    if (workspaceType === 'personal') {
      setPersonalProjectName(newName);
    } else {
      setTeamProjectName(newName);
    }
    const wsId = getOrCreateWorkspaceId();
    if (wsId) {
       try {
         const saved = JSON.parse(localStorage.getItem('spark_recent_workspaces') || '[]');
         const updated = saved.map(w => w.id === wsId ? { ...w, title: newName } : w);
         localStorage.setItem('spark_recent_workspaces', JSON.stringify(updated));

         if (workspaceType === 'team') {
           const token = localStorage.getItem('spark_token');
           if (token) {
             fetch(`${API_BASE_URL}/api/workspace/${wsId}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               body: JSON.stringify({ title: newName })
             }).catch(e => console.error('Failed to sync title to DB', e));
             broadcastWorkspaceNameUpdate(newName);
           }
         }
       } catch(e) {}
    }
  };
  
  // ── Database state ─────────────────────────────────────────────────────────
  const [dbStatus, setDbStatus] = useState('idle');
  const [dbConfig, setDbConfig] = useState(null);

  // Track recent workspaces
  useEffect(() => {
    const wsId = getOrCreateWorkspaceId();
    const deletedList = JSON.parse(localStorage.getItem('spark_deleted_workspaces') || '[]');
    
    // If current workspace was deleted, clean workspace URL param and prevent re-adding
    if (deletedList.includes(wsId)) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('workspace')) {
        url.searchParams.delete('workspace');
        window.history.replaceState({}, '', url.pathname + url.search);
        window.location.reload();
      }
      return;
    }

    if (wsId) {
      try {
        const saved = JSON.parse(localStorage.getItem('spark_recent_workspaces') || '[]');
        const filtered = saved.filter(w => w.id !== wsId);
        filtered.unshift({
          id: wsId,
          title: `Workspace ${wsId.substring(0, 8)}`,
          timestamp: Date.now(),
          tags: ['Team', 'React'],
          iconColor: 'linear-gradient(135deg, #4D3DF7, #8A2BE2)',
          iconEmoji: '✨'
        });
        localStorage.setItem('spark_recent_workspaces', JSON.stringify(filtered.slice(0, 6)));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const wsId = getOrCreateWorkspaceId();
    fetchWorkspaceDatabase(wsId).then(async (cfg) => {
      if (cfg) {
        setDbConfig(cfg);
        setDbStatus('active');
      } else {
        setDbStatus('provisioning');
        try {
          const newCfg = await provisionUserDatabase(wsId);
          setDbConfig(newCfg);
          setDbStatus('active');
        } catch (e) {
          console.error('Auto-provision failed:', e);
          setDbStatus('idle');
        }
      }
    });
  }, []);

  const logActivity = useCallback((msg) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // ── Code Review state ─────────────────────────────────────────────────
  const [pendingReview, setPendingReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // ── Team / Presence state ──────────────────────────────────────────────────
  const [identity, setIdentity] = useState(() => {
    const saved = localStorage.getItem('spark_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [members, setMembers] = useState([]);
  const [inviteToast, setInviteToast] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [workspaceCounter, setWorkspaceCounter] = useState(0);

  const userRole = (() => {
    if (!identity) return 'Owner';
    try {
      const roles = JSON.parse(localStorage.getItem('spark_member_roles') || '{}');
      const myKey = identity.id || identity.email;
      return roles[myKey] || identity.role || 'Owner';
    } catch (e) {
      return 'Owner';
    }
  })();

  const isReadOnly = userRole === 'Viewer';

  // Join the workspace presence channel once identity is set
  useEffect(() => {
    if (!identity) return;
    const workspaceId = getOrCreateWorkspaceId();

    // Fetch historical workspace files from Express backend
    const loadTeamFiles = async () => {
      const activeWs = localStorage.getItem('spark_workspace_type') || 'team';
      try {
        const token = localStorage.getItem('spark_token');
        if (token) {
          const res = await fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              setTeamProjectName(data.title);
            }
            if (data.files && Object.keys(data.files).length > 0) {
              setTeamFiles(data.files);
              if (activeWs === 'team') {
                setGeneratedFiles(data.files);
              }
              logActivity(`Fetched ${Object.keys(data.files).length} files from Workspace Database.`);
            } else {
              // Fallback to Supabase logs for older workspaces
              fetchWorkspaceFiles(workspaceId).then(supaFiles => {
                if (supaFiles && Object.keys(supaFiles).length > 0) {
                  setTeamFiles(supaFiles);
                  if (activeWs === 'team') {
                    setGeneratedFiles(supaFiles);
                  }
                  logActivity(`Migrated ${Object.keys(supaFiles).length} files from Supabase history.`);
                  fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ files: supaFiles })
                  });
                } else {
                  // Workspace is empty - clear team & generated files!
                  setTeamFiles({});
                  if (activeWs === 'team') setGeneratedFiles({});
                }
              });
            }
          } else {
            setTeamFiles({});
            if (activeWs === 'team') setGeneratedFiles({});
          }
        } else {
          setTeamFiles({});
          if (activeWs === 'team') setGeneratedFiles({});
        }
      } catch (err) {
        console.error('Failed to load team files from DB', err);
        setTeamFiles({});
        if (activeWs === 'team') setGeneratedFiles({});
      }
    };
    loadTeamFiles();

    // Load Personal Files scoped per Workspace ID
    const activeWsType = localStorage.getItem('spark_workspace_type') || 'team';
    const savedPersonal = localStorage.getItem(`spark_personal_files_${workspaceId}`) || localStorage.getItem('spark_personal_files');
    if (savedPersonal) {
      try {
        const parsed = JSON.parse(savedPersonal);
        setPersonalFiles(parsed);
        if (activeWsType === 'personal') {
          setGeneratedFiles(parsed);
        }
      } catch (e) {
        setPersonalFiles({});
      }
    } else {
      setPersonalFiles({});
      if (activeWsType === 'personal') {
        setGeneratedFiles({});
      }
    }

    window.__sparkOnRemoteCodeGenerated = (files) => {
      setGeneratedFiles(prev => {
        const updated = { ...prev, ...files };
        if (activeWsType !== 'personal') {
          setTeamFiles(updated); // Sync team files state too
        }
        return updated;
      });
      logActivity(`Remote teammate generated: ${Object.keys(files).join(', ')}`);
    };
    
    window.__sparkOnRemoteNotification = (message, type) => {
      setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
      setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
    };

    const unsubscribe = joinWorkspacePresence(workspaceId, identity, (newMembers) => {
      setMembers([...newMembers]);
    });
    return () => {
      unsubscribe();
      window.__sparkOnRemoteCodeGenerated = null;
      window.__sparkOnRemoteNotification = null;
    };
  }, [identity, workspaceCounter]);

  // Called by IntentToApp — triggers review pipeline instead of direct canvas apply
  const setAndBroadcastFiles = useCallback(async (files, originalPrompt, projectName, isEnhance, targetFilename) => {
    setActiveTab('ai builder');
    setPendingReview({ files, prompt: originalPrompt || '', projectName: projectName || '', reviewResult: null });
    setIsReviewing(true);

    try {
      const { files: fixedFiles, review } = await reviewAndFixCode(files, originalPrompt || '', projectName || '', dbConfig, targetFilename);
      setPendingReview({ files: fixedFiles, prompt: originalPrompt || '', projectName: projectName || '', reviewResult: review });
    } catch (e) {
      console.error('[Review] failed, applying original:', e);
      setPendingReview(prev => prev ? { ...prev, reviewResult: { status: 'ok', issues: [] } } : null);
    } finally {
      setIsReviewing(false);
    }
  }, [dbConfig]);

  const handleInvite = () => {
    const url = getWorkspaceInviteUrl();
    navigator.clipboard.writeText(url).then(() => {
      setInviteToast(true);
      setTimeout(() => setInviteToast(false), 3000);
    }).catch(() => {
      prompt('Copy this invite link:', getWorkspaceInviteUrl());
    });
  };

  const updatePersonalFiles = (files) => {
    const updated = typeof files === 'function' ? files(personalFiles) : files;
    setPersonalFiles(updated || {});
    const wsId = getOrCreateWorkspaceId();
    try {
      localStorage.setItem(`spark_personal_files_${wsId}`, JSON.stringify(updated || {}));
      localStorage.setItem('spark_personal_files', JSON.stringify(updated || {}));
    } catch(e) { console.error('Failed saving personal files', e); }
  };

  const handleApplyToCanvas = async (files) => {
    setGeneratedFiles(files);
    setPendingReview(null);
    setWcCrashLog(null);
    logActivity(`${identity?.name || 'You'} applied to canvas: ${Object.keys(files).join(', ')}`);
    
    if (workspaceType === 'personal') {
      updatePersonalFiles(files);
    } else {
      setTeamFiles(files);
      if (identity) {
        const workspaceId = getOrCreateWorkspaceId();
        broadcastCodeGenerated(workspaceId, files);
        
        // Save to MongoDB Backend
        try {
          const token = localStorage.getItem('spark_token');
          if (token) {
            fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ files })
            });
            
            fetch(`${API_BASE_URL}/api/workspace/${workspaceId}/commit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'commit', details: `Committed ${Object.keys(files).length} files` })
            });

            if (import.meta.env.VITE_DIGEST_WEBHOOK_URL) {
              fetch(import.meta.env.VITE_DIGEST_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'commit', user: identity.name, workspaceId, filesCommitted: Object.keys(files).length })
              }).catch(e => console.error("Webhook failed:", e));
            }
          }
        } catch (e) {
          console.error('Failed to save to MongoDB:', e);
        }
        broadcastNotification(`${identity.name} committed changes to the workspace.`, 'success');
      }
    }
  };

  const handleAutoHeal = async () => {
    if (!generatedFiles || !wcCrashLog) return;
    setActiveTab('ai builder');
    setPendingReview({ files: generatedFiles, prompt: 'Auto-healing crash', projectName: 'CrashFix', reviewResult: null });
    setIsReviewing(true);

    try {
      const fixedFiles = await autoHealCode(generatedFiles, wcCrashLog, dbConfig);
      setPendingReview({ files: fixedFiles, prompt: 'Auto-healing crash', projectName: 'CrashFix', reviewResult: { status: 'fixed', issues: ['Auto-healed based on WebContainer runtime error logs.'] } });
    } catch (e) {
      console.error('Auto-heal failed:', e);
      setPendingReview(null);
      alert('Failed to auto-heal the code.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleFormatForDeploy = async () => {
    if (!activeSourceFile || !generatedFiles[activeSourceFile]) return;
    
    // Set reviewing state so UI shows a loading state if we want, or just wait
    logActivity(`Formatting ${activeSourceFile} for Serverless Deployment...`);
    setIsReviewing(true);
    
    try {
      const code = generatedFiles[activeSourceFile];
      const formattedCode = await formatCodeForDeploy(activeSourceFile, code);
      
      if (formattedCode && formattedCode !== code) {
        setGeneratedFiles(prev => {
          const updated = { ...(prev || {}), [activeSourceFile]: formattedCode };
          if (workspaceType === 'personal') {
            updatePersonalFiles(updated);
          } else {
            setTeamFiles(updated);
          }
          return updated;
        });
        logActivity(`Successfully formatted ${activeSourceFile} for SPARK Deploy!`);
        alert(`Successfully formatted ${activeSourceFile} for Serverless Deployment! Review the code before clicking Deploy.`);
      } else {
        logActivity(`${activeSourceFile} is already formatted for SPARK Deploy or no changes needed.`);
        alert('No formatting changes were needed.');
      }
    } catch (err) {
      console.error('Format for deploy failed', err);
      alert('Failed to format code for deployment.');
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => { 
    document.body.setAttribute('data-theme', theme); 
    localStorage.setItem('spark_theme', theme);
  }, [theme]);
  useEffect(() => { bootWebContainer().then(() => setWcBooted(true)).catch(() => { }); }, []);

  const handleAddManualFile = (filename) => {
    const safeName = filename.replace(/\.jsx?$/, '').replace(/[^a-zA-Z0-9]/g, '') || 'NewComponent';
    const defaultCode = `import React from 'react';\n\nexport default function ${safeName}() {\n  return (\n    <div style={{ padding: '2rem' }}>\n      <h2>${safeName} Component</h2>\n    </div>\n  );\n}\n`;
    setGeneratedFiles(prev => {
      const updated = { ...(prev || {}), [filename]: defaultCode };
      if (workspaceType === 'personal') {
        updatePersonalFiles(updated);
      } else {
        setTeamFiles(updated);
        const workspaceId = getOrCreateWorkspaceId();
        try {
          const token = localStorage.getItem('spark_token');
          if (token) {
            fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ files: updated })
            });
          }
          broadcastCodeGenerated(workspaceId, updated);
        } catch (e) {
          console.error('Failed to update DB on file add', e);
        }
      }
      return updated;
    });
    setManualFile({ name: filename, timestamp: Date.now() });
  };

  const handleFileUpload = (filename, content) => {
    setGeneratedFiles(prev => {
      const updated = { ...(prev || {}), [filename]: content };
      if (workspaceType === 'personal') {
        updatePersonalFiles(updated);
      } else {
        setTeamFiles(updated);
        const workspaceId = getOrCreateWorkspaceId();
        try {
          const token = localStorage.getItem('spark_token');
          if (token) {
            fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ files: updated })
            });
          }
          broadcastCodeGenerated(workspaceId, updated);
        } catch (e) {
          console.error('Failed to update DB on file upload', e);
        }
      }
      return updated;
    });
    // Auto-select uploaded file and switch to source editor so user can edit it immediately
    setActiveSourceFile(filename);
    setActiveActivity('source');
  };

  const handleDeleteFile = (filename) => {
    setGeneratedFiles(prev => {
      if (!prev) return prev;
      const newFiles = { ...prev };
      delete newFiles[filename];

      if (workspaceType === 'personal') {
        updatePersonalFiles(newFiles);
      } else {
        setTeamFiles(newFiles);
        const workspaceId = getOrCreateWorkspaceId();
        try {
          const token = localStorage.getItem('spark_token');
          if (token) {
            fetch(`${API_BASE_URL}/api/workspace/${workspaceId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ files: newFiles })
            });
          }
        } catch (e) {
          console.error('Failed to update DB on file delete', e);
        }
      }
      return newFiles;
    });
  };

  const handleSimulateCrash = () => {
    setActiveTab('terminal');
    setWcCrashLog(
      "ERROR  Cannot read properties of undefined (reading 'map')\n" +
      "    at UserList          UserList.jsx:15:23\n" +
      "    at renderWithHooks   react-dom.development.js:16305\n\n" +
      "→ Watchdog webhook triggered — auto-healing in progress…"
    );
  };

  const DatabasePanel = () => {

    const handleProvision = async () => {
      setDbStatus('provisioning');
      const wsId = getOrCreateWorkspaceId();
      try {
        const config = await provisionUserDatabase(wsId);
        setDbConfig(config);
        setDbStatus('active');
      } catch (e) {
        console.error(e);
        setDbStatus('idle');
      }
    };

    return (
      <div className="sidebar-section">
        <h3>DATABASE (SUPABASE)</h3>
        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '10px' }}>
          Provision a serverless Postgres database for your project.
        </div>
        {dbStatus === 'idle' && (
          <button className="ide-btn ide-btn-secondary" onClick={handleProvision}>
            Provision Database
          </button>
        )}
        {dbStatus === 'provisioning' && (
          <div style={{ color: '#00fa9a', fontSize: '0.8rem' }}>Spinning up Supabase Postgres instance...</div>
        )}
        {dbStatus === 'active' && dbConfig && (
          <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
            <div style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>● Supabase Database Active</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7, wordBreak: 'break-all', marginBottom: '4px' }}>
              URL: <code>{dbConfig.url}</code>
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              Table: <code>{dbConfig.table}</code>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#6366f1', marginTop: '6px', fontWeight: 600 }}>
              ✓ Real-time sync enabled for workspace
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSidebar = () => {

    if (activeActivity === 'settings') {
      return (
        <SettingsPanel 
          currentTheme={theme} 
          setTheme={setTheme} 
          identity={identity}
          workspaceId={getOrCreateWorkspaceId()}
          stylingPreference={stylingPreference}
          setStylingPreference={setStylingPreference}
          members={members}
          onLogout={() => {
            localStorage.removeItem('spark_user');
            localStorage.removeItem('spark_token');
            setIdentity(null);
          }}
        />
      );
    }
    if (activeActivity === 'preview') {
      const fileKeys = generatedFiles ? Object.keys(generatedFiles) : [];
      return (
        <div className="sidebar-section">
          <h3>LIVE PREVIEW</h3>
          <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>
            👁️ Preview mode active.<br/><br/>
            The live app is now rendering in the main window.<br/><br/>
            Switch back to the Explorer (📄) to see your code.
          </p>
          
          {fileKeys.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>COMPONENT TO PREVIEW</label>
              <select
                className="ide-input"
                value={activeSourceFile || ''}
                onChange={e => setActiveSourceFile(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--panel-elevated)', color: 'var(--text-main)', border: '1px solid var(--panel-border)' }}
              >
                {fileKeys.map(f => (
                  <option key={f} value={f} style={{ background: 'var(--panel-elevated)', color: 'var(--text-main)' }}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      );
    }
    if (activeActivity === 'source') {
      const files = generatedFiles || {};
      const fileKeys = Object.keys(files);
      if (fileKeys.length > 0 && !activeSourceFile) {
        setActiveSourceFile(fileKeys[0]);
      }
      return (
        <div className="sidebar-section">
          <h3>SOURCE FILES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {fileKeys.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>No files generated yet.</p>}
            {fileKeys.map(file => (
              <div 
                key={file}
                onClick={() => setActiveSourceFile(file)}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  background: activeSourceFile === file ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: activeSourceFile === file ? 'var(--accent)' : 'var(--text-main)',
                  borderLeft: activeSourceFile === file ? '3px solid var(--accent)' : '3px solid transparent'
                }}
              >
                📄 {file}
              </div>
            ))}
          </div>
          {fileKeys.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
              <button 
                className="ide-btn" 
                onClick={() => handleApplyToCanvas(generatedFiles)}
              >
                Save & Sync Changes
              </button>
              {activeSourceFile && (
                <button 
                  className="ide-btn ide-btn-secondary" 
                  onClick={handleFormatForDeploy}
                  disabled={isReviewing}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                >
                  {isReviewing ? 'Formatting...' : '✨ Format for SPARK Deploy (AI)'}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
    if (activeActivity === 'my-apps') {
      return (
        <div className="sidebar-section">
          <h3>MY DEPLOYED APPS</h3>
          <p style={{ opacity: 0.7, fontSize: '0.78rem', lineHeight: 1.5 }}>
            🚀 All deployed apps shown in main panel.<br /><br />
            <strong>Update</strong> — enhance with a new AI prompt.<br />
            <strong>Re-Deploy</strong> — redeploy with same code.<br />
            Health is auto-checked every 2 min.
          </p>
          <button
            className="ide-btn"
            style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem' }}
            onClick={() => setActiveActivity('explorer')}
          >← Back to Explorer</button>
        </div>
      );
    }
    return (
      <>
        <FileExplorer onAddFile={handleAddManualFile} onFileUpload={handleFileUpload} />
        <DatabasePanel />
        {members.length > 0 && (
          <div className="sidebar-section">
            <h3>ONLINE NOW ({members.length})</h3>
            {members.map((m, i) => (
              <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>
                    {m.initials}
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{m.name}</span>
                <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#56d364', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const isNonTech = identity?.developerType === 'non-technical';

  const activities = [
    { id: 'explorer', icon: '📄' },
    { id: 'preview', icon: '👁️' },
    { id: 'source', icon: '🌿' }
  ];

  if (!identity) {
    return <AuthModal onLogin={setIdentity} />;
  }

  const renderAppContent = () => {
    if (currentView === 'dashboard') {
      return (
        <Dashboard 
      identity={identity} 
      setIdentity={setIdentity}
      members={members}
      onOpenWorkspace={(type, options = {}) => {
        const url = new URL(window.location.href);

        if (type === 'new') {
          const newWsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          url.searchParams.set('workspace', newWsId);
          window.history.pushState({}, '', url.toString());
          localStorage.setItem('spark_workspace_id', newWsId);

          const title = options.template 
            ? `${options.template} Workspace` 
            : options.initialPrompt 
              ? (options.initialPrompt.length > 25 ? options.initialPrompt.substring(0, 25) + '...' : options.initialPrompt)
              : `Workspace ${newWsId.substring(3, 9)}`;

          try {
            const saved = JSON.parse(localStorage.getItem('spark_recent_workspaces') || '[]');
            saved.unshift({
              id: newWsId,
              title,
              timestamp: Date.now(),
              tags: ['Team', 'React'],
              iconColor: 'linear-gradient(135deg, #4D3DF7, #8A2BE2)',
              iconEmoji: '✨'
            });
            localStorage.setItem('spark_recent_workspaces', JSON.stringify(saved.slice(0, 10)));
          } catch (e) {}

          if (options.initialPrompt) {
            setPersonalProjectName(title);
            setWorkspaceType('personal');
            localStorage.setItem('spark_workspace_type', 'personal');
            setActiveActivity('preview');
            generateAppFromVoice(options.initialPrompt, title, dbConfig).then(code => {
              setGeneratedFiles(code);
              localStorage.setItem(`spark_personal_files_${newWsId}`, JSON.stringify(code));
              setPersonalFiles(code);
              broadcastFiles(code);
            }).catch(err => console.error('AI Generation error:', err));
          } else if (options.template) {
            setPersonalProjectName(options.template);
            setWorkspaceType('personal');
            localStorage.setItem('spark_workspace_type', 'personal');
            const templateFiles = getTemplateCode(options.template);
            setGeneratedFiles(templateFiles);
            localStorage.setItem(`spark_personal_files_${newWsId}`, JSON.stringify(templateFiles));
            setPersonalFiles(templateFiles);
          } else {
            setGeneratedFiles({});
            setPersonalProjectName('New Project');
            setWorkspaceType('personal');
            localStorage.setItem('spark_workspace_type', 'personal');
          }
          if (options.tab) setActiveTab(options.tab);
          if (options.activity) setActiveActivity(options.activity);
        } else if (typeof type === 'string') {
          url.searchParams.set('workspace', type);
          window.history.replaceState({}, '', url.toString());
          
          setWorkspaceType('team');
          localStorage.setItem('spark_workspace_type', 'team');
          
          if (options.title) {
            setPersonalProjectName(options.title);
          }
        }
        setWorkspaceCounter(prev => prev + 1);
        setCurrentView('ide');
      }} 
      theme={theme}
      setTheme={setTheme}
    />
      );
    }

    return (
      <AutomationProvider>
        {/* SparkLite Simple Mode — shown when mode is 'simple' */}
        {sparkMode === 'simple' ? (
          <SparkLite
            workspaceId={getOrCreateWorkspaceId()}
            dbConfig={dbConfig}
            identity={identity}
            onSwitchPro={() => {
              setSparkMode('pro');
              localStorage.setItem('spark_mode', 'pro');
            }}
          />
        ) : (
        <div className="ide-layout">

        {/* Activity Bar */}
        <div className="activity-bar">
          {activities.map(({ id, icon }) => (
            <div 
              key={id} 
              className={`activity-icon ${activeActivity === id ? 'active' : ''}`} 
              onClick={() => setActiveActivity(id)}
              style={id === 'settings' ? { marginTop: 'auto', marginBottom: '10px' } : {}}
            >
              {icon}
            </div>
          ))}
        </div>

        <ErrorBoundaryWrapper>
          {/* Sidebar */}
          <div className="ide-sidebar">
            <div className="ide-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setCurrentView('dashboard')} className="ide-btn-icon" style={{ padding: '2px 4px', fontSize: '0.8rem', height: 'auto', width: 'auto' }} title="Back to Dashboard">←</button>
              {activeActivity === 'explorer' ? 'Explorer — Spark Studio' : activeActivity.toUpperCase()}
            </div>
            {renderSidebar()}
          </div>

          {/* Main IDE area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="editor-tabs" style={{ justifyContent: 'space-between', paddingRight: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  className="ide-input"
                  value={workspaceType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setWorkspaceType(nextType);
                    if (nextType === 'personal') {
                      setTeamFiles(generatedFiles || {});
                      setGeneratedFiles(personalFiles || {});
                    } else {
                      updatePersonalFiles(generatedFiles || {});
                      setGeneratedFiles(teamFiles || {});
                    }
                  }}
                  style={{ marginLeft: '10px', height: '28px', padding: '0 8px', width: 'auto', background: 'var(--panel-elevated)', color: 'var(--text-main)', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
                >
                  <option value="personal" style={{ background: 'var(--panel-elevated)', color: 'var(--text-main)' }}>Personal Workspace</option>
                  <option value="team" style={{ background: 'var(--panel-elevated)', color: 'var(--text-main)' }}>Team Workspace</option>
                </select>
                {workspaceType === 'team' && generatedFiles && Object.keys(generatedFiles).length > 0 && (
                  <button 
                    className="ide-btn" 
                    style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.75rem', height: '24px', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-main)' }}
                    title="Copy Team files to Personal Workspace"
                    onClick={() => {
                      const newPers = { ...(personalFiles || {}), ...generatedFiles };
                      updatePersonalFiles(newPers);
                      setPersonalProjectName(teamProjectName);
                      setTeamFiles(generatedFiles);
                      setWorkspaceType('personal');
                    }}
                  >
                    Copy to Personal
                  </button>
                )}
                {workspaceType === 'personal' && generatedFiles && Object.keys(generatedFiles).length > 0 && (
                  <button 
                    className="ide-btn" 
                    style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.75rem', height: '24px', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-main)' }}
                    title="Copy Personal files to Team Workspace"
                    onClick={() => {
                      const mergedFiles = { ...(teamFiles || {}), ...generatedFiles };
                      setTeamFiles(mergedFiles);
                      setTeamProjectName(personalProjectName);
                      updatePersonalFiles(generatedFiles);
                      setWorkspaceType('team');
                      // Broadcast these files to the team
                      if (identity) {
                        const wsId = getOrCreateWorkspaceId();
                        broadcastCodeGenerated(wsId, mergedFiles);
                        try {
                          const token = localStorage.getItem('spark_token');
                          if (token) {
                            fetch(`${API_BASE_URL}/api/workspace/${wsId}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ files: mergedFiles })
                            });
                            fetch(`${API_BASE_URL}/api/workspace/${wsId}/commit`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ action: 'commit', details: `Merged personal files to team` })
                            });

                            if (import.meta.env.VITE_DIGEST_WEBHOOK_URL) {
                              fetch(import.meta.env.VITE_DIGEST_WEBHOOK_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'commit', user: identity.name, workspaceId: wsId, details: 'Merged personal files to team' })
                              }).catch(e => console.error("Webhook failed:", e));
                            }
                          }
                        } catch (e) {}
                        broadcastNotification(`${identity.name} pushed personal files to the team workspace.`, 'info');
                      }
                    }}
                  >
                    Copy to Team
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Notion-style avatar cluster */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    title={`${identity.name} (You)`}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: identity.color || 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                      border: '2px solid var(--app-bg)',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                      zIndex: 10, flexShrink: 0, cursor: 'default', position: 'relative'
                    }}
                  >
                    {identity.avatarUrl ? (
                      <img src={identity.avatarUrl} alt={identity.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <>{identity.initials || identity.name?.substring(0, 2).toUpperCase() || 'U'}</>
                    )}
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid var(--app-bg)' }} />
                  </div>
                  {members.filter(m => m.id !== identity.id).map((m, i) => (
                    <div
                      key={m.id || i}
                      title={m.name}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: m.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700,
                        border: '2px solid var(--app-bg)',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                        marginLeft: -8, zIndex: 9 - i, flexShrink: 0, cursor: 'default', position: 'relative'
                      }}
                    >
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <>{m.initials}</>
                      )}
                      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid var(--app-bg)' }} />
                    </div>
                  ))}
                </div>
                <div style={{ width: 1, height: 18, background: 'var(--panel-border)', margin: '0 4px' }} />
                <ShareButton 
                  generatedFiles={activeSourceFile && generatedFiles && generatedFiles[activeSourceFile] ? { [activeSourceFile]: generatedFiles[activeSourceFile] } : generatedFiles} 
                  projectName={appProjectName} 
                  workspaceId={getOrCreateWorkspaceId()} 
                />
                <button className="ide-btn" style={{ margin: 0, width: 'auto', padding: '6px 14px', fontSize: '0.8rem', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', color: 'var(--text-main)', cursor: 'pointer' }} onClick={handleInvite}>
                  {inviteToast ? 'Copied' : 'Invite'}
                </button>
                <button className="ide-btn" style={{ margin: 0, marginLeft: 8, width: 'auto', padding: '6px 14px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--accent, #4D3DF7)', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => {
                  const link = window.prompt("Paste the Workspace Link to join:");
                  if (link) {
                    try {
                      const url = new URL(link);
                      if (url.searchParams.has('owner') && url.searchParams.has('workspace')) {
                        window.location.href = link;
                      } else {
                        alert("Invalid workspace link. It should contain '?owner=...' and '&workspace=...'");
                      }
                    } catch (e) {
                      alert("Invalid link format. Please paste a full URL.");
                    }
                  }
                }}>
                  Join Team
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Canvas Editor OR Full Preview OR Source Full Screen */}
              {activeActivity === 'source' ? (
                <div style={{ flex: 1, width: '100%', height: '100%' }}>
                  <CodeEditor 
                    files={generatedFiles} 
                    onFilesChange={setGeneratedFiles} 
                    onSelectFile={(f) => {
                      setActiveSourceFile(f);
                      setSelectedFile(f);
                    }}
                    theme={theme} 
                    activeFile={activeSourceFile}
                    readOnly={isReadOnly}
                  />
                </div>
              ) : activeActivity === 'preview' ? (
                <div style={{ flex: 1, height: '100%', background: '#fff' }}>
                  <FastPreviewIframe 
                    generatedFiles={generatedFiles} 
                    activePreviewFile={activeSourceFile} 
                    onSelectFrontendFile={(f) => {
                      setActiveSourceFile(f);
                      setSelectedFile(f);
                    }} 
                  />
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <CanvasEditor 
                    newGeneratedFiles={generatedFiles} 
                    manualFile={manualFile} 
                    theme={theme} 
                    onFileDelete={handleDeleteFile} 
                    onFileSelect={(filename) => {
                      setSelectedFile(filename);
                      setActiveSourceFile(filename);
                    }}
                    readOnly={isReadOnly} 
                  />
                </div>
              )}
            </div>

            {/* Bottom Terminal Panel (Hidden entirely if non-technical, unless AI builder needs it) */}
            <div className="bottom-panel" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '300px' }}>
              <div className="panel-header">
                {(isNonTech ? ['ai builder'] : ['ai builder', 'terminal', 'output']).map(t => (
                  <span key={t}
                    style={{ cursor: 'pointer', textTransform: 'uppercase', color: activeTab === t ? 'var(--text-main)' : '#555', borderBottom: activeTab === t ? '2px solid var(--accent)' : 'none', paddingBottom: '2px' }}
                    onClick={() => setActiveTab(t)}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="panel-content" style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'ai builder' ? (
                  pendingReview ? (
                    <CodeReviewPanel
                      pendingFiles={pendingReview.files}
                      originalPrompt={pendingReview.prompt}
                      projectName={pendingReview.projectName}
                      reviewResult={pendingReview.reviewResult}
                      isReviewing={isReviewing}
                      onFileSelect={(filename) => {
                        setSelectedFile(filename);
                        setActiveSourceFile(filename);
                      }}
                      onApply={handleApplyToCanvas}
                      onDiscard={() => setPendingReview(null)}
                    />
                  ) : (
                    <IntentToApp onAppGenerated={setAndBroadcastFiles} generatedFiles={generatedFiles} dbConfig={dbConfig} projectName={appProjectName} setProjectName={setAppProjectName} workspaceId={getOrCreateWorkspaceId()} setDbConfig={setDbConfig} stylingPreference={stylingPreference} />
                  )
                ) : activeTab === 'terminal' ? (
                  <div>
                    <span style={{ color: '#00fa9a' }}>spark@webcontainer:~$</span>
                    {wcBooted ? ' npm run dev  [running on port 3000]' : ' booting WebContainer environment…'}
                    <br /><br />
                    <span style={{ color: '#555' }}>&gt; {wcBooted ? 'Ready.' : 'Waiting for WebContainer headers…'}</span>

                    {/* Activity Logs */}
                    <div style={{ marginTop: '1rem' }}>
                      {terminalLogs.map((log, i) => (
                        <div key={i} style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '4px', fontFamily: 'monospace' }}>
                          <span style={{ color: '#79c0ff' }}>→</span> {log}
                        </div>
                      ))}
                    </div>

                    {wcCrashLog && (
                      <div style={{ marginTop: '1rem', background: 'rgba(241, 76, 76, 0.1)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(241, 76, 76, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#f14c4c', fontWeight: 'bold', fontSize: '0.75rem' }}>RUNTIME ERROR</span>
                          <button
                            onClick={handleAutoHeal}
                            style={{ background: 'linear-gradient(135deg, #6e40c9, #58a6ff)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✨ Auto-Heal with AI
                          </button>
                        </div>
                        <pre style={{ color: '#f14c4c', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-family)', fontSize: '0.82rem', margin: 0 }}>
                          {wcCrashLog}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#555' }}>No output recorded.</div>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundaryWrapper>
      </div>
        )}

      {/* Real-time Notifications Toast */}
      {notifications.length > 0 && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              background: n.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'var(--panel-elevated)',
              color: n.type === 'success' ? '#fff' : 'var(--text-main)', 
              padding: '12px 20px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              border: n.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--panel-border)',
              animation: 'slideInRight 0.3s ease-out forwards',
              maxWidth: '350px'
            }}>
              {n.type === 'success' ? '✨' : '🔔'} {n.message}
            </div>
          ))}
        </div>
      )}
      </AutomationProvider>
    );
  };

  return (
    <>
      {renderAppContent()}

      {/* Floating Chat Widget Global */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px'
      }}>
        {isChatOpen && (
          <div style={{
            width: '380px', height: '500px', background: 'var(--panel-elevated)',
            borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--panel-border)', overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out',
            backdropFilter: 'blur(20px)'
          }}>
            <ProjectChatBot files={generatedFiles} mode={currentView === 'workspace' ? 'workspace' : 'dashboard'} />
          </div>
        )}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent-color, #4d3df7)', color: '#fff', border: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', transition: 'transform 0.2s'
          }}
          title="Toggle AI Assistant"
        >
          {isChatOpen ? '✕' : '💬'}
        </button>
      </div>
    </>
  );
}

export default App;
