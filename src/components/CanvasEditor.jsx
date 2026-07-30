import React, { useCallback, useEffect } from 'react';
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { subscribeToCanvasUpdates, broadcastCanvasUpdate } from '../services/SupabaseService';

const initialNodes = [
  { id: '1', position: { x: 120, y: 80 }, data: { label: 'App.jsx' }, type: 'customNode' },
  { id: '2', position: { x: 120, y: 230 }, data: { label: 'index.css' }, type: 'customNode' },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const CustomNode = ({ data, id }) => {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Top} style={{ background: '#6c5ce7' }} />
      <div className="custom-node-header">
        <span>📄 {data.label}</span>
        <button className="node-delete-btn" onClick={() => data.onDelete && data.onDelete(id)}>×</button>
      </div>
      <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>React Component</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#6c5ce7' }} />
    </div>
  );
};

const nodeTypes = { customNode: CustomNode };

export const CanvasEditor = ({ newGeneratedFiles, manualFile }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Define handleDeleteNode first before anything references it
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Initialize nodes after handleDeleteNode is defined
  useEffect(() => {
    setNodes(initialNodes.map(n => ({
      ...n,
      data: { ...n.data, onDelete: handleDeleteNode }
    })));
  }, [handleDeleteNode]);

  // Supabase realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToCanvasUpdates(() => {});
    return () => unsubscribe();
  }, []);

  // Handle manual file additions from the sidebar
  useEffect(() => {
    if (!manualFile) return;
    const newNode = {
      id: `manual-${manualFile.timestamp}`,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 },
      type: 'customNode',
      data: { label: manualFile.name, onDelete: handleDeleteNode },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [manualFile]);

  // Handle Gemini AI generated files
  useEffect(() => {
    if (!newGeneratedFiles) return;
    const newNodes = Object.keys(newGeneratedFiles).map((filename, index) => ({
      id: `gen-${Date.now()}-${index}`,
      position: { x: 280 + (index * 30), y: 80 + (index * 60) },
      type: 'customNode',
      data: { label: filename, onDelete: handleDeleteNode },
    }));
    setNodes((nds) => [...nds, ...newNodes]);
  }, [newGeneratedFiles]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      broadcastCanvasUpdate(nodes);
    },
    [setEdges, nodes],
  );

  return (
    <div className="editor-content">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={() => broadcastCanvasUpdate(nodes)}
        nodeTypes={nodeTypes}
        colorMode="dark"
        style={{ background: 'var(--vscode-bg)' }}
      >
        <Background color="#2a2a3a" gap={20} variant="dots" size={2} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
