import React from 'react';
import { LogOut, Calendar, List, Map as MapIcon, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab, currentUser, logout }) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-user-info">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <strong>{currentUser?.name || 'User'}</strong>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{currentUser?.email}</div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div 
            className={`sidebar-item ${activeTab === 'list' ? 'active' : ''}`} 
            onClick={() => handleTabClick('list')}
          >
            <List size={20} />
            <span>List</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`} 
            onClick={() => handleTabClick('calendar')}
          >
            <Calendar size={20} />
            <span>Calendar</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'map' ? 'active' : ''}`} 
            onClick={() => handleTabClick('map')}
          >
            <MapIcon size={20} />
            <span>Map</span>
          </div>

          <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)' }} />

          <div 
            className={`sidebar-item ${activeTab === 'briefing' ? 'active' : ''}`} 
            onClick={() => handleTabClick('briefing')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
            <span>Daily Briefing</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'health' ? 'active' : ''}`} 
            onClick={() => handleTabClick('health')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>Health Coach</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'expenses' ? 'active' : ''}`} 
            onClick={() => handleTabClick('expenses')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Expenses</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-item logout" onClick={logout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </div>
        </div>
      </div>
    </>
  );
}
