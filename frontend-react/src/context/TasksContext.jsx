import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import { AuthContext } from './AuthContext';

export const TasksContext = createContext();

export const TasksProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10)); // Today YYYY-MM-DD
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'calendar', 'map'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  const addTask = async (taskData) => {
    const newTask = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const updateTask = async (id, taskData) => {
    const updated = await api(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
    setTasks(tasks.map(t => (t.id === id ? updated : t)));
    return updated;
  };

  const updateTaskStatus = async (id, status) => {
    const res = await api(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    // Optimistic update
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: res.status, date: res.newDate || t.date };
      }
      return t;
    }));
  };

  const deleteTask = async (id) => {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <TasksContext.Provider value={{ 
      tasks, loading, fetchTasks, addTask, updateTask, updateTaskStatus, deleteTask,
      currentDate, setCurrentDate, activeTab, setActiveTab, searchQuery, setSearchQuery,
      isModalOpen, setIsModalOpen, editingTask, setEditingTask
    }}>
      {children}
    </TasksContext.Provider>
  );
};
