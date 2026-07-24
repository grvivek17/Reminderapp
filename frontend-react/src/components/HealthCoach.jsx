import React, { useState, useContext, useEffect } from 'react';
import { Activity, Loader, Smartphone } from 'lucide-react';
import { api } from '../utils/api';
import { TasksContext } from '../context/TasksContext';

export default function HealthCoach() {
  const { tasks } = useContext(TasksContext);
  const [healthInsight, setHealthInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [trackers, setTrackers] = useState({
    sleep: { duration: 7, quality: 'good' },
    stress: { level: 5 },
    water: { amount: 1.5 }
  });

  const getHealthCoach = async () => {
    setLoading(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await api('/ai/health-coach', {
        method: 'POST',
        body: JSON.stringify({ 
          message: "Analyze my tasks and give health advice.",
          tasks: activeTasks,
          trackers,
          weather: 'Sunny'
        })
      });
      setHealthInsight(res);
    } catch (err) {
      console.error(err);
      setHealthInsight({ recommendation: "Failed to get health insights.", reasoning: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 && !healthInsight && !loading && healthConnected) {
      getHealthCoach();
    }
  }, [tasks, healthConnected]);

  const handleConnectHealth = () => {
    setSyncing(true);
    // Simulate connecting to health provider and pulling dynamic data
    setTimeout(() => {
      const dynamicSleep = (Math.random() * 4 + 4).toFixed(1); // 4 to 8 hours
      const dynamicStress = Math.floor(Math.random() * 8) + 2; // 2 to 9
      const dynamicWater = (Math.random() * 2 + 1).toFixed(1); // 1 to 3 liters
      
      setTrackers({
        sleep: { duration: parseFloat(dynamicSleep), quality: dynamicSleep > 6 ? 'good' : 'poor' },
        stress: { level: dynamicStress },
        water: { amount: parseFloat(dynamicWater) }
      });
      
      setHealthConnected(true);
      setSyncing(false);
    }, 1500);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '24px', color: 'white', minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} /> Wellness Coach
          </h2>
          {healthConnected && (
            <button onClick={getHealthCoach} disabled={loading} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}>
              {loading ? 'Analyzing...' : 'Refresh'}
            </button>
          )}
        </div>
        
        {!healthConnected ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Smartphone size={48} style={{ opacity: 0.8, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Connect Your Health App</h3>
            <p style={{ opacity: 0.9, marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>
              Sync your step count, sleep data, and stress metrics to get personalized wellness insights for your task schedule.
            </p>
            <button 
              onClick={handleConnectHealth} 
              disabled={syncing}
              style={{ background: 'white', color: '#059669', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {syncing ? <><Loader className="spin" size={18} /> Syncing Data...</> : 'Connect & Sync'}
            </button>
          </div>
        ) : (
        <div style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.95 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Loader className="spin" size={20} /> Checking workload balance...
            </div>
          ) : healthInsight ? (
            <div>
              {typeof healthInsight === 'string' ? healthInsight : (
                <>
                  <p style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 500 }}>{healthInsight.recommendation}</p>
                  
                  {healthInsight.reasoning && (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Why this matters</h3>
                      <p style={{ margin: 0 }}>{healthInsight.reasoning}</p>
                    </div>
                  )}

                  {healthInsight.tips && healthInsight.tips.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Tips</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {healthInsight.tips.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            "Click refresh to check if your schedule allows for proper rest and breaks."
          )}
          
          {healthInsight && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem', opacity: 0.8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Sleep: {trackers.sleep.duration}h</span>
              <span>Stress Level: {trackers.stress.level}/10</span>
              <span>Water: {trackers.water.amount}L</span>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
