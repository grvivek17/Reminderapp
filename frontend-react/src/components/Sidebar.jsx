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
