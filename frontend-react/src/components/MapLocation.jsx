import React, { useContext, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TasksContext } from '../context/TasksContext';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map
function MapBounds({ tasks }) {
  const map = useMap();
  useEffect(() => {
    const locations = tasks.filter(t => t.locationLat && t.locationLng);
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(t => [t.locationLat, t.locationLng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [tasks, map]);
  return null;
}

export default function MapLocation() {
  const { tasks } = useContext(TasksContext);
  const locationTasks = tasks.filter(t => t.locationLat && t.locationLng);

  const defaultCenter = [51.505, -0.09]; // London by default if no tasks

  return (
    <div style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
      <MapContainer 
        center={locationTasks.length > 0 ? [locationTasks[0].locationLat, locationTasks[0].locationLng] : defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds tasks={locationTasks} />
        
        {locationTasks.map(task => (
          <Marker key={task.id} position={[task.locationLat, task.locationLng]}>
            <Popup>
              <strong>{task.text}</strong><br />
              {task.date}<br />
              Status: {task.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
