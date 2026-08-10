import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

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
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      const userWithStyles = {
        ...data.user,
        initials: data.user.name.substring(0, 2).toUpperCase(),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      };

      localStorage.setItem('spark_token', data.token);
      localStorage.setItem('spark_user', JSON.stringify(userWithStyles));
      onLogin(userWithStyles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(circle at 50% 50%, #1e1e2f 0%, #0f0f17 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: 'var(--font-ui)', overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(77, 61, 247, 0.15) 0%, transparent 70%)',
        top: '-10%', left: '-10%', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(0, 196, 140, 0.1) 0%, transparent 70%)',
        bottom: '-10%', right: '-10%', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 12s ease-in-out infinite reverse'
      }} />
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          .auth-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 14px 16px;
            border-radius: 12px;
            color: #fff;
            font-size: 0.95rem;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          .auth-input:focus {
            background: rgba(255, 255, 255, 0.05);
            border-color: #4D3DF7;
            box-shadow: 0 0 0 4px rgba(77, 61, 247, 0.1);
          }
          .auth-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }
          .auth-btn {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            background: linear-gradient(135deg, #4D3DF7 0%, #8A2BE2 100%);
            color: white;
            border: none;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 10px;
          }
          .auth-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(77, 61, 247, 0.4);
          }
          .auth-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        `}
      </style>

      <div style={{
        background: 'rgba(20, 20, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '48px 40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          width: '56px', height: '56px', 
          background: 'linear-gradient(135deg, #4D3DF7 0%, #8A2BE2 100%)', 
          borderRadius: '16px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px',
          boxShadow: '0 8px 20px rgba(77, 61, 247, 0.3)'
        }}>
          <span style={{ fontSize: '1.8rem' }}>✨</span>
        </div>
        
        <h1 style={{ 
          color: '#fff', fontSize: '2.2rem', marginBottom: '12px', fontWeight: '800', 
          letterSpacing: '-0.03em'
        }}>
          SPARK Studio
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '36px', fontSize: '1rem', lineHeight: '1.5' }}>
          {isLogin ? 'Welcome back to the future of coding.' : 'Join the revolution. Build faster.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {!isLogin && (
            <>
              <input className="auth-input" type="text" placeholder="Full Name" value={name || ""} onChange={e => setName(e.target.value)} required />
              <select className="auth-input" value={developerType || "non-technical"} onChange={e => setDeveloperType(e.target.value)} style={{ appearance: 'none' }}>
                <option value="non-technical" style={{ background: '#1a1a24' }}>I am Non-Technical (Designer/Manager)</option>
                <option value="technical" style={{ background: '#1a1a24' }}>I am a Developer</option>
              </select>
            </>
          )}
          <input className="auth-input" type="email" placeholder="Email Address" value={email || ""} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" value={password || ""} onChange={e => setPassword(e.target.value)} required />
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {error}
          </div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '28px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: '#8A2BE2', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
};
