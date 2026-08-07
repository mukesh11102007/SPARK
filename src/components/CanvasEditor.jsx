import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, addEdge,
  Background, BackgroundVariant, Controls, Handle, Position, MiniMap,
  getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { subscribeToCanvasUpdates, broadcastCanvasUpdate } from '../services/SupabaseService';
import { MonacoEditorPanel } from './MonacoEditorPanel';

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
        background: 'var(--panel-elevated, #ffffff)',
        border: selected ? '2px solid #10b981' : '1.5px solid var(--panel-border, #10b981)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 4px rgba(16,185,129,0.25), 0 8px 24px rgba(0,0,0,0.2)'
          : '0 4px 12px rgba(0,0,0,0.15)',
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
          fontSize: 11, color: '#ffffff', fontWeight: 700,
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
                outline: 'none', background: 'var(--app-bg)', color: 'var(--text-main)'
              }}
            />
          ) : (
            <div
              style={{
                fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)',
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
            <>
              <button
                onClick={() => data.onEdit && data.onEdit(id, data.label, data.code)}
                title="Edit code"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 13, fontWeight: 'bold',
                  padding: '2px 3px', lineHeight: 1, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                &lt;/&gt;
              </button>
              <button
                onClick={handleCopy}
                title="Copy code"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: copied ? '#10b981' : 'var(--text-muted)', fontSize: 13,
                  padding: '2px 3px', lineHeight: 1, transition: 'color 0.15s',
                }}
              >
                {copied ? '✓' : '⧉'}
              </button>
            </>
          )}
          <button
            onClick={() => data.onDelete && data.onDelete(id)}
            title="Delete"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: '2px 3px', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >×</button>
        </div>
      </div>

      {/* Footer info bar */}
      <div style={{
        borderTop: '1px solid var(--panel-border)',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--app-bg)',
      }}>
        <span style={{
          background: tagColor, color: '#fff', fontSize: '0.65rem',
          fontWeight: 700, padding: '1px 6px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>.{ext}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>React Component</span>
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

export const CanvasEditor = ({ newGeneratedFiles, manualFile, theme = 'light', onFileDelete, onFileUpdate, isActive = true, readOnly = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [editingFile, setEditingFile] = useState(null);

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

  const handleEditCode = useCallback((nodeId, label, code) => {
    if (readOnly) return;
    setEditingFile({ nodeId, label, code });
  }, [readOnly]);

  const handleSaveCode = useCallback((newCode) => {
    if (!editingFile || readOnly) return;
    setNodes(nds => nds.map(n =>
      n.id === editingFile.nodeId ? { ...n, data: { ...n.data, code: newCode } } : n
    ));
    if (onFileUpdate) {
      onFileUpdate(editingFile.label, newCode);
    }
    setEditingFile(null);
  }, [editingFile, readOnly, setNodes, onFileUpdate]);

  const makeNodeData = useCallback((base) => ({
    ...base,
    onDelete: handleDeleteNode,
    onRename: handleRenameNode,
    onEdit: handleEditCode
  }), [handleDeleteNode, handleRenameNode, handleEditCode]);

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

  // Manual file additions - now handled by newGeneratedFiles effect to avoid duplicates
  // and ensure uploaded files are fully editable


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
      // Directed Acyclic Graph (DAG) cycle detection
      const hasCycle = (source, target) => {
        if (source === target) return true;
        const graph = {};
        eds.forEach(e => {
          if (!graph[e.source]) graph[e.source] = [];
          graph[e.source].push(e.target);
        });
        
        const visited = new Set();
        const dfs = (node) => {
          if (node === source) return true;
          if (visited.has(node)) return false;
          visited.add(node);
          if (!graph[node]) return false;
          for (const neighbor of graph[node]) {
            if (dfs(neighbor)) return true;
          }
          return false;
        };
        return dfs(target);
      };

      if (hasCycle(params.source, params.target)) {
        alert("Cyclic connection prevented! You cannot create an infinite loop.");
        return eds;
      }

      // Find source and target nodes to auto-inject import statements
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (sourceNode && targetNode && !readOnly) {
        const targetName = targetNode.data.label.replace(/\.jsx?$/, '');
        const importStmt = `import ${targetName} from './${targetName}';`;
        
        let newSourceCode = sourceNode.data.code || '';
        if (!newSourceCode.includes(importStmt)) {
          // Inject import at the top
          const importIndex = newSourceCode.indexOf('import ');
          if (importIndex !== -1) {
            const nextLineIndex = newSourceCode.indexOf('\n', importIndex);
            newSourceCode = newSourceCode.slice(0, nextLineIndex + 1) + importStmt + '\n' + newSourceCode.slice(nextLineIndex + 1);
          } else {
            newSourceCode = importStmt + '\n' + newSourceCode;
          }

          // Inject the component JSX tag into the return block
          const returnIndex = newSourceCode.indexOf('return ');
          if (returnIndex !== -1) {
            // Find the first `<` after return
            const firstTagIndex = newSourceCode.indexOf('<', returnIndex);
            if (firstTagIndex !== -1) {
              const endOfFirstTag = newSourceCode.indexOf('>', firstTagIndex);
              if (endOfFirstTag !== -1) {
                const jsxTag = `\n      <${targetName} />`;
                newSourceCode = newSourceCode.slice(0, endOfFirstTag + 1) + jsxTag + newSourceCode.slice(endOfFirstTag + 1);
              }
            }
          }

          // Update source node code
          setNodes(nds => nds.map(n => 
            n.id === params.source ? { ...n, data: { ...n.data, code: newSourceCode } } : n
          ));
          if (onFileUpdate) onFileUpdate(sourceNode.data.label, newSourceCode);
        }
      }

      const newEdges = addEdge({
        ...params,
        type: 'smoothstep',
        style: { stroke: '#d1d5db', strokeWidth: 2 },
      }, eds);
      
      broadcastCanvasUpdate(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes, setNodes, onFileUpdate, readOnly]);

  const onNodesDelete = useCallback((deleted) => {
    // Call onFileDelete outside of the state updater to avoid React strict-mode double execution
    deleted.forEach(d => {
      if (onFileDelete) onFileDelete(d.data.label);
    });

    setNodes(nds => {
      const remainingNodes = nds.filter(n => !deleted.find(d => d.id === n.id));
      // Broadcast the remaining nodes, but avoid broadcasting stale edges by letting the server handle edge cascading
      broadcastCanvasUpdate(remainingNodes, edges);
      return remainingNodes;
    });
  }, [edges, setNodes, onFileDelete]);

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
    <div style={{ width: '100%', height: '100%', flex: 1, position: 'relative' }}>
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
      
      {editingFile && (
        <MonacoEditorPanel 
          code={editingFile.code}
          fileName={editingFile.label}
          onSave={handleSaveCode}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
};
