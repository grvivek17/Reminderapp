import React, { useContext } from 'react';
import { Calendar as CalIcon, MapPin, Target, CheckCircle2, Circle } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';

export default function TaskItem({ task, isCompleted }) {
  const { updateTaskStatus, setEditingTask, setIsModalOpen } = useContext(TasksContext);

  const toggleStatus = (e) => {
    e.stopPropagation();
    const newStatus = isCompleted ? 'not_started' : 'completed';
    updateTaskStatus(task.id, newStatus);
  };

  const priorityColor = {
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)'
  }[task.priority] || 'var(--medium)';

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''}`} style={{ opacity: isCompleted ? 0.6 : 1, position: 'relative' }}>
      <div 
        style={{ 
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', 
          backgroundColor: priorityColor, borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' 
        }} 
      />
      
      <div style={{ display: 'flex', gap: '12px', paddingLeft: '8px' }}>
        <button onClick={toggleStatus} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginTop: '2px' }}>
          {isCompleted ? (
            <CheckCircle2 size={24} color="var(--low)" />
          ) : (
            <Circle size={24} color="var(--border)" />
          )}
        </button>
        
        <div style={{ flex: 1 }} onClick={() => { setEditingTask(task); setIsModalOpen(true); }} style={{ cursor: 'pointer', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
              {task.text}
            </h3>
            <span className={`category-badge ${task.category}`}>
              {task.category}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalIcon size={14} /> {task.date}
            </div>
            
            {task.locationText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> {task.locationText}
              </div>
            )}
            
            {task.etaDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--medium)' }}>
                <Target size={14} /> ETA: {task.etaDate}
              </div>
            )}
            
            {task.routineType !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                🔁 {task.routineType}
              </div>
            )}
          </div>
          
          {task.status === 'in_progress' && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${task.progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
