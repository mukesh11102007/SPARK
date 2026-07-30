import React, { useState, useEffect, useCallback } from 'react';
import { AutomationProvider, useAutomation } from './contexts/AutomationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasEditor } from './components/CanvasEditor';
import { bootWebContainer } from './services/WebContainerService';
import { generateAppFromVoice, refineAppCode, reviewAndFixCode } from './services/AIOrchestrator';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { UserIdentityModal } from './components/UserIdentityModal';
import {
  getOrCreateUserIdentity, getOrCreateWorkspaceId, getWorkspaceInviteUrl,
  joinWorkspacePresence, broadcastCodeGenerated,
} from './services/SupabaseService';

// ── Sidebar sub-components ─────────────────────────────────────────────────────

const WorkflowDashboard = () => {
  const { statuses } = useAutomation();
  const workflows = [
    { id: 'watchdog',       name: 'Watchdog',       desc: 'Error Handling'    },
    { id: 'deployment',     name: 'Deployment',     desc: 'Vercel CI/CD'      },
    { id: 'errorAlert',     name: 'Error-Alert',    desc: 'Discord / Telegram'},
    { id: 'versionControl', name: 'Version-Control',desc: 'Rollback / History'},
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

const IntentToApp = ({ onAppGenerated, generatedFiles }) => {
  const [isListening, setIsListening] = useState(false);
  const [projectName, setProjectName] = useState('');
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
        if(!mainCode) { alert('Selected file not found!'); return; }
        
        const enhancedCode = await refineAppCode(mainCode, input, projectName.trim(), selectedFile);
        code = { ...generatedFiles, ...enhancedCode };
      } else {
        code = await generateAppFromVoice(input, projectName.trim());
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
    r.onstart  = () => setIsListening(true);
    r.onresult = (e) => { setIsListening(false); processInput(e.results[0][0].transcript); };
    r.onerror  = () => setIsListening(false);
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

const SettingsPanel = ({ currentTheme, setTheme }) => (
  <div className="sidebar-section">
    <h3>THEME</h3>
    <select className="ide-input" value={currentTheme} onChange={(e) => setTheme(e.target.value)}>
      <option value="antigravity">Antigravity Dark</option>
      <option value="classic">VS Code Classic</option>
      <option value="light">Light Mode</option>
    </select>
  </div>
);

import sdk from '@stackblitz/sdk';

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

// ── Live Preview ──────────────────────────────────────────────────────────────
const handlePreview = (generatedFiles) => {
  const files = buildProjectFiles(generatedFiles);
  sdk.openProject({
    title: 'SPARK Live Preview',
    description: 'Preview of your generated application',
    template: 'node',
    files,
  }, { openAsWindow: true, view: 'preview', hideExplorer: true, hideNavigation: true });
};

// ── Share Button (defined OUTSIDE App so hooks are valid) ──────────────────────
import { deployToVercel } from './services/VercelService';

const ShareButton = ({ generatedFiles }) => {
  const { runAutomation } = useAutomation();
  const [isDeploying, setIsDeploying] = useState(false);
  const [link, setLink] = useState(null);

  const handleShare = async () => {
    setIsDeploying(true);
    try {
      const files = buildProjectFiles(generatedFiles);
      
      // Push to Vercel API
      const deployedUrl = await deployToVercel(files);
      setLink(deployedUrl);
      
      runAutomation('deployment', { projectState: 'vercel-deployed', timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to deploy to Vercel:', e);
      alert('Vercel Deployment Failed: ' + e.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {link ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.75rem', color: '#79c0ff' }}>Deployed:</span>
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#00fa9a', textDecoration: 'none' }} title={link}>
            Vercel URL ↗
          </a>
        </div>
      ) : (
        <button
          className="ide-btn"
          onClick={handleShare}
          disabled={isDeploying || !generatedFiles}
          title={generatedFiles ? "Deploy permanently to Vercel" : "Generate a component first"}
          style={{ margin: 0, padding: '4px 18px', borderRadius: '20px', background: 'var(--vscode-accent)', color: '#fff', fontWeight: 700, border: 'none', opacity: generatedFiles ? 1 : 0.5 }}
        >
          {isDeploying ? 'Publishing…' : 'Share'}
        </button>
      )}
    </div>
  );
};

// ── Error boundary wrapper ─────────────────────────────────────────────────────
const ErrorBoundaryWrapper = ({ children }) => (
  <ErrorBoundary onAutomationTrigger={() => {}} onAutomationEnd={() => {}}>{children}</ErrorBoundary>
);

// ── Preview Button ──────────────────────────────────────────────────────────
const PreviewButton = ({ generatedFiles }) => {
  const hasFiles = generatedFiles && Object.keys(generatedFiles).length > 0;
  return (
    <button
      className="ide-btn"
      onClick={() => handlePreview(generatedFiles)}
      disabled={!hasFiles}
      title={hasFiles ? 'Preview your generated app' : 'Generate a component first'}
      style={{ margin: 0, padding: '4px 14px', borderRadius: '20px', background: hasFiles ? '#2a2a4a' : 'transparent', color: hasFiles ? '#79c0ff' : '#555', fontWeight: 600, border: '1px solid', borderColor: hasFiles ? '#79c0ff55' : '#333' }}
    >
      👁 Live Preview
    </button>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [generatedFiles,  setGeneratedFiles]  = useState(null);
  const [manualFile,      setManualFile]      = useState(null);
  const [wcBooted,        setWcBooted]        = useState(false);
  const [activeTab,       setActiveTab]       = useState('terminal');
  const [activeActivity,  setActiveActivity]  = useState('explorer');
  const [theme,           setTheme]           = useState('antigravity');
  const [wcCrashLog,      setWcCrashLog]      = useState(null);

  // ── Code Review state ─────────────────────────────────────────────────
  const [pendingReview,   setPendingReview]   = useState(null); // { files, prompt, projectName, reviewResult }
  const [isReviewing,     setIsReviewing]     = useState(false);

  // ── Team / Presence state ──────────────────────────────────────────────────
  const [identity,        setIdentity]        = useState(() => getOrCreateUserIdentity());
  const [members,         setMembers]         = useState([]);
  const [inviteToast,     setInviteToast]     = useState(false);

  // Join the workspace presence channel once identity is set
  useEffect(() => {
    if (!identity) return;
    const workspaceId = getOrCreateWorkspaceId();
    window.__sparkOnRemoteCodeGenerated = (files) => {
      // Remote code comes straight to canvas (already reviewed on sender's side)
      setGeneratedFiles(files);
    };
    const unsubscribe = joinWorkspacePresence(workspaceId, identity, (newMembers) => {
      // Force a fresh array so React re-renders
      setMembers([...newMembers]);
    });
    return () => {
      unsubscribe();
      window.__sparkOnRemoteCodeGenerated = null;
    };
  }, [identity]);

  // Called by IntentToApp — triggers review pipeline instead of direct canvas apply
  const setAndBroadcastFiles = useCallback(async (files, originalPrompt, projectName) => {
    // Switch to AI BUILDER tab to show the review
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
      // Fallback: prompt the user to copy manually
      prompt('Copy this invite link:', getWorkspaceInviteUrl());
    });
  };

  const handleApplyToCanvas = (files) => {
    setGeneratedFiles(files);
    setPendingReview(null);
    // Broadcast to teammates
    if (identity) {
      const workspaceId = getOrCreateWorkspaceId();
      broadcastCodeGenerated(workspaceId, files);
    }
  };

  useEffect(() => { document.body.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { bootWebContainer().then(() => setWcBooted(true)).catch(() => {}); }, []);

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
  const [dbStatus, setDbStatus] = useState('idle');

  const handleProvision = () => {
    setDbStatus('provisioning');
    setTimeout(() => setDbStatus('active'), 3000);
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
        <div style={{ color: '#00fa9a', fontSize: '0.8rem' }}>Spinning up instances...</div>
      )}
      {dbStatus === 'active' && (
        <div style={{ background: '#1e1e1e', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ color: '#00fa9a', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>● Database Active</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Credentials injected into StackBlitz deployment.</div>
        </div>
      )}
    </div>
  );
};

  const renderSidebar = () => {
    if (activeActivity === 'settings') return <SettingsPanel currentTheme={theme} setTheme={setTheme} />;
    if (activeActivity === 'search')   return <div className="sidebar-section"><p style={{opacity:0.4,fontSize:'0.8rem'}}>Search not yet implemented.</p></div>;
    if (activeActivity === 'source')   return <div className="sidebar-section"><p style={{opacity:0.4,fontSize:'0.8rem'}}>Source control not yet implemented.</p></div>;
    return (
      <>
        <FileExplorer onAddFile={handleAddManualFile} />
        <DatabasePanel />
        {/* Team Members in sidebar */}
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

  const activityIcons = [
    { id: 'explorer', icon: '📄' },
    { id: 'search',   icon: '🔍' },
    { id: 'source',   icon: '🌿' },
  ];

  if (!identity) {
    return <UserIdentityModal onIdentitySet={setIdentity} />;
  }

  return (
    <AutomationProvider>
      <div className="ide-layout">

        {/* Activity Bar */}
        <div className="activity-bar">
          {activityIcons.map(({ id, icon }) => (
            <div key={id} className={`activity-icon ${activeActivity === id ? 'active' : ''}`} onClick={() => setActiveActivity(id)}>{icon}</div>
          ))}
          <div
            className={`activity-icon ${activeActivity === 'settings' ? 'active' : ''}`}
            style={{ marginTop: 'auto', marginBottom: '10px' }}
            onClick={() => setActiveActivity('settings')}
          >⚙️</div>
        </div>

        <ErrorBoundaryWrapper>
          {/* Sidebar */}
          <div className="ide-sidebar">
            <div className="ide-sidebar-header">
              {activeActivity === 'explorer' ? 'Explorer — Spark Studio' : activeActivity.toUpperCase()}
            </div>
            {renderSidebar()}
          </div>

          {/* Main Editor */}
          <div className="ide-main">
            <div className="editor-tabs" style={{ justifyContent: 'space-between', paddingRight: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="tab">⚛️ Canvas.jsx</div>
                <select className="ide-input" style={{ marginLeft: '10px', height: '24px', padding: '0 8px', width: 'auto', background: 'transparent', border: '1px solid var(--vscode-border)', borderRadius: '4px' }}>
                  <option>Personal Workspace</option>
                  <option>Team Workspace</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Dynamic Team Presence Indicators */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Always show self */}
                  <div
                    title={`${identity.name} (You)`}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: identity.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 'bold', border: '2px solid var(--vscode-bg)', zIndex: 10, flexShrink: 0 }}
                  >{identity.initials}</div>
                  {/* Other online members */}
                  {members.filter(m => m.id !== identity.id).map((m, i) => (
                    <div
                      key={m.id || i}
                      title={`${m.name} (teammate)`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 'bold', border: '2px solid var(--vscode-bg)', marginLeft: '-8px', zIndex: 9 - i, flexShrink: 0 }}
                    >{m.initials}</div>
                  ))}
                </div>
                {/* Invite Button */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleInvite}
                    style={{ background: 'transparent', border: '1px dashed var(--vscode-border)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: inviteToast ? '#56d364' : 'var(--vscode-text)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  >
                    {inviteToast ? '✓ Link Copied!' : '+ Invite Team'}
                  </button>
                </div>
                <PreviewButton generatedFiles={generatedFiles} />
                <ShareButton generatedFiles={generatedFiles} />
              </div>
            </div>

            <CanvasEditor newGeneratedFiles={generatedFiles} manualFile={manualFile} />

            {/* Bottom Terminal Panel */}
            <div className="bottom-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                {['ai builder', 'terminal', 'output'].map(t => (
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
                    <IntentToApp onAppGenerated={setAndBroadcastFiles} generatedFiles={generatedFiles} />
                  )
                ) : activeTab === 'terminal' ? (
                  <div>
                    <span style={{ color: '#00fa9a' }}>spark@webcontainer:~$</span>
                    {wcBooted ? ' npm run dev  [running on port 3000]' : ' booting WebContainer environment…'}
                    <br /><br />
                    <span style={{ color: '#555' }}>&gt; {wcBooted ? 'Ready.' : 'Waiting for WebContainer headers…'}</span>
                    {wcCrashLog && (
                      <pre style={{ marginTop: '1rem', color: '#f14c4c', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-family)', fontSize: '0.82rem' }}>
                        {wcCrashLog}
                      </pre>
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
