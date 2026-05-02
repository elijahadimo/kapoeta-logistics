import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function AdvancedDriverFeatures() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'oil_change', cost: '', notes: '', odometer: ''
  });
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakForm, setBreakForm] = useState({
    startTime: '', endTime: '', location: '', reason: 'rest'
  });
  const [routeSuggestions, setRouteSuggestions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const tripsRes = await axios.get(`${API_URL}/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myTrips = tripsRes.data.filter((t: any) => t.driverId === user.id);
      setTrips(myTrips);
      
      // Simulate route optimization suggestions
      if (myTrips.length > 0 && myTrips[0].waypoints) {
        const stops = myTrips[0].waypoints.map(w => w.branchName);
        setRouteSuggestions(stops);
      }
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

  const logMaintenance = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/maintenance`, {
        ...maintenanceForm,
        tripId: selectedTrip?.id,
        driverId: user.id,
        reportedAt: new Date().toISOString()
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Maintenance request logged');
      setShowMaintenanceModal(false);
      setMaintenanceForm({ type: 'oil_change', cost: '', notes: '', odometer: '' });
    } catch (error) {
      alert('Failed to log maintenance');
    }
  };

  const logBreak = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/driver-breaks`, {
        ...breakForm,
        tripId: selectedTrip?.id,
        driverId: user.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Break logged');
      setShowBreakModal(false);
      setBreakForm({ startTime: '', endTime: '', location: '', reason: 'rest' });
    } catch (error) {
      alert('Failed to log break');
    }
  };

  if (loading) {
    return <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #FF8C00', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics and Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Driver Advanced Features - {user.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/driver/dashboard')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Advanced Driver Features</h2>

        {/* Route Optimization */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Route Optimization</h3>
          {routeSuggestions.length > 0 ? (
            <div>
              <p><strong>Optimized Route Order:</strong></p>
              <ol style={{ marginLeft: '20px' }}>
                {routeSuggestions.map((stop, idx) => (
                  <li key={idx}>{stop}</li>
                ))}
              </ol>
              <p style={{ marginTop: '10px', fontSize: '10pt', color: '#666' }}>Follow this order for most efficient delivery route.</p>
            </div>
          ) : (
            <p>No active trip with waypoints. Start a trip first.</p>
          )}
        </div>

        {/* Today's Trips */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Today's Trips</h3>
          {trips.length === 0 ? (
            <p>No trips assigned.</p>
          ) : (
            trips.map(trip => (
              <div key={trip.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <p><strong>{trip.tripNumber}</strong> - {trip.departureBranch?.name} to {trip.arrivalBranch?.name}</p>
                <p>Status: {trip.status} | Truck: {trip.truckPlate}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => { setSelectedTrip(trip); setShowMaintenanceModal(true); }} style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Request Maintenance</button>
                  <button onClick={() => { setSelectedTrip(trip); setShowBreakModal(true); }} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Log Break</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vehicle Status */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Vehicle Status</h3>
          <p><strong>Last Service:</strong> 15,000 km</p>
          <p><strong>Next Service Due:</strong> 20,000 km</p>
          <p><strong>Current Odometer:</strong> 18,500 km</p>
          <p><strong>Service Due In:</strong> 1,500 km</p>
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '10px' }}>
            <div style={{ width: '70%', height: '10px', backgroundColor: '#FF8C00', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Request Maintenance</h3>
            <p>Trip: {selectedTrip.tripNumber}</p>
            <select value={maintenanceForm.type} onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
              <option value="oil_change">Oil Change</option>
              <option value="tyre_rotation">Tyre Rotation</option>
              <option value="brake_check">Brake Check</option>
              <option value="engine_issue">Engine Issue</option>
              <option value="other">Other</option>
            </select>
            <input type="text" placeholder="Estimated Cost (Optional)" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="number" placeholder="Current Odometer (km)" value={maintenanceForm.odometer} onChange={(e) => setMaintenanceForm({...maintenanceForm, odometer: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <textarea placeholder="Notes" value={maintenanceForm.notes} onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={logMaintenance} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Request</button>
              <button onClick={() => setShowMaintenanceModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Break Modal */}
      {showBreakModal && selectedTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Log Break / Stop</h3>
            <p>Trip: {selectedTrip.tripNumber}</p>
            <input type="datetime-local" placeholder="Start Time" value={breakForm.startTime} onChange={(e) => setBreakForm({...breakForm, startTime: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="datetime-local" placeholder="End Time" value={breakForm.endTime} onChange={(e) => setBreakForm({...breakForm, endTime: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="text" placeholder="Location" value={breakForm.location} onChange={(e) => setBreakForm({...breakForm, location: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <select value={breakForm.reason} onChange={(e) => setBreakForm({...breakForm, reason: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
              <option value="rest">Rest Break</option>
              <option value="meal">Meal Break</option>
              <option value="fuel">Fuel Stop</option>
              <option value="maintenance">Maintenance</option>
              <option value="traffic">Traffic Delay</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={logBreak} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Log Break</button>
              <button onClick={() => setShowBreakModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedDriverFeatures;
