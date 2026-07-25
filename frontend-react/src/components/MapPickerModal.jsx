import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationClickHook({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPickerModal({ isOpen, onClose, onSelectLocation, initialLat, initialLng }) {
  const defaultCenter = [51.505, -0.09]; // London default
  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (position) {
      onSelectLocation(position[0], position[1]);
    }
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay open" style={{ display: 'flex', zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: 'var(--surface)', width: '90%', maxWidth: '500px', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Select Location</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <MapContainer 
            center={position || defaultCenter} 
            zoom={position ? 15 : 2} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationClickHook setPosition={setPosition} />
            {position && (
              <Marker position={position} />
            )}
          </MapContainer>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
          Tap anywhere on the map to place a pin.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={!position} style={{ flex: 2, padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: position ? 'pointer' : 'not-allowed', opacity: position ? 1 : 0.5 }}>
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
