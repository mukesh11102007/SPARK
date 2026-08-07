import React, { useState } from 'react';
import { saveUserIdentity } from '../services/SupabaseService';

export const UserIdentityModal = ({ onIdentitySet }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter at least 2 characters.');
      return;
    }
    const identity = saveUserIdentity(name.trim());
    onIdentitySet(identity);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '1px solid rgba(121,192,255,0.3)',
        borderRadius: '16px',
        padding: '40px',
        width: '360px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(121,192,255,0.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/spark-logo.png" alt="SPARK Logo" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#e6edf3', letterSpacing: '-0.5px' }}>
            Welcome to SPARK
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#10b981', fontWeight: 600, letterSpacing: '0.05em' }}>
            DEPLOY • MANAGE • MAINTAIN
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#79c0ff', opacity: 0.8 }}>
            Enter your name to join the workspace
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            placeholder="Your display name (e.g. Mukesh)"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${error ? '#f14c4c' : 'rgba(121,192,255,0.2)'}`,
              borderRadius: '8px', color: '#e6edf3',
              fontSize: '0.95rem', outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#58a6ff'}
            onBlur={e => e.target.style.borderColor = error ? '#f14c4c' : 'rgba(121,192,255,0.2)'}
          />
          {error && (
            <div style={{ color: '#f14c4c', fontSize: '0.78rem', marginTop: '6px' }}>{error}</div>
          )}

          <button
            type="submit"
            style={{
              marginTop: '16px', width: '100%',
              padding: '12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6e40c9, #58a6ff)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              border: 'none', cursor: 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: '0 4px 16px rgba(110,64,201,0.4)',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}
          >
            Join Workspace →
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#444', marginTop: '20px', marginBottom: 0 }}>
          Your name is saved locally. No account needed.
        </p>
      </div>
    </div>
  );
};
