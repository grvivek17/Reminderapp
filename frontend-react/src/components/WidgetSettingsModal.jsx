import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Cloud, TrendingUp } from 'lucide-react';

export default function WidgetSettingsModal({ isOpen, onClose, user }) {
  const prefsKey = `widget_prefs_${user?.id || 'default'}`;
  
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [marketEnabled, setMarketEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(prefsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWeatherEnabled(parsed.weather || false);
        setMarketEnabled(parsed.market || false);
      }
    }
  }, [isOpen, prefsKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newPrefs = { weather: weatherEnabled, market: marketEnabled };
    localStorage.setItem(prefsKey, JSON.stringify(newPrefs));
    
    // Dispatch custom event to notify DashboardWidgets
    window.dispatchEvent(new Event('widgetPrefsChanged'));
    
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay open" style={{ display: 'flex', zIndex: 1500, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: 'var(--surface)', width: '90%', maxWidth: '400px', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dashboard Widgets</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)" /></button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Customize your home dashboard by subscribing to optional widgets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                <Cloud size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>Local Weather</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time forecast based on GPS</div>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={weatherEnabled} 
                onChange={(e) => setWeatherEnabled(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>Nifty 50 Market</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live stock index updates</div>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={marketEnabled} 
                onChange={(e) => setMarketEnabled(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
              />
            </label>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
