import React, { useState, useRef, useEffect } from 'react';
import { chatWithProject } from '../services/AIOrchestrator';

export const ProjectChatBot = ({ files, mode = 'workspace' }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Assistant. Ask me anything about your workspace or SPARK Studio!' }
  ]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState('All Files');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const fileOptions = ['All Files', ...Object.keys(files || {})];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      let promptModifier = userMessage;
      
      if (mode === 'dashboard') {
        promptModifier = `[SYSTEM CONTEXT OVERRIDE: The user is in the global SPARK Dashboard. Focus your answers entirely on explaining SPARK Studio features, how the platform works, what buttons do, and general navigation guidance. Ignore any code files.]\n\n${userMessage}`;
      } else if (selectedFile !== 'All Files') {
        promptModifier = `[CRITICAL: The user is asking specifically about the file "${selectedFile}". Focus your analysis and answers strictly on this file unless they ask otherwise.]\n\n${userMessage}`;
      }

      // generate a static session id per component mount if it doesn't exist
      if (!messagesEndRef.current.sessionId) {
        messagesEndRef.current.sessionId = Math.random().toString(36).substring(7);
      }

      const response = await chatWithProject(files, promptModifier, messagesEndRef.current.sessionId, mode);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'transparent',
      fontFamily: 'var(--font-ui)', color: 'var(--text-main)'
    }}>
      <div style={{
        padding: '16px', borderBottom: '1px solid var(--panel-border)',
        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-main)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span> {mode === 'dashboard' ? 'SPARK Assistant' : 'Project Assistant'}
        </div>
        {mode !== 'dashboard' && (
          <select 
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            style={{
              background: 'var(--app-bg)', color: 'var(--text-main)', border: '1px solid var(--panel-border)',
              padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', maxWidth: '150px'
            }}
          >
            {fileOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--accent)' : 'var(--panel-elevated)',
            border: msg.role === 'assistant' ? '1px solid var(--panel-border)' : 'none',
            color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
            padding: '12px 16px',
            borderRadius: '12px',
            maxWidth: '85%',
            lineHeight: '1.5',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap'
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Assistant is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your project..."
            style={{
              flex: 1, background: 'var(--app-bg)', border: '1px solid var(--panel-border)',
              color: 'var(--text-main)', padding: '12px', borderRadius: '8px',
              fontFamily: 'var(--font-ui)', outline: 'none'
            }}
          />
          <button type="submit" disabled={isLoading} style={{
            background: 'var(--accent)', border: 'none', color: '#fff',
            padding: '0 16px', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
