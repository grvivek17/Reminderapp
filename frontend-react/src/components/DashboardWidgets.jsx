import React, { useState, useEffect } from 'react';
import { Cloud, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { getCurrentPosition } from '../utils/capacitor';

export default function DashboardWidgets({ user }) {
  const [weather, setWeather] = useState(null);
  const [market, setMarket] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  
  // Get preferences from localStorage, default to false if not set
  const prefsKey = `widget_prefs_${user?.id || 'default'}`;
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem(prefsKey);
    return saved ? JSON.parse(saved) : { weather: false, market: false };
  });

  // Re-read prefs if they change externally (or we can just rely on props if we want)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(prefsKey);
      if (saved) setPrefs(JSON.parse(saved));
    };
    window.addEventListener('widgetPrefsChanged', handleStorageChange);
    return () => window.removeEventListener('widgetPrefsChanged', handleStorageChange);
  }, [prefsKey]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      let lat = '51.5074'; // fallback London
      let lng = '-0.1278';
      
      const coords = await getCurrentPosition();
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
      
      const res = await api.get(`/widgets/weather?lat=${lat}&lng=${lng}`);
      setWeather(res);
    } catch (err) {
      console.error('Failed to fetch weather', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchMarket = async () => {
    setLoadingMarket(true);
    try {
      const res = await api.get('/widgets/market');
      setMarket(res);
    } catch (err) {
      console.error('Failed to fetch market data', err);
    } finally {
      setLoadingMarket(false);
    }
  };

  useEffect(() => {
    if (prefs.weather) fetchWeather();
    if (prefs.market) fetchMarket();
  }, [prefs.weather, prefs.market]);

  if (!prefs.weather && !prefs.market) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', padding: '0 20px', marginBottom: '24px' }}>
      
      {/* Weather Widget */}
      {prefs.weather && (
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Weather</span>
            <Cloud size={16} color="var(--accent)" />
          </div>
          {loadingWeather ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><RefreshCw size={14} className="spin" /> Loading...</div>
          ) : weather ? (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{weather.temperature}°C</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wind: {weather.windspeed} km/h</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Failed to load</div>
          )}
        </div>
      )}

      {/* Market Widget */}
      {prefs.market && (
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nifty 50</span>
            {market?.isPositive ? <TrendingUp size={16} color="var(--status-completed)" /> : <TrendingDown size={16} color="var(--danger)" />}
          </div>
          {loadingMarket ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><RefreshCw size={14} className="spin" /> Loading...</div>
          ) : market ? (
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{market.price}</div>
              <div style={{ fontSize: '0.85rem', color: market.isPositive ? 'var(--status-completed)' : 'var(--danger)', fontWeight: 500 }}>
                {market.isPositive ? '+' : ''}{market.change} ({market.changePercent}%)
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Failed to load</div>
          )}
        </div>
      )}

    </div>
  );
}
