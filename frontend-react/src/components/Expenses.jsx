import React from 'react';
import { DollarSign } from 'lucide-react';

export default function Expenses() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px', color: '#3b82f6' }}>
          <DollarSign size={40} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>Expenses</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          This feature is currently under construction. Soon you will be able to track your daily expenses and link them to specific tasks and routines.
        </p>
        <button style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>
          Notify me when ready
        </button>
      </div>
    </div>
  );
}
