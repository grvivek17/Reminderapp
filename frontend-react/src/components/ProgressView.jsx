import React, { useContext, useState, useEffect } from 'react';
import { CheckCircle, Quote } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';
import TaskItem from './TaskItem';
import { api } from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ProgressView() {
  const { tasks } = useContext(TasksContext);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);

  // Fetch Quote
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await api('/widgets/quote');
        setQuote(res);
      } catch (err) {
        console.error("Failed to fetch quote", err);
      } finally {
        setLoadingQuote(false);
      }
    };
    fetchQuote();
  }, []);

  // Data Aggregation
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.date >= todayStr);
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.date < todayStr);

  // 1. Pie Chart Data (Status Breakdown)
  const statusData = [
    { name: 'Completed', value: completedTasks.length, color: '#10b981' }, // emerald-500
    { name: 'Active', value: activeTasks.length, color: '#3b82f6' },       // blue-500
    { name: 'Overdue', value: overdueTasks.length, color: '#ef4444' }      // red-500
  ].filter(d => d.value > 0);

  // 2. Bar Chart Data (Last 7 Days Completions)
  // We don't track exact completion date in the schema natively, so we approximate
  // by using the task's due date for completed tasks, assuming they were completed on their due date.
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const completionHistory = last7Days.map(dateStr => {
    // Format date for display (e.g., 'Mon', 'Tue')
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Count completed tasks due on this date
    const count = completedTasks.filter(t => t.date === dateStr).length;
    
    return { name: dayName, completed: count };
  });

  return (
    <div style={{ padding: '0 20px' }}>
      
      {/* Quote Section */}
      <div style={{ marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Quote size={48} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.2 }} />
        {loadingQuote ? (
          <div style={{ opacity: 0.8 }}>Fetching inspiration...</div>
        ) : quote ? (
          <>
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '8px', fontWeight: 500 }}>"{quote.text}"</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, textAlign: 'right' }}>— {quote.author}</p>
          </>
        ) : (
          <p style={{ fontSize: '1rem', fontStyle: 'italic' }}>"Stay organized and focused."</p>
        )}
      </div>

      {/* Analytics Charts */}
      {tasks.length > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Task Breakdown</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
              {statusData.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Completed (Last 7 Days)</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionHistory} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'var(--bg)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="completed" fill="var(--status-completed)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Completed Tasks List */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} color="var(--status-completed)" /> Completed History
        </h2>
        {completedTasks.length > 0 ? (
          completedTasks.map(task => <TaskItem key={task.id} task={task} isCompleted />)
        ) : (
          <div className="empty-state" style={{ padding: '24px', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px' }}>
            <p>No completed tasks yet. Get things done!</p>
          </div>
        )}
      </div>
    </div>
  );
}
