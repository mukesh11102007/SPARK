import React, { useState, useEffect } from 'react';
import { AutomationProvider, useAutomation } from './contexts/AutomationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasEditor } from './components/CanvasEditor';
import { bootWebContainer } from './services/WebContainerService';
import { generateAppFromVoice } from './services/AIOrchestrator';

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

const IntentToApp = ({ onAppGenerated }) => {
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput]   = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processInput = async (input) => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const code = await generateAppFromVoice(input);
      onAppGenerated(code);
    } catch {
      alert('Gemini failed to generate code. Check your API key.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.onstart  = () => setIsListening(true);
    r.onresult = (e) => { setIsListening(false); processInput(e.results[0][0].transcript); };
    r.onerror  = () => setIsListening(false);
    r.start();
  };

  const busy = isListening || isProcessing;
  return (
    <div className="sidebar-section">
      <h3>INTENT TO APP</h3>
      <form onSubmit={(e) => { e.preventDefault(); processInput(textInput); setTextInput(''); }}>
        <input
          type="text"
          placeholder="Describe what to build..."
          className="ide-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={busy}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" className="ide-btn" onClick={handleListen} disabled={busy}
            style={{ flex: 1, color: isListening ? '#f14c4c' : '', borderColor: isListening ? '#f14c4c' : '' }}>
            {isListening ? '● Listening' : '🎤 Speak'}
          </button>
          <button type="submit" className="ide-btn" disabled={busy || !textInput.trim()} style={{ flex: 1 }}>
            Send
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

// ── Share Button (defined OUTSIDE App so hooks are valid) ──────────────────────
const ShareButton = () => {
  const { runAutomation, statuses } = useAutomation();
  const [link, setLink] = useState(null);
  const isDeploying = statuses.deployment === 'active';

  const handleShare = async () => {
    setLink(null);
    try {
      const p = runAutomation('deployment', { projectState: 'ready-to-deploy', timestamp: Date.now() });
      setTimeout(() => setLink('https://spark-studio-preview.vercel.app'), 2000);
      await p;
    } catch { /* webhook might be placeholder */ }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {link && (
        <a href={link} target="_blank" rel="noreferrer"
          style={{ fontSize: '0.75rem', color: '#00fa9a', textDecoration: 'none' }}>
          🔗 {link}
        </a>
      )}
      <button
        className="ide-btn"
        onClick={handleShare}
        disabled={isDeploying}
        style={{ margin: 0, padding: '4px 18px', borderRadius: '20px', background: 'var(--vscode-accent)', color: '#fff', fontWeight: 700, border: 'none' }}
      >
        {isDeploying ? 'Publishing…' : 'Share'}
      </button>
    </div>
  );
};

// ── Error boundary wrapper ─────────────────────────────────────────────────────
const ErrorBoundaryWrapper = ({ children }) => (
  <ErrorBoundary onAutomationTrigger={() => {}} onAutomationEnd={() => {}}>{children}</ErrorBoundary>
);

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [generatedFiles,  setGeneratedFiles]  = useState(null);
  const [manualFile,      setManualFile]      = useState(null);
  const [wcBooted,        setWcBooted]        = useState(false);
  const [activeTab,       setActiveTab]       = useState('terminal');
  const [activeActivity,  setActiveActivity]  = useState('explorer');
  const [theme,           setTheme]           = useState('antigravity');
  const [wcCrashLog,      setWcCrashLog]      = useState(null);

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

  const renderSidebar = () => {
    if (activeActivity === 'settings') return <SettingsPanel currentTheme={theme} setTheme={setTheme} />;
    if (activeActivity === 'search')   return <div className="sidebar-section"><p style={{opacity:0.4,fontSize:'0.8rem'}}>Search not yet implemented.</p></div>;
    if (activeActivity === 'source')   return <div className="sidebar-section"><p style={{opacity:0.4,fontSize:'0.8rem'}}>Source control not yet implemented.</p></div>;
    return (
      <>
        <FileExplorer onAddFile={handleAddManualFile} />
        <WorkflowDashboard />
        <IntentToApp onAppGenerated={setGeneratedFiles} />
        <ActionsPanel onSimulateCrash={handleSimulateCrash} />
      </>
    );
  };

  const activityIcons = [
    { id: 'explorer', icon: '📄' },
    { id: 'search',   icon: '🔍' },
    { id: 'source',   icon: '🌿' },
  ];

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
              <div className="tab">⚛️ Canvas.jsx</div>
              <ShareButton />
            </div>

            <CanvasEditor newGeneratedFiles={generatedFiles} manualFile={manualFile} />

            {/* Bottom Terminal Panel */}
            <div className="bottom-panel">
              <div className="panel-header">
                {['terminal', 'output'].map(t => (
                  <span key={t}
                    style={{ cursor: 'pointer', textTransform: 'uppercase', color: activeTab === t ? 'var(--vscode-text)' : '#555', borderBottom: activeTab === t ? '1px solid var(--vscode-accent)' : 'none', paddingBottom: '2px' }}
                    onClick={() => setActiveTab(t)}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="panel-content">
                {activeTab === 'terminal' ? (
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
