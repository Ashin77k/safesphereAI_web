import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Emergency, MissingPerson, LocationHistory } from '../types';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dotIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:rgba(255,255,255,0.5);width:8px;height:8px;border-radius:50%;border:1px solid white;'></div>",
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

interface MapProps {
  emergencies: Emergency[];
  missingPersons: MissingPerson[];
  locationHistory: LocationHistory[];
  selectedId?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

export const MapView: React.FC<MapProps> = ({ emergencies, missingPersons, locationHistory, selectedId }) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  
  const selectedItem = [...emergencies, ...missingPersons].find(i => i.id === selectedId);
  
  // Get history for selected item
  const selectedHistory = locationHistory
    .filter(h => h.parentId === selectedId)
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

  // Determine current position (latest from history or initial report)
  const getCurrentPos = (item: Emergency | MissingPerson) => {
    const itemHistory = locationHistory
      .filter(h => h.parentId === item.id)
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    
    if (itemHistory.length > 0) {
      return [itemHistory[0].location.lat, itemHistory[0].location.lng] as [number, number];
    }
    
    return ('location' in item ? [item.location.lat, item.location.lng] : [item.lastSeenLocation.lat, item.lastSeenLocation.lng]) as [number, number];
  };

  const center = selectedItem ? getCurrentPos(selectedItem) : defaultCenter;

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom={true} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {selectedId && <ChangeView center={center} />}
      
      {/* Render History Trails for all active items */}
      {[...emergencies, ...missingPersons].map(item => {
        const itemHistory = locationHistory
          .filter(h => h.parentId === item.id)
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        
        if (itemHistory.length < 1) return null;

        const initialPos = 'location' in item 
          ? [item.location.lat, item.location.lng] 
          : [item.lastSeenLocation.lat, item.lastSeenLocation.lng];
        
        const path = [initialPos as [number, number], ...itemHistory.map(h => [h.location.lat, h.location.lng] as [number, number])];

        return (
          <React.Fragment key={`trail-${item.id}`}>
            <Polyline 
              positions={path} 
              color={selectedId === item.id ? ('location' in item ? '#ff4444' : '#ffcc00') : '#ffffff40'} 
              weight={selectedId === item.id ? 4 : 2}
              dashArray={selectedId === item.id ? undefined : "5, 10"}
            />
            {itemHistory.map((h, idx) => (
              <Marker 
                key={`dot-${h.id}`} 
                position={[h.location.lat, h.location.lng]} 
                icon={dotIcon}
              >
                <Popup>
                  <p className="text-[10px] font-bold">Update at {h.timestamp.toDate().toLocaleTimeString()}</p>
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        );
      })}

      {emergencies.map((emergency) => (
        <Marker 
          key={emergency.id} 
          position={getCurrentPos(emergency)} 
          icon={redIcon}
        >
          <Popup className="dark-popup">
            <div className="p-2">
              <h3 className="font-bold text-red-500">EMERGENCY</h3>
              <p className="text-sm">User: {emergency.userName || emergency.userId}</p>
              <p className="text-xs opacity-70">Reported: {emergency.timestamp.toDate().toLocaleString()}</p>
              <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase">Live Tracking Active</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {missingPersons.map((person) => (
        <Marker 
          key={person.id} 
          position={getCurrentPos(person)} 
          icon={yellowIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-yellow-500">MISSING PERSON</h3>
              <p className="text-sm">Name: {person.name}</p>
              <p className="text-xs opacity-70">Last Seen: {person.timestamp.toDate().toLocaleString()}</p>
              <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase">Live Tracking Active</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
