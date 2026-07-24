import React, { useState, useContext, useEffect } from 'react';
import { Activity, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { TasksContext } from '../context/TasksContext';

export default function HealthCoach() {
  const { tasks } = useContext(TasksContext);
  const [healthInsight, setHealthInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const getHealthCoach = async () => {
    setLoading(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await api('/ai/health-coach', {
        method: 'POST',
        body: JSON.stringify({ 
          message: "Analyze my tasks and give health advice.",
          tasks: activeTasks,
          userHealth: {
            sleep: 7,
            stress: 'moderate'
          }
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
    if (tasks.length > 0 && !healthInsight && !loading) {
      getHealthCoach();
    }
  }, [tasks]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '24px', color: 'white', minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} /> Wellness Coach
          </h2>
          <button onClick={getHealthCoach} disabled={loading} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}>
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
        
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
        </div>
      </div>
    </div>
  );
}
