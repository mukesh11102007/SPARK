import React from 'react';

const SidebarIcon = ({ path, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: active ? 'var(--text-main)' : 'var(--text-muted)',
    transition: 'all 0.2s',
    fontSize: '0.85rem',
    fontWeight: active ? 600 : 500
  }}
  onMouseEnter={e => {
    if (!active) {
      e.currentTarget.style.background = 'var(--glass-bg-hover)';
      e.currentTarget.style.color = '#fff';
    }
  }}
  onMouseLeave={e => {
    if (!active) {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--text-muted)';
    }
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
    {label}
  </div>
);

const Card = ({ title, subtitle, icon, color, buttonBg, buttonText, onClick }) => (
  <div onClick={onClick} style={{
    background: 'var(--panel-bg)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--panel-border)',
    display: 'flex',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s',
    minHeight: '160px'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'var(--panel-border-hover)';
    e.currentTarget.style.background = 'var(--panel-elevated)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--panel-border)';
    e.currentTarget.style.background = 'var(--panel-bg)';
  }}>
    <div style={{
      position: 'absolute',
      right: '-10px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '120px',
      height: '120px',
      background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '4.5rem',
      filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
      opacity: 0.9,
      pointerEvents: 'none'
    }}>
      {icon}
    </div>
    <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '65%' }}>
      <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, marginBottom: '24px' }}>{subtitle}</p>
      <div style={{ marginTop: 'auto' }}>
        <button style={{
          background: buttonBg || color,
          color: 'var(--text-main)',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: `0 4px 12px ${buttonBg || color}44`
        }}>
          {buttonText} <span style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
        </button>
      </div>
    </div>
  </div>
);

const WorkspaceCard = ({ title, time, tags, iconColor, iconEmoji, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: 'var(--panel-bg)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--panel-border)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--panel-border-hover)';
      e.currentTarget.style.background = 'var(--panel-elevated)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--panel-border)';
      e.currentTarget.style.background = 'var(--panel-bg)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ 
          width: 34, height: 34, borderRadius: '8px', 
          background: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.1rem'
        }}>{iconEmoji}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '2px' }}>{title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updated {time}</div>
        </div>
      </div>
      <div style={{ color: 'var(--text-muted)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {tags.map(t => (
        <span key={t} style={{ 
          background: 'rgba(255,255,255,0.06)', 
          padding: '4px 10px', 
          borderRadius: '4px', 
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>{t}</span>
      ))}
    </div>
  </div>
);

export const Dashboard = ({ identity, setIdentity, onOpenWorkspace, theme, setTheme, members = [] }) => {
  const [activePage, setActivePage] = React.useState('home');
  const [recentWorkspaces, setRecentWorkspaces] = React.useState([]);
  const [membersTab, setMembersTab] = React.useState('Members');
  const [settingsTab, setSettingsTab] = React.useState('Profile');
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  const [builderPrompt, setBuilderPrompt] = React.useState('');
  const [workspaceOwnerEmail] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOwner = params.get('owner');
    if (urlOwner) {
      localStorage.setItem('spark_workspace_owner', urlOwner);
      return urlOwner;
    }
    const saved = localStorage.getItem('spark_workspace_owner');
    if (saved) return saved;
    const defaultOwner = identity?.email === 'gm233097@gmail.com' ? 'gm233097@gmail.com' : 'gm233097@gmail.com';
    localStorage.setItem('spark_workspace_owner', defaultOwner);
    return defaultOwner;
  });

  const [workspaceFilter, setWorkspaceFilter] = React.useState('All');
  const [templateFilter, setTemplateFilter] = React.useState('All');
  const [teamWorkspaceName, setTeamWorkspaceName] = React.useState(() => localStorage.getItem('spark_team_ws_name') || 'Team Workspace');
  const handleTeamWorkspaceNameChange = (e) => {
    const val = e.target.value;
    setTeamWorkspaceName(val);
    localStorage.setItem('spark_team_ws_name', val);
    import('../services/SupabaseService').then(({ broadcastWorkspaceNameUpdate }) => {
      broadcastWorkspaceNameUpdate(val);
    });
  };
  const [memberRoles, setMemberRoles] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spark_member_roles') || '{}');
    } catch (e) {
      return {};
    }
  });

  React.useEffect(() => {
    window.__sparkOnRemoteRoleUpdate = ({ memberKey, newRole }) => {
      setMemberRoles(prev => {
        const updated = { ...prev, [memberKey]: newRole };
        localStorage.setItem('spark_member_roles', JSON.stringify(updated));
        return updated;
      });
    };
    window.__sparkOnRemoteWorkspaceNameUpdate = ({ newName }) => {
      setTeamWorkspaceName(newName);
      localStorage.setItem('spark_team_ws_name', newName);
    };
  }, []);

  const [dbMembers, setDbMembers] = React.useState([]);
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workspaceId = params.get('workspace');
    if (!workspaceId) return;

    const fetchMembers = async () => {
      const token = localStorage.getItem('spark_token');
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:3001/api/workspace/${workspaceId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setDbMembers(await res.json());
      } catch (e) { console.error('Failed to fetch DB members', e); }
    };
    fetchMembers();
  }, [membersTab]);

  const handleRoleChange = async (memberKey, newRole) => {
    // Optimistic update
    setMemberRoles(prev => {
      const updated = { ...prev, [memberKey]: newRole };
      localStorage.setItem('spark_member_roles', JSON.stringify(updated));
      return updated;
    });

    const params = new URLSearchParams(window.location.search);
    const workspaceId = params.get('workspace');
    if (workspaceId) {
      try {
        const token = localStorage.getItem('spark_token');
        await fetch(`http://localhost:3001/api/workspace/${workspaceId}/member`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ targetUserId: memberKey, role: newRole === 'Viewer' ? 'member' : (newRole === 'Admin' ? 'admin' : 'member') }) // Mapping to backend roles roughly
        });
      } catch (e) { console.error('Failed to update role on backend', e); }
    }

    import('../services/SupabaseService').then(({ broadcastRoleUpdate }) => {
      broadcastRoleUpdate(memberKey, newRole);
    });
  };

  const [profileForm, setProfileForm] = React.useState({
    name: identity?.name || '',
    email: identity?.email || '',
    bio: identity?.bio || 'Full stack developer & AI explorer',
    avatarUrl: identity?.avatarUrl || ''
  });

  React.useEffect(() => {
    if (identity) {
      setProfileForm(prev => ({ ...prev, name: identity.name, email: identity.email, bio: identity.bio || prev.bio, avatarUrl: identity.avatarUrl || prev.avatarUrl }));
    }
  }, [identity]);

  const handleSaveProfile = async () => {
    const updated = { ...identity, ...profileForm };
    if (profileForm.name) {
      updated.initials = profileForm.name.substring(0, 2).toUpperCase();
    }
    
    // Save to backend
    try {
      const token = localStorage.getItem('spark_token');
      if (token) {
        await fetch('http://localhost:3001/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: profileForm.name, bio: profileForm.bio, avatarUrl: profileForm.avatarUrl })
        });
      }
    } catch (e) {
      console.error('Failed to save profile to backend', e);
    }
    
    localStorage.setItem('spark_identity', JSON.stringify(updated));
    localStorage.setItem('spark_user', JSON.stringify(updated));
    if (setIdentity) setIdentity(updated);
  };

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('spark_recent_workspaces');
      if (saved) {
        setRecentWorkspaces(JSON.parse(saved));
      } else {
        // Fallback demo data
        setRecentWorkspaces([
          { id: 'ecommerce', title: 'E-Commerce Dashboard', time: '2h ago', tags: ['Team', 'React'], iconColor: 'linear-gradient(135deg, #9C27B0, #4D3DF7)', iconEmoji: '📊' },
          { id: 'chat', title: 'Chat Application', time: '1d ago', tags: ['Team', 'Node.js'], iconColor: 'linear-gradient(135deg, #F59E0B, #D97706)', iconEmoji: '💬' },
          { id: 'portfolio', title: 'Portfolio Website', time: '3d ago', tags: ['Personal', 'Next.js'], iconColor: 'linear-gradient(135deg, #00C48C, #059669)', iconEmoji: '🎨' }
        ]);
      }
    } catch {
      setRecentWorkspaces([]);
    }
  }, []);

  const renderContent = () => {
    if (activePage === 'home') {
      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              Welcome back, {identity?.name?.split(' ')[0] || 'User'} <span style={{ fontSize: '1.4rem' }}>👋</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>What will we build today?</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
            <Card 
              title="AI Builder" 
              subtitle="Build full-stack apps with natural language" 
              color="#4D3DF7"
              buttonBg="#4D3DF7"
              buttonText="Start Building"
              icon="🧠" 
              onClick={() => setActivePage('ai-builder')}
            />
            <Card 
              title="Templates" 
              subtitle="Start building from pre-coded templates" 
              color="#10B981"
              buttonBg="#10B981"
              buttonText="Explore Templates"
              icon="📦" 
              onClick={() => setActivePage('templates')}
            />
            <Card 
              title="Deploy" 
              subtitle="One-click deployment to the cloud" 
              color="#9C27B0"
              buttonBg="#4D3DF7"
              buttonText="Deploy Now"
              icon="🚀" 
              onClick={() => setActivePage('deployments')}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Recent Workspaces</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setActivePage('workspaces')}>View all</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {recentWorkspaces.map(ws => (
                <WorkspaceCard 
                  key={ws.id}
                  title={ws.title} 
                  time={ws.time || 'just now'} 
                  tags={ws.tags || []} 
                  iconColor={ws.iconColor || 'linear-gradient(135deg, #9C27B0, #4D3DF7)'}
                  iconEmoji={ws.iconEmoji || '💻'}
                  onClick={() => onOpenWorkspace(ws.id)} 
                />
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (activePage === 'templates') {
      if (selectedTemplate) {
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
            <button onClick={() => setSelectedTemplate(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, marginBottom: '24px', fontSize: '0.9rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to templates
            </button>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: '300px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                  {selectedTemplate.icon}
                </div>
              </div>
              <div style={{ width: '350px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-main)' }}>{selectedTemplate.title}</h1>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>{selectedTemplate.desc}</p>
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>Technologies</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '16px', color: 'var(--text-main)' }}>{selectedTemplate.tech}</span>
                  </div>
                </div>
                <button className="ide-btn" onClick={() => onOpenWorkspace('new', { template: selectedTemplate.title })} style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                  Use Template
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Project Templates</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Start with a template</p>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--panel-border)', marginBottom: '24px' }}>
            {['All', 'Web Apps', 'Dashboards', 'Mobile', 'Other'].map((tab) => (
              <div 
                key={tab} 
                onClick={() => setTemplateFilter(tab)} 
                style={{ 
                  paddingBottom: '12px', 
                  fontSize: '0.85rem', 
                  fontWeight: templateFilter === tab ? 600 : 500, 
                  color: templateFilter === tab ? 'var(--text-main)' : 'var(--text-muted)', 
                  borderBottom: templateFilter === tab ? '2px solid var(--text-main)' : '2px solid transparent', 
                  cursor: 'pointer' 
                }}
              >
                {tab}
              </div>
            ))}
          </div>
          
          {(() => {
            const allTemplates = [
              { title: 'Admin Dashboard', desc: 'Modern admin dashboard with analytics', icon: '📊', tech: 'Next.js', category: 'Dashboards' },
              { title: 'Blog Platform', desc: 'Full featured blog platform with markdown', icon: '✍️', tech: 'MERN Stack', category: 'Web Apps' },
              { title: 'E-Commerce Store', desc: 'Online store with cart and payment integration', icon: '🛍️', tech: 'Next.js', category: 'Web Apps' },
              { title: 'Portfolio Template', desc: 'Personal portfolio template for developers', icon: '👨‍💻', tech: 'React', category: 'Other' }
            ];

            const filteredTemplates = allTemplates.filter(t => {
              if (templateFilter === 'All') return true;
              if (templateFilter === 'Web Apps') return t.category === 'Web Apps';
              if (templateFilter === 'Dashboards') return t.category === 'Dashboards';
              if (templateFilter === 'Mobile') return t.category === 'Web Apps' || t.tech === 'React';
              if (templateFilter === 'Other') return t.category === 'Other';
              return true;
            });

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {filteredTemplates.map(t => (
                  <div 
                    key={t.title} 
                    style={{ display: 'flex', padding: '20px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', gap: '16px', cursor: 'pointer' }} 
                    onClick={() => setSelectedTemplate(t)}
                  >
                     <div style={{ width: 48, height: 48, borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{t.icon}</div>
                     <div style={{ flex: 1 }}>
                       <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-main)' }}>{t.title}</h3>
                       <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</p>
                       <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{t.tech}</span>
                     </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    }

    if (activePage === 'deployments') {
      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Deployment</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Deploy your app in one click</p>
          </div>

          <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', padding: '24px', marginBottom: '32px', display: 'flex', gap: '24px' }}>
            <div style={{ width: '180px', height: '120px', background: 'var(--panel-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🌐</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '24px' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--text-main)' }}>Select a workspace to deploy</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Choose an existing project to deploy to Vercel instantly.
                  </div>
                  <select style={{ width: '100%', maxWidth: '300px', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', marginBottom: '16px', appearance: 'none' }}>
                    <option value="">-- Select Workspace --</option>
                    {recentWorkspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="ide-btn" style={{ padding: '8px 24px', margin: 0, width: 'auto' }} onClick={() => alert('Deployment started!')}>Deploy to Vercel</button>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Deployments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentWorkspaces.length > 0 ? recentWorkspaces.map(ws => (
              <div key={ws.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--panel-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{ws.title.toLowerCase().replace(/\s+/g, '-')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ws.time || 'just now'}</span>
                  <span style={{ fontSize: '0.7rem', padding: '4px 12px', background: `rgba(34,197,94,0.1)`, color: '#22c55e', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div> Live
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No deployments yet. Build something amazing!</div>
            )}
          </div>
        </div>
      );
    }

    if (activePage === 'members') {
      const handleInvite = () => {
        import('../services/SupabaseService').then(({ getWorkspaceInviteUrl }) => {
          const url = getWorkspaceInviteUrl();
          navigator.clipboard.writeText(url).then(() => {
            alert('Invite link copied to clipboard!');
          }).catch(() => {
            prompt('Copy this invite link:', url);
          });
        });
      };

      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'linear-gradient(135deg, #3B82F6, #1E40AF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👥</div>
                {teamWorkspaceName}
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Collaborate with your team</p>
            </div>
            <button onClick={handleInvite} className="ide-btn" style={{ padding: '8px 16px', margin: 0, width: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Invite Member
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--panel-border)', marginBottom: '24px' }}>
            {['Members', 'Activity', 'Settings'].map((tab) => (
              <div key={tab} onClick={() => setMembersTab(tab)} style={{ paddingBottom: '12px', fontSize: '0.85rem', fontWeight: membersTab===tab?600:500, color: membersTab===tab?'var(--text-main)':'var(--text-muted)', borderBottom: membersTab===tab?'2px solid var(--text-main)':'2px solid transparent', cursor: 'pointer' }}>{tab}</div>
            ))}
          </div>

          {membersTab === 'Members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {(() => {
                const actualOwnerEmail = workspaceOwnerEmail || identity?.email;
                const amIOwner = identity?.email === actualOwnerEmail;

                // Ensure the current user is ALWAYS in the list, even if presence hasn't synced yet
                const memberList = members.length > 0 ? [...members] : [];
                if (!memberList.some(m => m.email === identity?.email)) {
                  memberList.push(identity);
                }

                // Add persistent database members
                dbMembers.forEach(dbm => {
                  if (!memberList.some(m => m.email === dbm.email)) {
                    memberList.push({
                      id: dbm.id,
                      name: dbm.name,
                      email: dbm.email,
                      avatarUrl: dbm.avatarUrl,
                      initials: dbm.name ? dbm.name.substring(0, 2).toUpperCase() : 'U'
                    });
                  }
                  // Prefill role if it came from DB and is not owner
                  if (dbm.role === 'admin' && !memberRoles[dbm.id] && !memberRoles[dbm.email]) {
                    memberRoles[dbm.id] = 'Admin';
                  } else if (dbm.role === 'member' && !memberRoles[dbm.id] && !memberRoles[dbm.email]) {
                    memberRoles[dbm.id] = 'Viewer';
                  }
                });

                // Deduplicate by email just in case
                const uniqueMembers = [];
                const seenEmails = new Set();
                memberList.forEach(m => {
                  if (m.email && !seenEmails.has(m.email)) {
                    seenEmails.add(m.email);
                    uniqueMembers.push(m);
                  }
                });

                return uniqueMembers.map((m, i) => {
                  const isOwnerUser = m.isCreator || (m.email && m.email === actualOwnerEmail) || (dbMembers.find(d => d.email === m.email)?.role === 'owner');
                  const isYou = identity?.email === m.email || (identity?.name && identity.name === m.name);
                  const memberKey = m.id || m.email || `mem-${i}`;
                  const currentRole = isOwnerUser ? 'Owner' : (memberRoles[memberKey] || 'Editor');

                  return (
                    <div key={memberKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--panel-bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.color || '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{m.initials || 'U'}</div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {m.name} 
                            {isYou && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>You</span>}
                            {isOwnerUser && <span style={{ fontSize: '0.65rem', background: 'rgba(77,61,247,0.2)', color: '#818cf8', border: '1px solid rgba(77,61,247,0.4)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Owner (Link Creator)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email || 'Online'}</div>
                        </div>
                      </div>
                      <div>
                        {isOwnerUser ? (
                          <span style={{ fontSize: '0.8rem', color: '#4D3DF7', fontWeight: 600, background: 'rgba(77,61,247,0.1)', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(77,61,247,0.2)' }}>
                            👑 Workspace Owner
                          </span>
                        ) : amIOwner ? (
                          <select
                            value={currentRole}
                            onChange={(e) => handleRoleChange(memberKey, e.target.value)}
                            style={{
                              background: 'var(--panel-elevated)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--panel-border)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Editor">✏️ Editor (Can edit code)</option>
                            <option value="Viewer">👁️ Viewer (Read only)</option>
                            <option value="Admin">⚡ Admin (Full control)</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: currentRole === 'Viewer' ? '#f59e0b' : '#10b981', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '6px' }}>
                            {currentRole === 'Viewer' ? '👁️ Viewer (Read only)' : '✏️ Editor (Can edit code)'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {membersTab === 'Activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Activity Feed</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>J</div>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>John Doe</strong> updated <span style={{ color: 'var(--accent)' }}>Navbar.jsx</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>2m ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>J</div>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>Jane Smith</strong> deployed <span style={{ color: 'var(--accent)' }}>ecommerce-dashboard</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>10m ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>A</div>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>Alex Johnson</strong> commented on <span style={{ color: 'var(--accent)' }}>Hero.jsx</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>1h ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {identity?.avatarUrl ? (
                    <img src={identity.avatarUrl} alt="You" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: identity?.color || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{identity?.initials || 'U'}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>{identity?.name || 'You'}</strong> created a new workspace</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>2h ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {membersTab === 'Settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--panel-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 8px' }}>Workspace Settings</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Manage your team workspace preferences.</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Workspace Name</label>
                <input type="text" value={teamWorkspaceName} onChange={handleTeamWorkspaceNameChange} style={{ width: '100%', maxWidth: '400px', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '24px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444', margin: '0 0 8px' }}>Danger Zone</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>Permanently delete this workspace and all its data.</p>
                <button style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Delete Workspace</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activePage === 'settings') {
      return (
        <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
          {/* Settings Sidebar */}
          <div style={{ width: '200px', borderRight: '1px solid var(--panel-border)', padding: '24px 0', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', padding: '0 24px', marginBottom: '16px' }}>Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['Profile', 'Account', 'Preferences', 'Appearance', 'API Keys', 'Security'].map((item) => (
                <div key={item} onClick={() => setSettingsTab(item)} style={{ padding: '10px 24px', fontSize: '0.85rem', color: settingsTab===item?'var(--text-main)':'var(--text-muted)', background: settingsTab===item?'rgba(255,255,255,0.05)':'transparent', cursor: 'pointer', borderRight: settingsTab===item?'2px solid var(--text-main)':'2px solid transparent' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          {/* Settings Content */}
          <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-main)' }}>{settingsTab}</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Update your {settingsTab.toLowerCase()} information</p>
            </div>
            
            {settingsTab === 'Profile' && (
              <div style={{ display: 'flex', gap: '64px' }}>
                <div style={{ flex: 1, maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm(prev => ({...prev, name: e.target.value}))} style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm(prev => ({...prev, email: e.target.value}))} style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Bio</label>
                    <input type="text" value={profileForm.bio} onChange={e => setProfileForm(prev => ({...prev, bio: e.target.value}))} style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
                  </div>
                  <div style={{ paddingTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Profile Avatar</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm(prev => ({ ...prev, avatarUrl: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ paddingTop: '16px' }}>
                    <button className="ide-btn" onClick={handleSaveProfile} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      Save Changes
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '24px' }}>
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Avatar Preview" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--panel-border)' }} />
                  ) : (
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: identity?.color || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#fff', fontWeight: 600 }}>
                      {profileForm.name ? profileForm.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {settingsTab === 'Account' && (
              <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>Change Password</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="password" placeholder="Current Password" style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
                    <input type="password" placeholder="New Password" style={{ width: '100%', background: 'var(--panel-elevated)', border: '1px solid var(--panel-border)', padding: '10px 12px', borderRadius: '6px', color: 'var(--text-main)', outline: 'none' }} />
                    <button className="ide-btn" style={{ padding: '8px 16px', width: 'fit-content', marginTop: '8px' }}>Update Password</button>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>Connected Accounts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>GitHub</span>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Connect</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Google</span>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Connect</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'Preferences' && (
              <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--panel-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>Email Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive email alerts for deployments and team mentions.</div>
                  </div>
                  <div style={{ width: '36px', height: '20px', background: 'var(--accent)', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--panel-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>Weekly Summary</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive a weekly digest of your workspace activity.</div>
                  </div>
                  <div style={{ width: '36px', height: '20px', background: 'var(--accent)', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'Appearance' && (
              <div style={{ maxWidth: '500px' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>Theme</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div onClick={() => setTheme && setTheme('antigravity')} style={{ flex: 1, padding: '16px', background: 'var(--panel-bg)', border: `2px solid ${theme === 'antigravity' ? 'var(--accent)' : 'var(--panel-border)'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '60px', background: '#000', borderRadius: '4px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>Dark Mode</span>
                  </div>
                  <div onClick={() => setTheme && setTheme('light')} style={{ flex: 1, padding: '16px', background: 'var(--panel-bg)', border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--panel-border)'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '60px', background: '#fff', borderRadius: '4px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>Light Mode</span>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'API Keys' && (
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Manage your personal access tokens.</p>
                  <button className="ide-btn" style={{ padding: '6px 16px', fontSize: '0.8rem', width: 'auto' }}>Generate New Key</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', background: 'var(--panel-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>Production API Key</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>sk_live_**********************a8f9</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created 2 months ago</div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--panel-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>Development API Key</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>sk_test_**********************3b21</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created yesterday</div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'Security' && (
              <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>Two-Factor Authentication</h3>
                  <div style={{ padding: '16px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>Authenticator App</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not configured</div>
                    </div>
                    <button style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Enable</button>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>Active Sessions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', background: 'var(--panel-bg)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>Mac OS • Chrome</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>San Francisco, CA • Current Session</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activePage === 'ai-builder') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0f', padding: '40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'linear-gradient(135deg, #4D3DF7, #7B1FA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧠</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', margin: 0 }}>AI Builder</h1>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: '0 0 40px 56px' }}>Describe your idea and let AI build it for you</p>
            
            <div style={{ position: 'relative', display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1, zIndex: 10 }}>
                <div style={{ background: '#13131a', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <textarea 
                    value={builderPrompt}
                    onChange={e => setBuilderPrompt(e.target.value)}
                    placeholder="build a attractive dashboard that shows all the data of the food sales in the chart and graph..."
                    style={{ width: '100%', height: '120px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', resize: 'none', outline: 'none', lineHeight: '1.5' }}
                  ></textarea>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button 
                      onClick={() => onOpenWorkspace('new', { initialPrompt: builderPrompt || 'Food Sales Dashboard with Charts' })}
                      style={{ background: '#4D3DF7', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>✨</span> Build with AI
                    </button>
                    <button 
                      onClick={() => setBuilderPrompt('')}
                      style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', padding: '10px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21v-5h5"></path></svg>
                      Clear
                    </button>
                  </div>
                </div>
                
                <h3 style={{ fontSize: '0.9rem', color: '#a1a1aa', margin: '0 0 16px', fontWeight: 500 }}>Suggestions</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['Blog with admin panel', 'Fitness tracker app', 'CRM dashboard', 'Landing page'].map(s => (
                    <div 
                      key={s} 
                      onClick={() => { setBuilderPrompt(s); onOpenWorkspace('new', { initialPrompt: s }); }}
                      style={{ background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ width: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(77,61,247,0.2) 0%, rgba(0,0,0,0) 70%)', position: 'absolute', top: '-50px', right: '0', zIndex: 1 }}></div>
                <div style={{ fontSize: '10rem', filter: 'drop-shadow(0 0 30px rgba(77,61,247,0.6))', zIndex: 2 }}>🧠</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 'canvas') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0f', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ height: '60px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', background: '#13131a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '6px', background: 'linear-gradient(135deg, #00C48C, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎨</div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', margin: 0 }}>Canvas</h1>
              <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '8px' }}>Drag components and build visually</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => onOpenWorkspace('new', { template: 'Visual Prototyping Design', activity: 'canvas' })}
                style={{ background: 'transparent', color: '#fff', border: '1px solid #27272a', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Open in Workspace
              </button>
              <button 
                onClick={() => onOpenWorkspace('new', { template: 'Visual Prototyping Design', activity: 'preview' })}
                style={{ background: '#4D3DF7', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Live Preview & Build
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex' }}>
            {/* Sidebar */}
            <div style={{ width: '240px', borderRight: '1px solid #27272a', background: '#13131a', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Components</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                {[{icon:'Layout', name:'Navbar'}, {icon:'Square', name:'Hero'}, {icon:'CreditCard', name:'Card'}, {icon:'MousePointer', name:'Button'}, {icon:'Type', name:'Text'}, {icon:'Image', name:'Image'}].map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'transparent', borderRadius: '6px', cursor: 'grab', color: '#a1a1aa', border: '1px solid transparent' }}>
                    <div style={{ width: '16px', height: '16px', border: '1px solid #a1a1aa', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Canvas Area */}
            <div style={{ flex: 1, background: '#0a0a0f', position: 'relative', overflow: 'auto', padding: '40px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5, zIndex: 0 }}></div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
                
                <div style={{ background: '#4D3DF7', padding: '24px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                  Navbar
                </div>
                
                <div style={{ background: '#2563EB', padding: '60px 24px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                  Hero Section
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ flex: 1, background: '#059669', padding: '40px 24px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div style={{ width: '16px', height: '16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                      Card
                    </div>
                  ))}
                </div>
                
                <div style={{ background: '#4D3DF7', padding: '24px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                  Footer
                </div>

              </div>
            </div>
            
            {/* Properties Panel */}
            <div style={{ width: '280px', borderLeft: '1px solid #27272a', background: '#13131a', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Card</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #27272a' }}>
                <div style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: '#4D3DF7', borderBottom: '2px solid #4D3DF7', cursor: 'pointer' }}>Properties</div>
                <div style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: '#a1a1aa', borderBottom: '2px solid transparent', cursor: 'pointer' }}>Styles</div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '8px' }}>Title</label>
                  <input type="text" defaultValue="Card Title" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '8px' }}>Content</label>
                  <textarea defaultValue="This is a card" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'none', height: '60px' }}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '8px' }}>Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" defaultValue="#4D3DF7" style={{ flex: 1, background: '#0a0a0f', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                    <div style={{ width: '36px', height: '36px', background: '#4D3DF7', borderRadius: '6px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 'workspaces') {
      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 60px 60px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📁</div>
              Your Workspaces
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Manage all your personal and team projects</p>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--panel-border)', marginBottom: '24px' }}>
            {['All', 'Personal', 'Team', 'Archived'].map((tab) => (
              <div 
                key={tab} 
                onClick={() => setWorkspaceFilter(tab)}
                style={{ 
                  paddingBottom: '12px', 
                  fontSize: '0.85rem', 
                  fontWeight: workspaceFilter === tab ? 600 : 500, 
                  color: workspaceFilter === tab ? 'var(--text-main)' : 'var(--text-muted)', 
                  borderBottom: workspaceFilter === tab ? '2px solid var(--text-main)' : '2px solid transparent', 
                  cursor: 'pointer' 
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {(() => {
            const filteredWorkspaces = recentWorkspaces.filter(ws => {
              if (workspaceFilter === 'All') return true;
              if (workspaceFilter === 'Personal') return ws.tags?.includes('Personal') || !ws.tags?.includes('Team');
              if (workspaceFilter === 'Team') return ws.tags?.includes('Team');
              if (workspaceFilter === 'Archived') return ws.isArchived;
              return true;
            });

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {filteredWorkspaces.map(ws => (
                    <WorkspaceCard 
                      key={ws.id}
                      title={ws.title} 
                      time={ws.time || 'just now'} 
                      tags={ws.tags || []} 
                      iconColor={ws.iconColor || 'linear-gradient(135deg, #9C27B0, #4D3DF7)'}
                      iconEmoji={ws.iconEmoji || '💻'}
                      onClick={() => onOpenWorkspace(ws.id)} 
                    />
                  ))}
                </div>
                {filteredWorkspaces.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px dashed var(--panel-border)', color: 'var(--text-muted)' }}>
                    No {workspaceFilter.toLowerCase()} workspaces found.
                  </div>
                )}
              </>
            );
          })()}
          
          {recentWorkspaces.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px dashed var(--panel-border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>No Workspaces Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Create a new workspace or start from a template.</p>
              <button className="ide-btn" onClick={() => onOpenWorkspace('new')} style={{ padding: '10px 24px', width: 'auto' }}>Create New Workspace</button>
            </div>
          )}
        </div>
      );
    }

    // Default Fallback
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '60px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', textTransform: 'capitalize' }}>{activePage}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', marginBottom: '40px' }}>
          This page is currently under construction.
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--app-bg)', color: 'var(--text-main)', fontFamily: 'var(--font-ui)' }}>
      {/* Sidebar Navigation */}
      <div style={{ 
        width: '260px', 
        borderRight: '1px solid var(--panel-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 24px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>Spark Studio</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
          <SidebarIcon active={activePage === 'home'} label="Home" path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" onClick={() => setActivePage('home')} />
          <SidebarIcon active={activePage === 'workspaces'} label="Workspaces" path="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" onClick={() => setActivePage('workspaces')} />
          <SidebarIcon active={activePage === 'templates'} label="Templates" path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" onClick={() => setActivePage('templates')} />
          <SidebarIcon active={activePage === 'deployments'} label="Deployments" path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" onClick={() => setActivePage('deployments')} />
          <SidebarIcon active={activePage === 'members'} label="Members" path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" onClick={() => setActivePage('members')} />
          <SidebarIcon active={activePage === 'settings'} label="Settings" path="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" onClick={() => setActivePage('settings')} />
        </div>
        
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <button className="ide-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => onOpenWorkspace('new')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Workspace
          </button>
        </div>

        <div style={{ flex: 1 }} />
        
        {/* Upgrade to Pro Card */}
        <div style={{ 
          margin: '0 16px 20px', 
          padding: '16px', 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          borderRadius: '12px',
          border: '1px solid var(--panel-border)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>Upgrade to Pro</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            Unlock unlimited AI builds, private deployments and more.
          </div>
          <button style={{
            background: 'var(--panel-border-hover)',
            color: 'var(--text-main)',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-border-hover)'}>Upgrade Now</button>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {identity?.avatarUrl ? (
            <img src={identity.avatarUrl} alt="User" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ 
              width: 32, height: 32, borderRadius: '50%', background: identity?.color || 'var(--accent)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem'
            }}>
              {identity?.initials || 'U'}
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{identity?.name || 'User'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{identity?.email || 'user@example.com'}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        
        <div style={{ padding: '0 24px 24px' }}>
          <button 
            style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--panel-border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--panel-border)'; }}
            onClick={() => {
              localStorage.removeItem('spark_token');
              localStorage.removeItem('spark_identity');
              localStorage.removeItem('spark_user');
              setIdentity(null);
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 60px 12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <svg style={{ position: 'absolute', left: 12, top: 9, color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search anything..." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', padding: '8px 12px 8px 36px', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }} />
            <div style={{ position: 'absolute', right: 12, top: 8, fontSize: '0.65rem', color: 'var(--text-muted)', border: '1px solid var(--panel-border)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)' }}>⌘K</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <svg onClick={() => setTheme && setTheme(theme === 'light' ? 'antigravity' : 'light')} style={{ cursor: 'pointer' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg style={{ cursor: 'pointer' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {identity?.avatarUrl ? (
              <img src={identity.avatarUrl} alt="User" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#fff' }}>
                {identity?.initials || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

      </div>
    </div>
  );
};

