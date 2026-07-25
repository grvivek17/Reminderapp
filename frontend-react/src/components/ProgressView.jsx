import React, { useContext } from 'react';
import { CheckCircle } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';
import TaskItem from './TaskItem';

export default function ProgressView() {
  const { tasks } = useContext(TasksContext);

  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="var(--status-completed)" /> Completed Tasks
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
