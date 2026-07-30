import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vhajjswtxlrvpnbosdgm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYWpqc3d0eGxydnBuYm9zZGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTYxMTcsImV4cCI6MjEwMDg3MjExN30.aI1yOxOOZtGVyKkZLsokVYY9rJQuqlX7UJM-WcA--kg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Workspace helpers ─────────────────────────────────────────────────────────
export const getOrCreateWorkspaceId = () => {
  const params = new URLSearchParams(window.location.search);
  let wsId = params.get('workspace');
  if (!wsId) {
    wsId = crypto.randomUUID();
    params.set('workspace', wsId);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }
  return wsId;
};

export const getWorkspaceInviteUrl = () => {
  const wsId = getOrCreateWorkspaceId();
  return `${window.location.origin}${window.location.pathname}?workspace=${wsId}`;
};

// ── User identity (stored in localStorage) ────────────────────────────────────
const COLORS = ['#ff7b72','#79c0ff','#d2a8ff','#56d364','#ffa657','#f78166','#58a6ff'];
export const getOrCreateUserIdentity = () => {
  let identity = null;
  try { identity = JSON.parse(localStorage.getItem('spark_identity')); } catch {}
  if (!identity || !identity.name) return null;
  return identity;
};

export const saveUserIdentity = (name) => {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const identity = { name: name.trim(), initials, color, id: crypto.randomUUID() };
  localStorage.setItem('spark_identity', JSON.stringify(identity));
  return identity;
};

// ── Presence tracking (who is online in this workspace) ───────────────────────
let presenceChannel = null;

export const joinWorkspacePresence = (workspaceId, identity, onPresenceChange) => {
  if (presenceChannel) supabase.removeChannel(presenceChannel);

  const getMembersFromState = (channel) => {
    const state = channel.presenceState();
    return Object.values(state).flat().map(p => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      color: p.color,
    }));
  };

  presenceChannel = supabase.channel(`spark-presence-${workspaceId}`, {
    config: { presence: { key: identity.id } },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      onPresenceChange(getMembersFromState(presenceChannel));
    })
    .on('presence', { event: 'join' }, () => {
      onPresenceChange(getMembersFromState(presenceChannel));
    })
    .on('presence', { event: 'leave' }, () => {
      onPresenceChange(getMembersFromState(presenceChannel));
    })
    // Listen for generated code broadcasts in this workspace
    .on('broadcast', { event: 'code_generated' }, ({ payload }) => {
      if (payload?.generatedFiles && window.__sparkOnRemoteCodeGenerated) {
        window.__sparkOnRemoteCodeGenerated(payload.generatedFiles);
      }
    })
    .on('broadcast', { event: 'canvas_update' }, ({ payload }) => {
      if (payload?.nodes && window.__sparkOnRemoteCanvasUpdate) {
        window.__sparkOnRemoteCanvasUpdate(payload.nodes);
      }
    })
    .subscribe(async (status) => {
      console.log('[Supabase Presence] Status:', status);
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          id: identity.id,
          name: identity.name,
          initials: identity.initials,
          color: identity.color,
          online_at: Date.now(),
        });
      }
    });

  return () => {
    if (presenceChannel) supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  };
};

// ── Broadcast generated code to all workspace members ────────────────────────
export const broadcastCodeGenerated = async (workspaceId, generatedFiles) => {
  if (!presenceChannel) return;
  await presenceChannel.send({
    type: 'broadcast',
    event: 'code_generated',
    payload: { generatedFiles, timestamp: Date.now() },
  });
};

// ── Real-time canvas sync ─────────────────────────────────────────────────────
export const broadcastCanvasUpdate = async (workspaceId, nodes) => {
  if (!presenceChannel) return;
  await presenceChannel.send({
    type: 'broadcast',
    event: 'canvas_update',
    payload: { nodes, timestamp: Date.now() },
  });
};

// ── Legacy exports (keep CanvasEditor compatible) ─────────────────────────────
export const subscribeToCanvasUpdates = (onUpdate) => {
  window.__sparkOnRemoteCanvasUpdate = onUpdate;
  return () => { window.__sparkOnRemoteCanvasUpdate = null; };
};

// ── Projects table ────────────────────────────────────────────────────────────
export const saveProject = async ({ projectName, prompt, files }) => {
  const { data, error } = await supabase
    .from('spark_projects')
    .upsert({ project_name: projectName, prompt, files: JSON.stringify(files), updated_at: new Date().toISOString() })
    .select();
  if (error) console.error('[Supabase] saveProject error:', error);
  return data;
};

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('spark_projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) console.error('[Supabase] getProjects error:', error);
  return data || [];
};
