import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, addEdge,
  Background, BackgroundVariant, Controls, Handle, Position, MiniMap,
  getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { subscribeToCanvasUpdates, broadcastCanvasUpdate } from '../services/SupabaseService';

const initialEdges = [];

// ── Custom n8n-style Node ─────────────────────────────────────────────────────
const CustomNode = ({ data, id, selected }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [copied, setCopied] = useState(false);

  const commitRename = () => {
    setEditing(false);
    if (data.onRename) data.onRename(id, label);
  };

  const handleCopy = () => {
    if (data.code) {
      navigator.clipboard.writeText(data.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // derive file type tag
  const ext = data.label?.split('.').pop() || 'jsx';
  const typeColors = { jsx: '#10b981', tsx: '#6366f1', js: '#f59e0b', ts: '#3b82f6', css: '#ec4899' };
  const tagColor = typeColors[ext] || '#10b981';

  return (
    <div style={{
      position: 'relative',
      minWidth: '210px',
      maxWidth: '260px',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: '#ffffff',
        border: selected ? '2px solid #10b981' : '1.5px solid #10b981',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 4px rgba(16,185,129,0.15), 0 8px 24px rgba(0,0,0,0.1)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        overflow: 'hidden',
        cursor: 'grab',
      }}>
        {/* ✓ checked badge top-right like n8n */}
        <div style={{
          position: 'absolute', top: -1, right: 10,
          background: '#10b981', borderRadius: '0 0 6px 6px',
          width: 22, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff', fontWeight: 700,
          zIndex: 2,
        }}>✓</div>

      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚛️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => e.key === 'Enter' && commitRename()}
              style={{
                border: '1px solid #10b981', borderRadius: 4,
                padding: '2px 6px', fontSize: '0.82rem', width: '100%',
                outline: 'none', background: '#f0fdf4', color: '#064e3b'
              }}
            />
          ) : (
            <div
              style={{
                fontWeight: 600, fontSize: '0.85rem', color: '#111827',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                cursor: 'text',
              }}
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
            >
              {data.label}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {data.code && (
            <button
              onClick={handleCopy}
              title="Copy code"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied ? '#10b981' : '#9ca3af', fontSize: 13,
                padding: '2px 3px', lineHeight: 1, transition: 'color 0.15s',
              }}
            >
              {copied ? '✓' : '⧉'}
            </button>
          )}
          <button
            onClick={() => data.onDelete && data.onDelete(id)}
            title="Delete"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#d1d5db', fontSize: 16, padding: '2px 3px', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
          >×</button>
        </div>
      </div>

      {/* Footer info bar */}
      <div style={{
        borderTop: '1px solid #f0fdf4',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#f9fafb',
      }}>
        <span style={{
          background: tagColor, color: '#fff', fontSize: '0.65rem',
          fontWeight: 700, padding: '1px 6px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>.{ext}</span>
        <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>React Component</span>
      </div>
      </div>

      {/* Target Handle (Left side) */}
      <Handle type="target" position={Position.Left}
        style={{
          background: '#10b981', width: 14, height: 14, left: -7,
          border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          top: '50%', cursor: 'crosshair', transition: 'transform 0.15s',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
      
      {/* Source Handle (Right side) */}
      <Handle type="source" position={Position.Right}
        style={{
          background: '#6366f1', width: 14, height: 14, right: -7,
          border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          top: '50%', cursor: 'crosshair', transition: 'transform 0.15s',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
    </div>
  );
};

const nodeTypes = { customNode: CustomNode };

export const CanvasEditor = ({ newGeneratedFiles, manualFile, theme = 'light', onFileDelete, isActive = true, readOnly = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleDeleteNode = useCallback((nodeId) => {
    if (readOnly) return;
    setNodes(nds => {
      const nodeToDelete = nds.find(n => n.id === nodeId);
      if (nodeToDelete && onFileDelete) {
        onFileDelete(nodeToDelete.data.label);
      }
      return nds.filter(n => n.id !== nodeId);
    });
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges, onFileDelete, readOnly]);

  const handleRenameNode = useCallback((nodeId, newLabel) => {
    if (readOnly) return;
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
    ));
  }, [setNodes, readOnly]);

  const makeNodeData = useCallback((base) => ({
    ...base,
    onDelete: handleDeleteNode,
    onRename: handleRenameNode,
  }), [handleDeleteNode, handleRenameNode]);

  // Supabase realtime canvas sync
  useEffect(() => {
    const unsub = subscribeToCanvasUpdates((payload) => {
      if (payload.nodes) {
        setNodes(payload.nodes.map(n => ({
          ...n,
          data: makeNodeData({ label: n.data?.label || 'Component', code: n.data?.code }),
        })));
      }
      if (payload.edges) {
        setEdges(payload.edges);
      }
    });
    return unsub;
  }, [makeNodeData]);

  // Manual file additions
  useEffect(() => {
    if (!manualFile) return;
    setNodes(nds => [...nds, {
      id: `manual-${manualFile.timestamp}`,
      position: { x: 120 + Math.random() * 200, y: 120 + Math.random() * 150 },
      type: 'customNode',
      data: makeNodeData({ label: manualFile.name }),
    }]);
  }, [manualFile]);

  // AI-generated files → nodes
  useEffect(() => {
    if (!newGeneratedFiles) return;
    const entries = Object.entries(newGeneratedFiles);
    
    setNodes(nds => {
      const existingNodes = new Map(nds.map(n => [n.id, n]));
      const updatedNodes = [];
      const cols = Math.min(Math.max(entries.length, 1), 2);

      entries.forEach(([filename, code], index) => {
        const id = `gen-${filename}`;
        if (existingNodes.has(id)) {
          const existing = existingNodes.get(id);
          updatedNodes.push({
            ...existing,
            data: makeNodeData({ label: filename, code })
          });
        } else {
          updatedNodes.push({
            id,
            position: { x: 80 + (index % cols) * 300, y: 80 + Math.floor(index / cols) * 180 },
            type: 'customNode',
            data: makeNodeData({ label: filename, code }),
          });
        }
      });

      const manualNodes = nds.filter(n => !n.id.startsWith('gen-'));
      const finalNodes = [...manualNodes, ...updatedNodes];

      // Auto-chain edges ONLY if we generated a fresh batch and the canvas was empty
      if (updatedNodes.length > 1 && nds.length === 0) {
        const deletedIds = JSON.parse(localStorage.getItem('spark_deleted_edges') || '[]');
        const chainEdges = updatedNodes.slice(0, -1).map((n, i) => ({
          id: `chain-${i}`,
          source: n.id,
          target: updatedNodes[i + 1].id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#d1d5db', strokeWidth: 2 },
        })).filter(e => !deletedIds.includes(e.id));

        if (chainEdges.length > 0) {
          setTimeout(() => setEdges(eds => [...eds, ...chainEdges]), 0);
        }
      }

      return finalNodes;
    });
  }, [newGeneratedFiles, makeNodeData, setEdges]);

  const recordDeletedEdges = (deletedEdgesList) => {
    try {
      const existing = JSON.parse(localStorage.getItem('spark_deleted_edges') || '[]');
      const updated = Array.from(new Set([...existing, ...deletedEdgesList.map(e => e.id)]));
      localStorage.setItem('spark_deleted_edges', JSON.stringify(updated));
    } catch(err) { console.error('Failed to save deleted edges', err); }
  };

  const onConnect = useCallback((params) => {
    setEdges(eds => {
      const newEdges = addEdge({
        ...params,
        type: 'smoothstep',
        style: { stroke: '#d1d5db', strokeWidth: 2 },
      }, eds);
      broadcastCanvasUpdate(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes]);

  const onNodesDelete = useCallback((deleted) => {
    setNodes(nds => {
      deleted.forEach(d => {
        if (onFileDelete) onFileDelete(d.data.label);
      });
      const remainingNodes = nds.filter(n => !deleted.find(d => d.id === n.id));
      broadcastCanvasUpdate(remainingNodes, edges);
      return remainingNodes;
    });
  }, [nodes, edges, setNodes, onFileDelete]);

  const onEdgesDelete = useCallback((deleted) => {
    recordDeletedEdges(deleted);
    setEdges(eds => {
      const remainingEdges = eds.filter(e => !deleted.find(d => d.id === e.id));
      broadcastCanvasUpdate(nodes, remainingEdges);
      return remainingEdges;
    });
  }, [nodes, edges, setEdges]);

  const isDark = theme === 'antigravity' || theme === 'dark';

  return (
    <div style={{ width: '100%', height: '100%', flex: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onEdgeDoubleClick={(_, edge) => {
          recordDeletedEdges([edge]);
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
          const remainingEdges = edges.filter((e) => e.id !== edge.id);
          broadcastCanvasUpdate(nodes, remainingEdges);
        }}
        onConnect={onConnect}
        onNodeDragStop={(_, __, allNodes) => !readOnly && broadcastCanvasUpdate(allNodes, edges)}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        colorMode={isDark ? 'dark' : 'light'}
        style={{
          background: isDark ? '#0d0d12' : '#ffffff',
          width: '100%',
          height: '100%',
        }}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.8}
          color={isDark ? '#2a2a3e' : '#c8cdd6'}
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={() => '#10b981'}
          nodeStrokeWidth={2}
          style={{
            background: isDark ? '#12121a' : '#f8fafc',
            border: `1px solid ${isDark ? '#2a2a3e' : '#e2e8f0'}`,
            borderRadius: 8,
          }}
          maskColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'}
        />
      </ReactFlow>
    </div>
  );
};
