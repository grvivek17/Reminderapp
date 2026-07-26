import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Target, Bell, Users, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const { login, signup } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(name, email, password);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Left side: Hero/Marketing */}
      <div style={{ 
        flex: 1, 
        padding: '40px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        backgroundColor: 'var(--surface)', 
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)' 
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'white', marginBottom: '24px' }}>
            <Target size={28} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '16px', lineHeight: 1.2 }}>Smart<br/>ReminderApp</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>Organize your life with intelligent task clustering, context-aware daily briefings, and team delegation.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>AI Task Briefing</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get a customized plan based on weather, context, and deadlines.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Bell size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Smart Reminders</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Location-based alerts and timely push notifications.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Family & Teams</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Delegate tasks to family members or colleagues easily.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Sign in to access your tasks.' : 'Sign up to start organizing your life.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Name</label>
                <input 
                  type="text" 
                  required={!isLogin}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'var(--accent)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '1.05rem', 
                fontWeight: 500, 
                cursor: 'pointer', 
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '8px'
              }}
            >
              {isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Sign Up</>}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.95rem' }}>
            {isLogin ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                Don't have an account? <button onClick={() => setIsLogin(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>Sign Up</button>
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                Already have an account? <button onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>Sign In</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
