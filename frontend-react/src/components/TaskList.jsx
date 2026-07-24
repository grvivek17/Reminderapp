import React, { useContext } from 'react';
import { CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';
import TaskItem from './TaskItem';

export default function TaskList() {
  const { tasks, searchQuery, setSearchQuery } = useContext(TasksContext);

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const filteredTasks = activeTasks.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} color="var(--low)" /> Completed
        </h2>
        {completedTasks.length > 0 ? (
          completedTasks.map(task => <TaskItem key={task.id} task={task} isCompleted />)
        ) : (
          <div className="empty-state">
            <p>No completed tasks yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
