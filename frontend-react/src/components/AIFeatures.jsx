import React, { useState, useContext } from 'react';
import { Sparkles, Activity, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { TasksContext } from '../context/TasksContext';

export default function AIFeatures() {
  const { tasks } = useContext(TasksContext);
  
  const [briefing, setBriefing] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  
  const [healthInsight, setHealthInsight] = useState('');
  const [loadingHealth, setLoadingHealth] = useState(false);

  const getBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await api('/ai/briefing', {
        method: 'POST',
        body: JSON.stringify({ 
          tasks: activeTasks, 
          userContext: {
            time: new Date().toLocaleTimeString(),
            weather: 'Sunny', // Mocked for now, can implement geolocation weather later
            location: 'Home'
          }
        })
      });
      setBriefing(res.briefing);
    } catch (err) {
      console.error(err);
      setBriefing("Failed to generate AI briefing. Please try again later.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const getHealthCoach = async () => {
    setLoadingHealth(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await api('/ai/health-coach', {
        method: 'POST',
        body: JSON.stringify({ 
          tasks: activeTasks,
          userHealth: {
            sleep: 7,
            stress: 'moderate'
          }
        })
      });
      setHealthInsight(res.insight);
    } catch (err) {
      console.error(err);
      setHealthInsight("Failed to get health insights.");
    } finally {
      setLoadingHealth(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '0 20px', marginBottom: '24px', paddingBottom: '8px' }} className="hide-scrollbar">
      {/* AI Briefing Card */}
      <div style={{ minWidth: '300px', flex: 1, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', borderRadius: '16px', padding: '20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} /> Daily Briefing
          </h3>
          <button onClick={getBriefing} disabled={loadingBriefing} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}>
            {loadingBriefing ? 'Generating...' : 'Refresh'}
          </button>
        </div>
        
        <div style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.9 }}>
          {loadingBriefing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader className="spin" size={16} /> Analyzing your schedule...</div>
          ) : briefing ? (
            briefing
          ) : (
            "Click refresh to get your AI-powered schedule optimization."
          )}
        </div>
      </div>

      {/* Health Coach Card */}
      <div style={{ minWidth: '300px', flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} /> Wellness Coach
          </h3>
          <button onClick={getHealthCoach} disabled={loadingHealth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}>
            {loadingHealth ? 'Analyzing...' : 'Check'}
          </button>
        </div>
        
        <div style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.9 }}>
          {loadingHealth ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader className="spin" size={16} /> Checking workload balance...</div>
          ) : healthInsight ? (
            healthInsight
          ) : (
            "Check if your schedule allows for proper rest and breaks."
          )}
        </div>
      </div>
    </div>
  );
}
