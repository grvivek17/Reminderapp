import React, { useContext, useState } from 'react';
import { CheckCircle, Clock, Search, Filter, MapPin } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';
import TaskItem from './TaskItem';

export default function TaskList() {
  const { tasks, searchQuery, setSearchQuery } = useContext(TasksContext);
  const [activeFilter, setActiveFilter] = useState('all');

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const filteredTasks = activeTasks.filter(t => {
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
                          
    let matchesFilter = true;
    if (activeFilter === 'high') matchesFilter = t.priority === 'high';
    else if (activeFilter === 'medium') matchesFilter = t.priority === 'medium';
    else if (activeFilter === 'low') matchesFilter = t.priority === 'low';
    else if (activeFilter === 'location') matchesFilter = !!t.locationLat;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="search-bar">
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search tasks, categories..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Filter size={18} style={{ position: 'absolute', right: '16px', top: '15px', color: 'var(--text-muted)' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
        <button onClick={() => setActiveFilter('all')} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${activeFilter === 'all' ? 'var(--accent)' : 'var(--border)'}`, background: activeFilter === 'all' ? 'var(--accent)' : 'var(--surface)', color: activeFilter === 'all' ? 'white' : 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>All</button>
        <button onClick={() => setActiveFilter('high')} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${activeFilter === 'high' ? 'var(--high)' : 'var(--border)'}`, background: activeFilter === 'high' ? 'var(--high)' : 'var(--surface)', color: activeFilter === 'high' ? 'white' : 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>High Priority</button>
        <button onClick={() => setActiveFilter('location')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${activeFilter === 'location' ? 'var(--status-completed)' : 'var(--border)'}`, background: activeFilter === 'location' ? 'var(--status-completed)' : 'var(--surface)', color: activeFilter === 'location' ? 'white' : 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <MapPin size={12} /> With Location
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent)" /> Active Tasks
        </h2>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => <TaskItem key={task.id} task={task} />)
        ) : (
          <div className="empty-state">
            <p>No active tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
