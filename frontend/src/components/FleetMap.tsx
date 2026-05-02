import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Vehicle {
  driverId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number;
  truckPlate?: string;
  driverName?: string;
  destination?: string;
  eta?: string;
  timestamp: string;
}

interface FleetMapProps {
  vehicles?: Vehicle[];
  center?: [number, number];
  zoom?: number;
  onVehicleClick?: (vehicle: Vehicle) => void;
  selectedVehicle?: string | null;
}

function FleetMap({ vehicles = [], center = [-1.2921, 36.8219], zoom = 6, onVehicleClick, selectedVehicle }: FleetMapProps) {
  const [mapVehicles, setMapVehicles] = useState<Vehicle[]>(vehicles);

  useEffect(() => {
    setMapVehicles(vehicles);
  }, [vehicles]);

  // Calculate route between two points (simplified)
  const calculateRoute = (start: [number, number], end: [number, number]): [number, number][] => {
    return [start, end];
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {mapVehicles.map((vehicle) => (
        <Marker
          key={vehicle.tripId}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={truckIcon}
          eventHandlers={{
            click: () => onVehicleClick && onVehicleClick(vehicle),
          }}
        >
          <Popup>
            <div style={{ fontSize: '12px' }}>
              <strong>Truck:</strong> {vehicle.truckPlate || 'Unknown'}<br />
              <strong>Driver:</strong> {vehicle.driverName || 'Unknown'}<br />
              <strong>Speed:</strong> {vehicle.speed || 0} km/h<br />
              <strong>Destination:</strong> {vehicle.destination || 'Unknown'}<br />
              <strong>ETA:</strong> {vehicle.eta || 'Calculating...'}<br />
              <strong>Last Update:</strong> {new Date(vehicle.timestamp).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default FleetMap;
