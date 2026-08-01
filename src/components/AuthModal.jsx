import React, { useState } from 'react';

export const AuthModal = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [developerType, setDeveloperType] = useState('non-technical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, developerType };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('spark_token', data.token);
      localStorage.setItem('spark_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: 'var(--font-ui)'
    }}>
      <div style={{
        background: 'var(--vscode-panel-bg)', border: '1px solid var(--vscode-border)',
        padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center'
      }}>
        <h1 style={{ color: 'var(--vscode-text)', fontSize: '2rem', marginBottom: '10px', fontWeight: '800', background: 'linear-gradient(135deg, var(--vscode-accent) 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SPARK
        </h1>
        <p style={{ color: 'var(--vscode-text)', opacity: 0.7, marginBottom: '30px', fontSize: '0.9rem' }}>
          {isLogin ? 'Welcome back to the future of coding.' : 'Join the revolution. Build faster.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <>
              <input className="ide-input" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
              <select className="ide-input" value={developerType} onChange={e => setDeveloperType(e.target.value)}>
                <option value="non-technical">I am Non-Technical (Designer/Manager)</option>
                <option value="technical">I am a Developer</option>
              </select>
            </>
          )}
          <input className="ide-input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="ide-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>{error}</div>}

          <button className="ide-btn" type="submit" disabled={loading} style={{ padding: '12px', fontSize: '1rem', marginTop: '10px' }}>
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--vscode-text)', opacity: 0.7 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: 'var(--vscode-accent)', cursor: 'pointer', fontWeight: '600' }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
};
