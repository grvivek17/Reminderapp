import React, { useState, useContext, useEffect } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { TasksContext } from '../context/TasksContext';

export default function DailyBriefing() {
  const { tasks } = useContext(TasksContext);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  const getBriefing = async () => {
    setLoading(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await api('/ai/daily-briefing', {
        method: 'POST',
        body: JSON.stringify({ 
          tasks: activeTasks, 
          userContext: {
            time: new Date().toLocaleTimeString(),
            weather: 'Sunny',
            location: 'Home'
          }
        })
      });
      // The backend /ai/daily-briefing actually returns JSON with summary, workPlan, etc.
      // So let's handle the response properly.
      setBriefing(res.briefing || res); 
    } catch (err) {
      console.error(err);
      setBriefing({ summary: "Failed to generate AI briefing. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 && !briefing && !loading) {
      getBriefing();
    }
  }, [tasks]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', borderRadius: '16px', padding: '24px', color: 'white', minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={24} /> Daily AI Briefing
          </h2>
          <button onClick={getBriefing} disabled={loading} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}>
            {loading ? 'Generating...' : 'Refresh'}
          </button>
        </div>
        
        <div style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.95 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Loader className="spin" size={20} /> Analyzing your schedule...
            </div>
          ) : briefing ? (
            <div>
              {typeof briefing === 'string' ? briefing : (
                <>
                  <p style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 500 }}>{briefing.summary}</p>
                  
                  {briefing.workPlan && briefing.workPlan.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Top Priorities</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {briefing.workPlan.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>
                            <strong>{item.task}</strong> ({item.timeHint}) - <em>{item.why}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {briefing.recommendations && briefing.recommendations.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Recommendations</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {briefing.recommendations.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {briefing.alerts && briefing.alerts.length > 0 && (
                    <div style={{ background: 'rgba(220,53,69,0.2)', padding: '16px', borderRadius: '12px' }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Alerts</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {briefing.alerts.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            "Click refresh to generate your AI-powered schedule optimization."
          )}
        </div>
      </div>
    </div>
  );
}
