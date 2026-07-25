import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { TasksContext } from '../context/TasksContext';
import { LogOut, Calendar, List, Map as MapIcon, Plus, Menu, Settings } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import MapLocation from '../components/MapLocation';
import ProgressView from '../components/ProgressView';
import DailyBriefing from '../components/DailyBriefing';
import DashboardWidgets from '../components/DashboardWidgets';
import WidgetSettingsModal from '../components/WidgetSettingsModal';
import HealthCoach from '../components/HealthCoach';
import Expenses from '../components/Expenses';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';

export default function Dashboard() {
  const { currentUser, logout } = useContext(AuthContext);
  const { tasks, currentDate, setCurrentDate, isModalOpen, setIsModalOpen, editingTask, setEditingTask } = useContext(TasksContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWidgetSettingsOpen, setIsWidgetSettingsOpen] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Calculate stats
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const todayTasks = activeTasks.filter(t => t.date === todayStr);
  const overdueTasks = activeTasks.filter(t => t.date < todayStr);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
            {activeTab === 'list' && 'My Tasks'}
            {activeTab === 'calendar' && 'Calendar'}
            {activeTab === 'map' && 'Map'}
            {activeTab === 'progress' && 'Progress'}
            {activeTab === 'briefing' && 'Daily Briefing'}
            {activeTab === 'health' && 'Health Coach'}
            {activeTab === 'expenses' && 'Expenses'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={() => setIsWidgetSettingsOpen(true)} title="Dashboard Settings">
            <Settings size={22} />
          </button>
          <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        logout={logout}
      />

      {/* Main Content Area */}
      <div style={{ paddingBottom: '80px' }}>
        {activeTab === 'list' && (
          <>
            <DashboardWidgets user={currentUser} />
            <TaskList />
          </>
        )}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'map' && <MapLocation />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'briefing' && <DailyBriefing />}
        {activeTab === 'health' && <HealthCoach />}
        {activeTab === 'expenses' && <Expenses />}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
        <Plus size={24} />
      </button>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingTask={editingTask} />

      <WidgetSettingsModal
        isOpen={isWidgetSettingsOpen}
        onClose={() => setIsWidgetSettingsOpen(false)}
        user={currentUser}
      />
    </div>
  );
}
