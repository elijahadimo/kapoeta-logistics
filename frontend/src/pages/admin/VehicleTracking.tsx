import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
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

// Branch icons with correct colors
const branchIcons = {
  hq: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  border: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  city: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  local: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

// CORRECT BRANCH COORDINATES - all 6 branches
const branchLocations = {
  'Nairobi': { lat: -1.2921, lng: 36.8219, type: 'hq', name: 'Nairobi', location: 'Nairobi, Kenya', hasAgent: true },
  'Nadapal': { lat: 4.4051, lng: 34.2837, type: 'border', name: 'Nadapal', location: 'Nadapal Border, Kenya/South Sudan', hasAgent: false },
  'Narus': { lat: 4.5020, lng: 34.1633, type: 'local', name: 'Narus', location: 'Narus, South Sudan', hasAgent: false },
  'Kapoeta': { lat: 4.7667, lng: 33.5833, type: 'local', name: 'Kapoeta', location: 'Kapoeta, South Sudan', hasAgent: true },
  'Torit': { lat: 4.4167, lng: 32.5667, type: 'local', name: 'Torit', location: 'Torit, South Sudan', hasAgent: false },
  'Juba': { lat: 4.8517, lng: 31.5825, type: 'city', name: 'Juba', location: 'Juba, South Sudan', hasAgent: true },
};

// Component to fit bounds to show all branches
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = Object.values(branchLocations).map(loc => [loc.lat, loc.lng]);
    map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
  }, [map]);
  return null;
}

const API_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

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
  shipmentCount?: number;
  codAmount?: number;
  timestamp: string;
}

function VehicleTracking() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to tracking server');
      newSocket.emit('request-fleet-locations');
    });
    
    newSocket.on('fleet-update', (data: Vehicle) => {
      setVehicles(prev => {
        const index = prev.findIndex(v => v.tripId === data.tripId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        }
        return [...prev, data];
      });
    });
    
    fetchData();
    
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const tripsRes = await axios.get(`${API_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } });
      
      const activeTrips = tripsRes.data.filter((t: any) => t.status === 'in_transit');
      const vehicleData: Vehicle[] = activeTrips.map((trip: any) => ({
        driverId: trip.driverId,
        tripId: trip.id,
        latitude: trip.currentLatitude || branchLocations[trip.departureBranch?.name]?.lat || -1.2921,
        longitude: trip.currentLongitude || branchLocations[trip.departureBranch?.name]?.lng || 36.8219,
        speed: 0,
        truckPlate: trip.truckPlate,
        driverName: trip.driver?.name,
        destination: trip.arrivalBranch?.name,
        shipmentCount: trip.currentItems || 0,
        timestamp: new Date().toISOString(),
      }));
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getBranchIcon = (type: string) => {
    switch(type) {
      case 'hq': return branchIcons.hq;
      case 'border': return branchIcons.border;
      case 'city': return branchIcons.city;
      default: return branchIcons.local;
    }
  };

  if (loading) {
    return <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>Loading map...</div>;
  }

  // Calculate center to show all branches
  const allLats = Object.values(branchLocations).map(loc => loc.lat);
  const allLngs = Object.values(branchLocations).map(loc => loc.lng);
  const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
  const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;

  return (
    <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #FF8C00', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics and Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Vehicle Tracking - {user.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Live Vehicle Tracking - Nairobi to Juba Corridor</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          {/* Map Section */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '8px', border: '1px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Fleet Map (Zoom & Pan)</h3>
            <MapContainer 
              center={[centerLat, centerLng]} 
              zoom={6} 
              style={{ height: '550px', width: '100%', borderRadius: '8px' }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Show all branch locations with correct coordinates */}
              {Object.values(branchLocations).map((branch, idx) => (
                <Marker
                  key={idx}
                  position={[branch.lat, branch.lng]}
                  icon={getBranchIcon(branch.type)}
                >
                  <Popup>
                    <div style={{ fontSize: '12px' }}>
                      <strong>{branch.name}</strong><br />
                      {branch.location}<br />
                      {branch.hasAgent ? '✓ Agent available' : 'Driver operated'}<br />
                      📍 {branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Show active vehicles */}
              {vehicles.map((vehicle) => (
                <Marker
                  key={vehicle.tripId}
                  position={[vehicle.latitude, vehicle.longitude]}
                  icon={truckIcon}
                  eventHandlers={{
                    click: () => setSelectedVehicle(vehicle),
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: '12px' }}>
                      <strong>Truck:</strong> {vehicle.truckPlate || 'Unknown'}<br />
                      <strong>Driver:</strong> {vehicle.driverName || 'Unknown'}<br />
                      <strong>Speed:</strong> {vehicle.speed || 0} km/h<br />
                      <strong>Destination:</strong> {vehicle.destination || 'Unknown'}<br />
                      <strong>Shipments:</strong> {vehicle.shipmentCount || 0}<br />
                      <strong>Last Update:</strong> {new Date(vehicle.timestamp).toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <FitBounds />
            </MapContainer>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap', fontSize: '10pt' }}>
              <span>🔴 Red: Headquarters (Nairobi)</span>
              <span>🟡 Yellow: Border Post (Nadapal)</span>
              <span>🟢 Green: Local Branches (Narus, Kapoeta, Torit)</span>
              <span>🔵 Blue: City Branch (Juba)</span>
              <span>🟠 Orange: Active Vehicles</span>
            </div>
          </div>
          
          {/* Vehicle List Section */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '8px', border: '1px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Active Vehicles ({vehicles.length})</h3>
            <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {vehicles.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No active vehicles on the road</p>
              ) : (
                vehicles.map(vehicle => (
                  <div 
                    key={vehicle.tripId} 
                    onClick={() => setSelectedVehicle(vehicle)}
                    style={{ 
                      padding: '10px', 
                      marginBottom: '10px', 
                      border: `1px solid ${selectedVehicle?.tripId === vehicle.tripId ? '#FF8C00' : '#ddd'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedVehicle?.tripId === vehicle.tripId ? '#FFF3E0' : 'white'
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 'bold' }}>🚚 {vehicle.truckPlate || 'Unknown'}</p>
                    <p style={{ margin: '5px 0', fontSize: '10pt' }}>Driver: {vehicle.driverName || 'Unknown'}</p>
                    <p style={{ margin: '5px 0', fontSize: '10pt' }}>Speed: {vehicle.speed || 0} km/h</p>
                    <p style={{ margin: '5px 0', fontSize: '10pt' }}>Destination: {vehicle.destination || 'Unknown'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Selected Vehicle Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p><strong>Truck Plate:</strong> {selectedVehicle.truckPlate || 'Unknown'}</p>
                <p><strong>Driver:</strong> {selectedVehicle.driverName || 'Unknown'}</p>
                <p><strong>Destination:</strong> {selectedVehicle.destination || 'Unknown'}</p>
                <p><strong>Current Speed:</strong> {selectedVehicle.speed || 0} km/h</p>
              </div>
              <div>
                <p><strong>Location:</strong> {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}</p>
                <p><strong>Last Update:</strong> {new Date(selectedVehicle.timestamp).toLocaleString()}</p>
                <p><strong>Shipments:</strong> {selectedVehicle.shipmentCount || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleTracking;
