import React, { useState } from 'react';
import { generateAppFromVoice } from '../services/AIOrchestrator';
import { deployProject } from '../services/DeployService';

const steps = ['idle', 'building', 'reviewing', 'deploying', 'done', 'error'];

export const SparkLite = ({ workspaceId, dbConfig, identity, onSwitchPro }) => {
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState('idle'); // idle | building | deploying | done | error
  const [liveUrl, setLiveUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentApps, setRecentApps] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('spark_lite_apps') || '[]'); } catch { return []; }
  });

  const statusMap = {
    idle: null,
    building: { icon: '', text: 'AI is building your app...', color: '#6366f1' },
    reviewing: { icon: '', text: 'Reviewing & polishing code...', color: '#f59e0b' },
    deploying: { icon: '', text: 'Deploying to the cloud...', color: '#3b82f6' },
    done: { icon: '', text: 'Your app is live!', color: '#10b981' },
    error: { icon: '', text: errorMsg || 'Something went wrong. Please try again.', color: '#ef4444' },
  };

  const handleBuildAndDeploy = async () => {
    if (!prompt.trim()) return;
    setStep('building');
    setLiveUrl('');
    setErrorMsg('');

    try {
      // Step 1: Generate
      const files = await generateAppFromVoice(prompt, prompt.substring(0, 20), dbConfig);
      setStep('reviewing');

      // Step 2: Deploy
      setStep('deploying');
      const projectName = prompt.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30).toLowerCase();
      const result = await deployProject(
        { ...files, _prompt: prompt },
        projectName,
        workspaceId
      );

      const url = typeof result === 'string' ? result : result.url;
      setLiveUrl(url);
      setStep('done');

      // Save to session for recent apps
      const newApp = { prompt: prompt.substring(0, 60), url, ts: Date.now() };
      const updated = [newApp, ...recentApps].slice(0, 5);
      setRecentApps(updated);
      sessionStorage.setItem('spark_lite_apps', JSON.stringify(updated));

    } catch (e) {
      setErrorMsg(e.message || 'Unknown error');
      setStep('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(liveUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStatus = statusMap[step];
  const isProcessing = ['building', 'reviewing', 'deploying'].includes(step);

  return (
    <div style={{
      minHeight: '100vh', background: '#080c14',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', borderBottom: '1px solid #1f2937', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}></span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SPARK</span>
          <span style={{ background: '#1f2937', color: '#6b7280', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>SIMPLE MODE</span>
        </div>
        <button onClick={onSwitchPro} style={{
          background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
          borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
        }}>️ Switch to Pro Mode</button>
      </div>

      {/* Main Content */}
      <div style={{ width: '100%', maxWidth: '680px', textAlign: 'center', marginTop: '60px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1.15,
            color: '#f8fafc', margin: '0 0 16px'
          }}>
            Describe what you need.<br />
            <span style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              We build & deploy it.
            </span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.05rem', margin: 0 }}>
            No code, no servers, no DevOps. Just describe your internal tool and SPARK does the rest.
          </p>
        </div>

        {/* Prompt Box */}
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '20px', padding: '6px 6px 6px 20px', display: 'flex', gap: '10px', alignItems: 'flex-end', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', marginBottom: '24px' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isProcessing) { e.preventDefault(); handleBuildAndDeploy(); } }}
            placeholder="e.g. Build a leave request form for HR with approval tracking..."
            rows={3}
            disabled={isProcessing}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f8fafc', fontSize: '1rem', resize: 'none', fontFamily: 'inherit',
              lineHeight: 1.6, paddingTop: '12px'
            }}
          />
          <button
            onClick={handleBuildAndDeploy}
            disabled={isProcessing || !prompt.trim()}
            style={{
              background: isProcessing || !prompt.trim()
                ? '#1f2937'
                : 'linear-gradient(135deg, #10b981, #059669)',
              color: isProcessing || !prompt.trim() ? '#6b7280' : '#fff',
              border: 'none', borderRadius: '14px', padding: '14px 24px',
              fontWeight: 800, fontSize: '0.95rem', cursor: isProcessing || !prompt.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', minWidth: '160px', transition: 'all 0.2s',
              alignSelf: 'flex-end'
            }}
          >
            {isProcessing ? '⟳ Working...' : ' Build & Deploy'}
          </button>
        </div>

        {/* Status Strip */}
        {currentStatus && (
          <div style={{
            background: '#111827', border: `1px solid ${currentStatus.color}40`,
            borderRadius: '14px', padding: '18px 24px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
          }}>
            {isProcessing && (
              <div style={{
                width: '18px', height: '18px', border: `2px solid ${currentStatus.color}40`,
                borderTopColor: currentStatus.color, borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            )}
            <span style={{ fontSize: '1.2rem' }}>{currentStatus.icon}</span>
            <span style={{ color: currentStatus.color, fontWeight: 700, fontSize: '1rem' }}>{currentStatus.text}</span>
          </div>
        )}

        {/* Live URL Result */}
        {step === 'done' && liveUrl && (
          <div style={{
            background: 'linear-gradient(135deg, #064e3b20, #065f4620)',
            border: '1px solid #10b98140', borderRadius: '20px', padding: '28px',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}></div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981', marginBottom: '8px' }}>Your app is live!</div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '16px' }}>Share this link with your team. No login required for your users.</div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '12px 16px' }}>
              <a href={liveUrl} target="_blank" rel="noreferrer" style={{ flex: 1, color: '#6366f1', fontSize: '0.88rem', fontFamily: 'monospace', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liveUrl}</a>
              <button onClick={handleCopy} style={{ background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {copied ? ' Copied!' : ' Copy'}
              </button>
              <a href={liveUrl} target="_blank" rel="noreferrer">
                <button style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}> Open</button>
              </a>
            </div>

            <button onClick={() => { setStep('idle'); setPrompt(''); setLiveUrl(''); }}
              style={{ marginTop: '16px', background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              + Build Another App
            </button>
          </div>
        )}

        {/* Example Prompts */}
        {step === 'idle' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ color: '#4b5563', fontSize: '0.82rem', marginBottom: '12px' }}>Try an example:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {[
                'Employee leave request form with approval tracking',
                'Inventory management system with stock alerts',
                'Daily standup notes app with team collaboration',
                'Expense report tracker with category filters',
                'Customer feedback collector with dashboard',
              ].map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)} style={{
                  background: '#111827', border: '1px solid #1f2937', color: '#9ca3af',
                  borderRadius: '20px', padding: '6px 14px', fontSize: '0.78rem',
                  cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.color = '#9ca3af'; }}
                >{ex}</button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Apps */}
        {recentApps.length > 0 && step === 'idle' && (
          <div style={{ marginTop: '40px', textAlign: 'left' }}>
            <div style={{ color: '#4b5563', fontSize: '0.82rem', marginBottom: '12px', fontWeight: 700 }}>RECENTLY DEPLOYED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentApps.map((app, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px 16px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>"{app.prompt}"</span>
                  <a href={app.url} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>Open </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
