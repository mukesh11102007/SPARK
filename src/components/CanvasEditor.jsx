import React, { useCallback, useEffect, useState } from 'react';
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { subscribeToCanvasUpdates, broadcastCanvasUpdate } from '../services/SupabaseService';

const initialNodes = [];
const initialEdges = [];

const CustomNode = ({ data, id }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleRename = () => {
    setEditing(true);
  };

  const commitRename = () => {
    setEditing(false);
    if (data.onRename) data.onRename(id, label);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: '#1e1e2e', border: '1px solid #3a3a5c',
      borderRadius: '8px', minWidth: '160px', boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      transition: 'border-color 0.2s', cursor: 'grab',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#00fa9a', width: 10, height: 10, left: -5 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => e.key === 'Enter' && commitRename()}
              style={{ background: '#12121e', border: '1px solid #6c5ce7', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: '0.82rem', width: '100%' }}
            />
          ) : (
            <span
              style={{ fontWeight: 600, fontSize: '0.82rem', cursor: 'text' }}
              onDoubleClick={handleRename}
              title="Double-click to rename"
            >
              📄 {data.label}
            </span>
          )}
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <button title="Rename" style={{ background: 'transparent', color: '#79c0ff', border: 'none', cursor: 'pointer', fontSize: 12, padding: '0 2px' }} onClick={handleRename}>✏️</button>
            <button title="Delete" style={{ background: 'transparent', color: '#ff7b72', border: 'none', cursor: 'pointer', fontSize: 12, padding: '0 2px' }} onClick={() => data.onDelete && data.onDelete(id)}>×</button>
          </div>
        </div>
        <div style={{ opacity: 0.4, fontSize: '0.68rem', letterSpacing: '0.04em' }}>React Component</div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#00fa9a', width: 10, height: 10, right: -5 }} />
    </div>
  );
};

const nodeTypes = { customNode: CustomNode };

export const CanvasEditor = ({ newGeneratedFiles, manualFile }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleRenameNode = useCallback((nodeId, newLabel) => {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
    ));
  }, [setNodes]);

  const makeNodeData = useCallback((base) => ({
    ...base,
    onDelete: handleDeleteNode,
    onRename: handleRenameNode,
  }), [handleDeleteNode, handleRenameNode]);

  // Initialize nodes
  useEffect(() => {
    setNodes(initialNodes.map(n => ({ ...n, data: makeNodeData({ label: n.data.label }) })));
  }, [makeNodeData]);

  // Supabase realtime
  useEffect(() => {
    const unsub = subscribeToCanvasUpdates((payload) => {
      if (payload.nodes) {
        setNodes(payload.nodes.map(n => ({ ...n, data: makeNodeData({ label: n.data?.label || 'Component' }) })));
      }
    });
    return unsub;
  }, [makeNodeData]);

  // Manual file additions
  useEffect(() => {
    if (!manualFile) return;
    const newNode = {
      id: `manual-${manualFile.timestamp}`,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 },
      type: 'customNode',
      data: makeNodeData({ label: manualFile.name }),
    };
    setNodes(nds => [...nds, newNode]);
  }, [manualFile]);

  // AI generated files
  useEffect(() => {
    if (!newGeneratedFiles) return;
    const newNodes = Object.keys(newGeneratedFiles).map((filename, index) => ({
      id: `gen-${Date.now()}-${index}`,
      position: { x: 300 + (index * 40), y: 100 + (index * 70) },
      type: 'customNode',
      data: makeNodeData({ label: filename }),
    }));
    setNodes(nds => [...nds, ...newNodes]);
  }, [newGeneratedFiles]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#6c5ce7' } }, eds));
    broadcastCanvasUpdate(nodes);
  }, [setEdges, nodes]);

  return (
    <div className="editor-content">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={(_, __, allNodes) => broadcastCanvasUpdate(allNodes)}
        nodeTypes={nodeTypes}
        colorMode="dark"
        style={{ background: 'var(--vscode-bg)' }}
      >
        <Background color="#2a2a3a" gap={20} variant="dots" size={1.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
