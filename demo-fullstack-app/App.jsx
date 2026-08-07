import React, { useState, useEffect } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [status, setStatus] = useState('Checking API connection...');

  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setStatus('⚡ Connected to Backend Express API (/api/todos)');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setStatus('⚠️ Offline Mode (Fallback to local data)');
        setItems([
          { id: 1, text: 'Build React Frontend', completed: true },
          { id: 2, text: 'Deploy Express Backend API', completed: true },
          { id: 3, text: 'Test Full-Stack Deployment on Vercel', completed: false }
        ]);
        setLoading(false);
      });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item = { id: Date.now(), text: newItem, completed: false };
    setItems([...items, item]);
    setNewItem('');

    fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(() => {});
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ SPARK Full-Stack Test App
          </h1>
          <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>
            React Frontend + Express Node.js Backend API
          </p>
          <div style={{ marginTop: '12px', fontSize: '0.75rem', padding: '6px 12px', background: '#1f2937', color: '#10b981', borderRadius: '20px', display: 'inline-block', fontWeight: 600 }}>
            {status}
          </div>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Add new task or item..." 
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px 16px', color: '#fff', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>
            + Add
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>Loading items...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '14px 18px', borderRadius: '10px', border: '1px solid #374151' }}>
                <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#9ca3af' : '#fff' }}>
                  {item.text}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: item.completed ? '#065f46' : '#374151', color: item.completed ? '#34d399' : '#9ca3af' }}>
                  {item.completed ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
