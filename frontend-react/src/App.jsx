import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { TasksProvider } from './context/TasksContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <TasksProvider>
      <Dashboard />
    </TasksProvider>
  );
}

export default App;
