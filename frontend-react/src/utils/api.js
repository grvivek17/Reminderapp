const API_BASE = 'http://140.245.215.103:8080/api'; // Or use env variables

export const api = async (path, options = {}) => {
  const authToken = localStorage.getItem('reminder_app_token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    
    if (res.status === 401) {
      if (!path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
        localStorage.removeItem('reminder_app_token');
        localStorage.removeItem('reminder_app_user');
        window.dispatchEvent(new Event('auth-expired'));
      }
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
