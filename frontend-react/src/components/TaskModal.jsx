import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, MapPin } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';
import { getCurrentPosition } from '../utils/capacitor';
import MapPickerModal from './MapPickerModal';

export default function TaskModal({ isOpen, onClose, editingTask }) {
  const { addTask, updateTask } = useContext(TasksContext);
  
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [status, setStatus] = useState('not_started');
  const [progress, setProgress] = useState(0);
  const [routineType, setRoutineType] = useState('none');
  const [etaDate, setEtaDate] = useState('');
  
  const [locationText, setLocationText] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const handleGetLocation = async () => {
    setGettingLocation(true);
    const coords = await getCurrentPosition();
    if (coords) {
      setLocationLat(coords.lat);
      setLocationLng(coords.lng);
      setLocationText(`Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    } else {
      alert("Could not get location. Ensure GPS is enabled and permissions are granted.");
    }
    setGettingLocation(false);
  };

  const handleMapSelect = (lat, lng) => {
    setLocationLat(lat);
    setLocationLng(lng);
    setLocationText(`Selected Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setText(editingTask.text || '');
        setDate(editingTask.date || '');
        setPriority(editingTask.priority || 'medium');
        setCategory(editingTask.category || 'personal');
        setStatus(editingTask.status || 'not_started');
        setProgress(editingTask.progress || 0);
        setRoutineType(editingTask.routineType || 'none');
        setEtaDate(editingTask.etaDate || '');
        setLocationText(editingTask.locationText || '');
        setLocationLat(editingTask.locationLat || '');
        setLocationLng(editingTask.locationLng || '');
      } else {
        // Reset form for new task
        setText('');
        setDate(new Date().toISOString().slice(0, 10));
        setPriority('medium');
        setCategory('personal');
        setStatus('not_started');
        setProgress(0);
        setRoutineType('none');
        setEtaDate('');
        setLocationText('');
        setLocationLat('');
        setLocationLng('');
      }
    }
  }, [isOpen, editingTask]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const taskData = {
      text,
      date,
      priority,
      category,
      status,
      routineType,
      progress: status === 'in_progress' ? parseInt(progress) : 0,
      etaDate: etaDate || null,
      locationText: locationText || null,
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      assignedTo: [] // Omitting team assign functionality for now to simplify
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      onClose();
    } catch (err) {
      alert('Error saving task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay open" style={{ display: 'flex', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: 'var(--surface)', width: '90%', maxWidth: '500px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>What do you need to do?</label>
            <input type="text" required value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} placeholder="e.g., Buy groceries" />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {status === 'in_progress' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Progress: <strong>{progress}%</strong></label>
              <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(e.target.value)} style={{ width: '100%' }} />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={locationText} 
                onChange={e => setLocationText(e.target.value)} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} 
                placeholder="Where?" 
              />
              <button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={gettingLocation}
                style={{ padding: '0 12px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Use Current GPS Location"
              >
                {gettingLocation ? '...' : 'GPS'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsMapPickerOpen(true)} 
                style={{ padding: '0 12px', background: locationLat ? 'var(--status-completed-bg)' : 'var(--bg)', color: locationLat ? 'var(--status-completed)' : 'var(--text)', border: `1px solid ${locationLat ? 'var(--status-completed)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Pick on Map"
              >
                <MapPin size={18} />
                {locationLat ? 'Pinned' : 'Map'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Repeat Routine</label>
              <select value={routineType} onChange={e => setRoutineType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target ETA Date</label>
              <input type="date" value={etaDate} onChange={e => setEtaDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
      
      <MapPickerModal 
        isOpen={isMapPickerOpen} 
        onClose={() => setIsMapPickerOpen(false)} 
        onSelectLocation={handleMapSelect}
        initialLat={locationLat ? parseFloat(locationLat) : null}
        initialLng={locationLng ? parseFloat(locationLng) : null}
      />
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
