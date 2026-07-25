import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Target, Bell, Users, LogIn } from 'lucide-react';

export default function Auth() {
  const { login } = useContext(AuthContext);

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

      {/* Right side: SSO Login */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
              Welcome to ReminderApp
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Sign in with your organization account to access your tasks.
            </p>
          </div>

          <button 
            onClick={login}
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
              gap: '12px'
            }}
          >
            <LogIn size={20} />
            Sign in with SSO
          </button>
        </div>
      </div>
    </div>
  );
}
