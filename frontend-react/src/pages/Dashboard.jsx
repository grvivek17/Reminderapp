import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { TasksContext } from '../context/TasksContext';
import { LogOut, Calendar, List, Map as MapIcon, Plus, Menu } from 'lucide-react';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';
import CalendarView from '../components/CalendarView';
import MapLocation from '../components/MapLocation';
import AIFeatures from '../components/AIFeatures';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { currentUser, logout } = useContext(AuthContext);
  const { tasks, currentDate, setCurrentDate, activeTab, setActiveTab, isModalOpen, setIsModalOpen, editingTask, setEditingTask } = useContext(TasksContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Calculate stats
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const todayTasks = activeTasks.filter(t => t.date === todayStr);
  const overdueTasks = activeTasks.filter(t => t.date < todayStr);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="icon-btn" onClick={() => setIsSidebarOpen(true)} title="Menu">
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Hi, {currentUser?.name?.split(' ')[0]} 👋</h1>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Here's what's on your plate.</p>
            </div>
          </div>
          
          <button className="icon-btn" onClick={logout} title="Sign Out">
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{todayTasks.length}</div>
            <div className="stat-label">Due Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {overdueTasks.length}
            </div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeTasks.length}</div>
            <div className="stat-label">Active Total</div>
          </div>
        </div>
      </header>

      {/* Sidebar replaces Tabs */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        logout={logout}
      />

      <AIFeatures />

      {/* Main Content Area */}
      <div style={{ paddingBottom: '80px' }}>
        {activeTab === 'list' && <TaskList />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'map' && <MapLocation />}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
        <Plus size={24} />
      </button>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingTask={editingTask} />
    </div>
  );
}
