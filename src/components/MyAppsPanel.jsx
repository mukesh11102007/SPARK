import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/SupabaseService';
import { deployProject } from '../services/DeployService';

const StatusBadge = ({ status }) => {
  const map = {
    online: { color: '#10b981', bg: '#064e3b', label: '● Online' },
    down: { color: '#ef4444', bg: '#450a0a', label: '● Down' },
    redeploying: { color: '#f59e0b', bg: '#451a03', label: '⟳ Redeploying' },
    checking: { color: '#6366f1', bg: '#1e1b4b', label: '◌ Checking' },
  };
  const s = map[status] || map.checking;
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: '20px', background: s.bg, color: s.color,
      border: `1px solid ${s.color}40`, letterSpacing: '0.3px'
    }}>{s.label}</span>
  );
};

const timeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const MyAppsPanel = ({ workspaceId, onUpdateApp, identity }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeploying, setRedeploying] = useState({});
  const [deleting, setDeleting] = useState({});
  const [copyId, setCopyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [alertMsg, setAlertMsg] = useState('');

  const fetchApps = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('deployments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setApps(data || []);
    } catch (e) {
      setError('Could not load your deployed apps. Make sure the deployments table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Health check — ping every deployed URL every 2 minutes
  useEffect(() => {
    if (apps.length === 0) return;
    const checkHealth = async () => {
      for (const app of apps) {
        try {
          await fetch(app.deployed_url, { mode: 'no-cors', cache: 'no-store' });
          // no-cors won't throw for online sites
          await supabase.from('deployments').update({ status: 'online' }).eq('id', app.id);
          setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'online' } : a));
        } catch {
          await supabase.from('deployments').update({ status: 'down' }).eq('id', app.id);
          setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'down' } : a));
          setAlertMsg(`️ "${app.app_name}" appears to be down!`);
          setTimeout(() => setAlertMsg(''), 5000);
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 120_000);
    return () => clearInterval(interval);
  }, [apps.length]);

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyId(id);
    setTimeout(() => setCopyId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this app from your dashboard?')) return;
    setDeleting(prev => ({ ...prev, [id]: true }));
    await supabase.from('deployments').delete().eq('id', id);
    setApps(prev => prev.filter(a => a.id !== id));
    setDeleting(prev => ({ ...prev, [id]: false }));
  };

  const handleRedeploy = async (app) => {
    if (!app.files_snapshot || Object.keys(app.files_snapshot).length === 0) {
      alert('No saved file snapshot found for this app. Please rebuild it first.');
      return;
    }
    setRedeploying(prev => ({ ...prev, [app.id]: true }));
    await supabase.from('deployments').update({ status: 'redeploying' }).eq('id', app.id);
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'redeploying' } : a));
    try {
      const result = await deployProject(app.files_snapshot, app.app_name, workspaceId);
      await supabase.from('deployments').update({ status: 'online', deployed_url: result.url }).eq('id', app.id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'online', deployed_url: result.url } : a));
    } catch (e) {
      alert('Re-deploy failed: ' + e.message);
      await supabase.from('deployments').update({ status: 'online' }).eq('id', app.id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'online' } : a));
    } finally {
      setRedeploying(prev => ({ ...prev, [app.id]: false }));
    }
  };

  const filtered = apps.filter(app => {
    const matchSearch = app.app_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || app.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: apps.length,
    online: apps.filter(a => a.status === 'online').length,
    down: apps.filter(a => a.status === 'down').length,
  };

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Alert Banner */}
      {alertMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#450a0a', border: '1px solid #ef4444', borderRadius: '12px',
          padding: '14px 20px', color: '#fca5a5', fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 8px 32px rgba(239,68,68,0.3)', maxWidth: '340px'
        }}>
          {alertMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
           My Deployed Apps
        </h2>
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
          All apps deployed from this workspace. Health is checked every 2 minutes.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Apps', value: stats.total, color: '#6366f1' },
          { label: 'Online', value: stats.online, color: '#10b981' },
          { label: 'Down', value: stats.down, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#111827', border: '1px solid #1f2937', borderRadius: '14px',
            padding: '18px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder=" Search apps..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', background: '#111827', border: '1px solid #374151',
            borderRadius: '10px', padding: '10px 16px', color: '#f8fafc', outline: 'none', fontSize: '0.88rem'
          }}
        />
        {['all', 'online', 'down', 'redeploying'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#6366f1' : '#1f2937',
            color: filter === f ? '#fff' : '#9ca3af', border: 'none',
            borderRadius: '8px', padding: '8px 16px', fontWeight: 700,
            fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize'
          }}>{f}</button>
        ))}
        <button onClick={fetchApps} style={{
          background: '#1f2937', color: '#9ca3af', border: 'none',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.82rem'
        }}>↻ Refresh</button>
      </div>

      {/* App List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⟳</div>
          Loading your deployed apps...
        </div>
      ) : error ? (
        <div style={{
          background: '#450a0a', border: '1px solid #ef4444', borderRadius: '12px',
          padding: '20px', color: '#fca5a5', fontSize: '0.9rem'
        }}>
          <strong>️ Setup Required</strong><br /><br />
          {error}<br /><br />
          Run this SQL in your Supabase Dashboard → SQL Editor:<br />
          <code style={{ display: 'block', marginTop: '10px', background: '#1a0505', padding: '12px', borderRadius: '8px', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
{`CREATE TABLE public.deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  workspace_id TEXT NOT NULL,
  app_name TEXT,
  deployed_url TEXT,
  vercel_project_id TEXT,
  prompt TEXT,
  files_snapshot JSONB,
  status TEXT DEFAULT 'online'
);
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.deployments FOR ALL USING (true) WITH CHECK (true);`}
          </code>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}></div>
          {apps.length === 0
            ? 'No apps deployed yet. Build something and click Deploy!'
            : 'No apps match your search or filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(app => (
            <div key={app.id} style={{
              background: '#111827', border: '1px solid #1f2937', borderRadius: '16px',
              padding: '20px 24px', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#374151'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                {/* Left — App Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.4rem' }}></span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>{app.app_name}</span>
                    <StatusBadge status={redeploying[app.id] ? 'redeploying' : app.status} />
                  </div>
                  <a
                    href={app.deployed_url} target="_blank" rel="noreferrer"
                    style={{ color: '#6366f1', fontSize: '0.82rem', textDecoration: 'none', fontFamily: 'monospace' }}
                  >{app.deployed_url}</a>
                  <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '0.78rem' }}>
                    Deployed {timeAgo(app.created_at)}
                    {app.prompt && <span style={{ marginLeft: '10px', color: '#374151' }}>· "{app.prompt.substring(0, 50)}{app.prompt.length > 50 ? '...' : ''}"</span>}
                  </div>
                </div>

                {/* Right — Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a href={app.deployed_url} target="_blank" rel="noreferrer">
                    <button style={btnStyle('#10b981', '#064e3b')}> Open</button>
                  </a>
                  <button
                    onClick={() => handleCopy(app.id, app.deployed_url)}
                    style={btnStyle('#6366f1', '#1e1b4b')}
                  >{copyId === app.id ? ' Copied!' : ' Copy URL'}</button>
                  {onUpdateApp && (
                    <button
                      onClick={() => onUpdateApp(app)}
                      style={btnStyle('#f59e0b', '#451a03')}
                    >️ Update</button>
                  )}
                  <button
                    onClick={() => handleRedeploy(app)}
                    disabled={redeploying[app.id]}
                    style={btnStyle('#3b82f6', '#1e3a5f', redeploying[app.id])}
                  >{redeploying[app.id] ? '⟳ Deploying...' : ' Re-Deploy'}</button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting[app.id]}
                    style={btnStyle('#ef4444', '#450a0a', deleting[app.id])}
                  >️ Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const btnStyle = (color, bg, disabled = false) => ({
  background: disabled ? '#1f2937' : bg,
  color: disabled ? '#6b7280' : color,
  border: `1px solid ${disabled ? '#374151' : color + '40'}`,
  borderRadius: '8px', padding: '7px 14px', fontWeight: 700,
  fontSize: '0.78rem', cursor: disabled ? 'not-allowed' : 'pointer',
  whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1,
});
