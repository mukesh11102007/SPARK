import React, { useState, useEffect, useCallback } from 'react';
import { AutomationProvider, useAutomation } from './contexts/AutomationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasEditor } from './components/CanvasEditor';
import { bootWebContainer } from './services/WebContainerService';
import { generateAppFromVoice, refineAppCode, reviewAndFixCode, autoHealCode } from './services/AIOrchestrator';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { UserIdentityModal } from './components/UserIdentityModal';
import {
  getOrCreateUserIdentity, getOrCreateWorkspaceId, getWorkspaceInviteUrl,
  joinWorkspacePresence, broadcastCodeGenerated, fetchWorkspaceFiles
} from './services/SupabaseService';
import { provisionUserDatabase, fetchWorkspaceDatabase } from './services/DatabaseService';
import sdk from '@stackblitz/sdk';
import { FastPreviewIframe } from './components/FastPreviewIframe';
import { deployProject } from './services/DeployService';
import { AuthModal } from './components/AuthModal';
import { CodeEditor } from './components/CodeEditor';

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

const FileExplorer = ({ onAddFile }) => {
  const [newFile, setNewFile] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newFile.trim()) { onAddFile(newFile.trim()); setNewFile(''); }
  };
  return (
    <div className="sidebar-section">
      <h3>
        PROJECT FILES
        <button className="ide-btn-icon" onClick={() => onAddFile('NewComponent.jsx')} title="Add File">+</button>
      </h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Filename (e.g. Button.jsx)"
          className="ide-input"
          value={newFile}
          onChange={(e) => setNewFile(e.target.value)}
        />
      </form>
    </div>
  );
};

const IntentToApp = ({ onAppGenerated, generatedFiles, dbConfig, projectName, setProjectName }) => {
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
    if (!input.trim()) return;
    if (!projectName.trim()) { alert('Please enter a project name first!'); return; }

    if (isEnhance && (!generatedFiles || Object.keys(generatedFiles).length === 0)) {
      alert('Please Build an app first before enhancing!');
      return;
    }

    setIsProcessing(true);
    setStatusMsg(isEnhance ? '✨ Enhancing your code...' : cookingMessages[Math.floor(Math.random() * cookingMessages.length)]);

    try {
      let code;
      if (isEnhance) {
        // Find the main component code
        // Find the specific component code
        let mainCode = generatedFiles[selectedFile];
        if (!mainCode) { alert('Selected file not found!'); return; }

        const enhancedCode = await refineAppCode(mainCode, input, projectName.trim(), selectedFile, dbConfig);
        code = { ...generatedFiles, ...enhancedCode };
      } else {
        const newCode = await generateAppFromVoice(input, projectName.trim(), dbConfig);
        code = { ...(generatedFiles || {}), ...newCode };
      }

      setStatusMsg(isEnhance ? '✨ Enhancing & reviewing...' : '🔍 Reviewing code before applying...');
      onAppGenerated(code, input, projectName.trim(), isEnhance);
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
          placeholder="Project Name (e.g. TaskManager)"
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
            value={selectedFile}
            onChange={e => setSelectedFile(e.target.value)}
            disabled={busy}
            style={{ marginBottom: '8px' }}
          >
            {Object.keys(generatedFiles).map(f => (
              <option key={f} value={f}>{f}</option>
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
            style={{ flex: 1, minWidth: '80px', color: isListening ? '#f14c4c' : '', borderColor: isListening ? '#f14c4c' : '' }}>
            {isListening ? '● Listening' : '🎤 Speak'}
          </button>
          <button type="submit" className="ide-btn" disabled={busy || !textInput.trim() || !projectName.trim()} style={{ flex: 1, minWidth: '80px', background: busy ? '' : 'var(--vscode-accent)' }}>
            {isProcessing && statusMsg && !statusMsg.includes('Enhancing') ? 'Building...' : '⚡ Build'}
          </button>
          <button
            type="button"
            className="ide-btn"
            onClick={() => processInput(textInput, true)}
            disabled={busy || !textInput.trim() || !projectName.trim() || !generatedFiles || Object.keys(generatedFiles).length === 0}
            style={{ flex: 1, minWidth: '80px', background: 'transparent', borderColor: 'var(--vscode-accent)', color: 'var(--vscode-accent)' }}
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

  return (
    <div className="sidebar-section">
      <h3>ACTIONS</h3>
      <button className="ide-btn ide-btn-secondary" onClick={handleCrash} disabled={isPatching}>
        {isPatching ? 'Patching via Watchdog...' : '⚠️ Simulate WC Crash'}
      </button>
    </div>
  );
};

const SettingsPanel = ({ currentTheme, setTheme, identity, onLogout, workspaceId }) => {
  const [workspaceMembers, setWorkspaceMembers] = React.useState([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  React.useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem('spark_token');
      if (!token) return;
      setLoadingMembers(true);
      try {
        const res = await fetch(`http://localhost:3001/api/workspace/${workspaceId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setWorkspaceMembers(await res.json());
      } catch (e) {
        console.error('Failed to fetch members', e);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [workspaceId]);

  const handleRoleChange = async (targetUserId, newRole) => {
    const token = localStorage.getItem('spark_token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/workspace/${workspaceId}/member`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUserId, role: newRole })
      });
      if (res.ok) {
        setWorkspaceMembers(prev => prev.map(m => m.id === targetUserId ? { ...m, role: newRole } : m));
      } else {
        alert('Failed to update role. You might not be the owner.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isOwner = workspaceMembers.find(m => m.email === identity?.email)?.role === 'owner';

  return (
    <div>
      <div className="sidebar-section">
        <h3>ACCOUNT</h3>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: identity?.color || 'var(--vscode-accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700
            }}>
              {identity?.initials || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--vscode-text)' }}>{identity?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{identity?.email}</div>
            </div>
          </div>
          {identity?.developerType && (
            <div style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--glass-bg)', display: 'inline-block', borderRadius: '4px', color: 'var(--vscode-accent)', fontWeight: 600 }}>
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
                  <div style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    'package.json': `{\n  "name": "spark-generated-app",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1" },\n  "devDependencies": { "@vitejs/plugin-react": "^4.2.1", "vite": "^5.2.0" }\n}`,
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
  if (mainComponent) {
    files['src/App.jsx'] = `import React from 'react';\nimport ${mainComponent} from './${mainComponent}';\nexport default function App() { return (<div style={{padding:'1.5rem',fontFamily:'Inter,sans-serif'}}><${mainComponent} /></div>); }`;
  }
  return files;
};

// ── Deploy Button — Lovable-style: SPARK owns the Vercel token, users just click Share ──

const ShareButton = ({ generatedFiles, projectName, workspaceId }) => {
  const { runAutomation } = useAutomation();
  const [status, setStatus] = useState('idle'); // 'idle' | 'deploying' | 'done' | 'error'
  const [link, setLink] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeploy = async () => {
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) return;
    setStatus('deploying');
    setErrorMsg('');
    try {
      const url = await deployProject(generatedFiles, projectName || 'spark-app', workspaceId);
      setLink(url);
      setStatus('done');
      runAutomation('deployment', { url, timestamp: Date.now() });
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
        Publishing...
      </div>
    );
  }

  if (status === 'done' && link) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px' }}>
          <span style={{ color: '#16a34a', fontSize: 11 }}>●</span>
          <a href={link} target="_blank" rel="noreferrer"
            style={{ fontSize: '0.78rem', color: '#15803d', textDecoration: 'none', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={link}
          >{link.replace('https://', '')}</a>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); }}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b' }}
          title="Copy link"
        >Copy</button>
        <button
          onClick={() => { setStatus('idle'); setLink(null); }}
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
      className="ide-btn premium-btn share-btn"
      onClick={handleDeploy}
      disabled={!hasFiles}
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

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [manualFile, setManualFile] = useState(null);
  const [wcBooted, setWcBooted] = useState(false);
  const [activeTab, setActiveTab] = useState('ai builder');
  const [activeActivity, setActiveActivity] = useState('explorer');
  const [activeSourceFile, setActiveSourceFile] = useState(null);
  const [theme, setTheme] = useState('light');
  const [wcCrashLog, setWcCrashLog] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [workspaceType, setWorkspaceType] = useState('team'); // 'personal' | 'team'
  const [personalFiles, setPersonalFiles] = useState({});
  const [teamFiles, setTeamFiles] = useState(null);
  const [appProjectName, setAppProjectName] = useState('spark-app');
  
  // ── Database state ─────────────────────────────────────────────────────────
  const [dbStatus, setDbStatus] = useState('idle');
  const [dbConfig, setDbConfig] = useState(null);

  useEffect(() => {
    const wsId = getOrCreateWorkspaceId();
    fetchWorkspaceDatabase(wsId).then(cfg => {
      if (cfg) {
        setDbConfig(cfg);
        setDbStatus('active');
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

  // Join the workspace presence channel once identity is set
  useEffect(() => {
    if (!identity) return;
    const workspaceId = getOrCreateWorkspaceId();

    // Fetch historical workspace files from Express backend
    const loadTeamFiles = async () => {
      try {
        const token = localStorage.getItem('spark_token');
        if (!token) return;
        const res = await fetch(`http://localhost:3001/api/workspace/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && Object.keys(data.files).length > 0) {
            setGeneratedFiles(data.files);
            setTeamFiles(data.files);
            logActivity(`Fetched ${Object.keys(data.files).length} files from Workspace Database.`);
          } else {
            // Fallback to Supabase logs for older workspaces
            fetchWorkspaceFiles(workspaceId).then(supaFiles => {
              if (supaFiles && Object.keys(supaFiles).length > 0) {
                setGeneratedFiles(supaFiles);
                setTeamFiles(supaFiles);
                logActivity(`Migrated ${Object.keys(supaFiles).length} files from Supabase history.`);
                // Save to MongoDB to complete migration
                fetch(`http://localhost:3001/api/workspace/${workspaceId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ files: supaFiles })
                });
              } else {
                setTeamFiles({});
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load team files from DB', err);
        setTeamFiles({});
      }
    };
    loadTeamFiles();

    // Load Personal Files from Local Storage
    const savedPersonal = localStorage.getItem('spark_personal_files');
    if (savedPersonal) {
      try {
        setPersonalFiles(JSON.parse(savedPersonal));
      } catch (e) {}
    }

    window.__sparkOnRemoteCodeGenerated = (files) => {
      setGeneratedFiles(prev => ({ ...prev, ...files }));
      logActivity(`Remote teammate generated: ${Object.keys(files).join(', ')}`);
    };
    const unsubscribe = joinWorkspacePresence(workspaceId, identity, (newMembers) => {
      setMembers([...newMembers]);
    });
    return () => {
      unsubscribe();
      window.__sparkOnRemoteCodeGenerated = null;
    };
  }, [identity]);

  // Called by IntentToApp — triggers review pipeline instead of direct canvas apply
  const setAndBroadcastFiles = useCallback(async (files, originalPrompt, projectName) => {
    setActiveTab('ai builder');
    setPendingReview({ files, prompt: originalPrompt || '', projectName: projectName || '', reviewResult: null });
    setIsReviewing(true);

    try {
      const { files: fixedFiles, review } = await reviewAndFixCode(files, originalPrompt || '', projectName || '');
      setPendingReview({ files: fixedFiles, prompt: originalPrompt || '', projectName: projectName || '', reviewResult: review });
    } catch (e) {
      console.error('[Review] failed, applying original:', e);
      setPendingReview(prev => prev ? { ...prev, reviewResult: { status: 'ok', issues: [] } } : null);
    } finally {
      setIsReviewing(false);
    }
  }, []);

  const handleInvite = () => {
    const url = getWorkspaceInviteUrl();
    navigator.clipboard.writeText(url).then(() => {
      setInviteToast(true);
      setTimeout(() => setInviteToast(false), 3000);
    }).catch(() => {
      prompt('Copy this invite link:', getWorkspaceInviteUrl());
    });
  };

  const handleApplyToCanvas = async (files) => {
    setGeneratedFiles(files);
    setPendingReview(null);
    setWcCrashLog(null);
    logActivity(`${identity?.name || 'You'} applied to canvas: ${Object.keys(files).join(', ')}`);
    
    if (workspaceType === 'personal') {
      const newPersonal = { ...personalFiles, ...files };
      setPersonalFiles(newPersonal);
      localStorage.setItem('spark_personal_files', JSON.stringify(newPersonal));
    } else {
      if (identity) {
        const workspaceId = getOrCreateWorkspaceId();
        broadcastCodeGenerated(workspaceId, files);
        
        // Save to MongoDB Backend
        try {
          const token = localStorage.getItem('spark_token');
          if (token) {
            fetch(`http://localhost:3001/api/workspace/${workspaceId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ files })
            });
          }
        } catch (e) {
          console.error('Failed to save to MongoDB:', e);
        }
      }
    }
  };

  const handleAutoHeal = async () => {
    if (!generatedFiles || !wcCrashLog) return;
    setActiveTab('ai builder');
    setPendingReview({ files: generatedFiles, prompt: 'Auto-healing crash', projectName: 'CrashFix', reviewResult: null });
    setIsReviewing(true);

    try {
      const fixedFiles = await autoHealCode(generatedFiles, wcCrashLog);
      setPendingReview({ files: fixedFiles, prompt: 'Auto-healing crash', projectName: 'CrashFix', reviewResult: { status: 'fixed', issues: ['Auto-healed based on WebContainer runtime error logs.'] } });
    } catch (e) {
      console.error('Auto-heal failed:', e);
      setPendingReview(null);
      alert('Failed to auto-heal the code.');
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => { document.body.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { bootWebContainer().then(() => setWcBooted(true)).catch(() => { }); }, []);

  const handleAddManualFile = (filename) => setManualFile({ name: filename, timestamp: Date.now() });

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
          <div style={{ background: 'var(--vscode-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--vscode-border)' }}>
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
          onLogout={() => {
            localStorage.removeItem('spark_user');
            localStorage.removeItem('spark_token');
            setIdentity(null);
          }}
        />
      );
    }
    if (activeActivity === 'preview') return (
      <div className="sidebar-section">
        <h3>LIVE PREVIEW</h3>
        <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>
          👁️ Preview mode active.<br/><br/>
          The live app is now rendering in the main window.<br/><br/>
          Switch back to the Explorer (📄) to see your code.
        </p>
      </div>
    );
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
                  color: activeSourceFile === file ? 'var(--vscode-accent)' : 'var(--vscode-text)',
                  borderLeft: activeSourceFile === file ? '3px solid var(--vscode-accent)' : '3px solid transparent'
                }}
              >
                📄 {file}
              </div>
            ))}
          </div>
          {fileKeys.length > 0 && (
            <button 
              className="ide-btn" 
              style={{ marginTop: '15px' }}
              onClick={() => handleApplyToCanvas(generatedFiles)}
            >
              Save & Sync Changes
            </button>
          )}
        </div>
      );
    }
    return (
      <>
        <FileExplorer onAddFile={handleAddManualFile} />
        <DatabasePanel />
        {members.length > 0 && (
          <div className="sidebar-section">
            <h3>ONLINE NOW ({members.length})</h3>
            {members.map((m, i) => (
              <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>
                  {m.initials}
                </div>
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
    { id: 'source', icon: '🌿' },
    { id: 'settings', icon: '⚙️' }
  ];

  if (!identity) {
    return <AuthModal onLogin={setIdentity} />;
  }

  return (
    <AutomationProvider>
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
            <div className="ide-sidebar-header">
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
                      setPersonalFiles(generatedFiles || {});
                      setGeneratedFiles(teamFiles || {});
                    }
                  }}
                  style={{ marginLeft: '10px', height: '24px', padding: '0 8px', width: 'auto', background: 'transparent', border: '1px solid var(--vscode-border)', borderRadius: '4px' }}
                >
                  <option value="personal">Personal Workspace</option>
                  <option value="team">Team Workspace</option>
                </select>
                {workspaceType === 'team' && generatedFiles && Object.keys(generatedFiles).length > 0 && (
                  <button 
                    className="ide-btn" 
                    style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.75rem', height: '24px', background: 'transparent', border: '1px solid var(--vscode-border)', color: 'var(--vscode-text)' }}
                    title="Copy Team files to Personal Workspace"
                    onClick={() => {
                      setPersonalFiles({...generatedFiles});
                      setTeamFiles(generatedFiles);
                      setWorkspaceType('personal');
                    }}
                  >
                    Copy to Personal
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
                      background: identity.color || 'var(--vscode-accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                      border: '2px solid var(--vscode-bg)',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                      zIndex: 10, flexShrink: 0, cursor: 'default', position: 'relative'
                    }}
                  >
                    {identity.initials || identity.name?.substring(0, 2).toUpperCase() || 'U'}
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid var(--vscode-bg)' }} />
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
                        border: '2px solid var(--vscode-bg)',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                        marginLeft: -8, zIndex: 9 - i, flexShrink: 0, cursor: 'default', position: 'relative'
                      }}
                    >
                      {m.initials}
                      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid var(--vscode-bg)' }} />
                    </div>
                  ))}
                </div>
                <div style={{ width: 1, height: 18, background: 'var(--vscode-border)', margin: '0 4px' }} />
                <ShareButton generatedFiles={generatedFiles} projectName={appProjectName} workspaceId={getOrCreateWorkspaceId()} />
                <button className="ide-btn premium-btn invite-btn" onClick={handleInvite}>
                  {inviteToast ? 'Copied' : 'Invite'}
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
                    theme={theme} 
                    activeFile={activeSourceFile}
                  />
                </div>
              ) : activeActivity === 'preview' ? (
                <div style={{ flex: 1, height: '100%', background: '#fff' }}>
                  <FastPreviewIframe generatedFiles={generatedFiles} />
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <CanvasEditor newGeneratedFiles={generatedFiles} manualFile={manualFile} theme={theme} />
                </div>
              )}
            </div>

            {/* Bottom Terminal Panel (Hidden entirely if non-technical, unless AI builder needs it) */}
            <div className="bottom-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                {(isNonTech ? ['ai builder'] : ['ai builder', 'terminal', 'output']).map(t => (
                  <span key={t}
                    style={{ cursor: 'pointer', textTransform: 'uppercase', color: activeTab === t ? 'var(--vscode-text)' : '#555', borderBottom: activeTab === t ? '1px solid var(--vscode-accent)' : 'none', paddingBottom: '2px' }}
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
                      onApply={handleApplyToCanvas}
                      onDiscard={() => setPendingReview(null)}
                    />
                  ) : (
                    <IntentToApp onAppGenerated={setAndBroadcastFiles} generatedFiles={generatedFiles} dbConfig={dbConfig} projectName={appProjectName} setProjectName={setAppProjectName} />
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
    </AutomationProvider>
  );
}

export default App;
