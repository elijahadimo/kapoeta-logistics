import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

function DriverDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [pastTrips, setPastTrips] = useState([]);
  const [incidents, setIncidents] = useState([]);
  
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null });
  
  const [fuelForm, setFuelForm] = useState({
    amountLiters: '', costPerLiter: '', location: '', odometerReading: ''
  });
  
  const [incidentForm, setIncidentForm] = useState({
    type: 'damage', severity: 'medium', description: ''
  });
  
  const [locationForm, setLocationForm] = useState({
    latitude: '', longitude: ''
  });
  
  const watchIdRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAllData();
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getStopBranchName = (trip, shipment) => {
    const stop = trip.waypoints?.find(w => w.shipments?.some(s => s.trackingNumber === shipment.trackingNumber));
    return stop?.branchName || 'Unknown';
  };

  const fetchAllData = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const [tripsRes, incidentsRes] = await Promise.all([
        axios.get(`${API_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/incidents`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      
      const myTrips = tripsRes.data.filter((t: any) => t.driverId === user.id);
      const current = myTrips.find((t: any) => t.status === 'in_transit');
      const past = myTrips.filter((t: any) => t.status === 'completed');
      const myIncidents = incidentsRes.data.filter((i: any) => i.reportedBy === user.id);
      
      setTrips(myTrips);
      setCurrentTrip(current);
      setPastTrips(past);
      setIncidents(myIncidents);
      
      if (current && current.status === 'in_transit') {
        startLiveTracking();
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

  const startLiveTracking = () => {
    setTrackingActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        if (currentTrip) {
          updateLocationOnServer(currentTrip.id, latitude, longitude, speed);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        interval: 10000,
        timeout: 15000
      }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
  };

  const updateLocationOnServer = async (tripId, lat, lng, speed) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/trips/${tripId}/location`, {
        latitude: lat,
        longitude: lng,
        speed: speed || 0
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error('Location update failed:', error);
    }
  };

  const manualLocationUpdate = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/trips/${selectedTrip.id}/location`, {
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude)
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Location updated');
      setShowLocationModal(false);
      setLocationForm({ latitude: '', longitude: '' });
      fetchAllData();
    } catch (error) {
      alert('Failed to update location');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationForm({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
      }, () => {
        alert('Unable to get location');
      });
    } else {
      alert('Geolocation not supported');
    }
  };

  const updateTripStatus = async (tripId, status) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/trips/${tripId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (status === 'in_transit') {
        startLiveTracking();
      } else if (status === 'completed') {
        stopLiveTracking();
      }
      
      alert(`Trip marked as ${status}`);
      fetchAllData();
    } catch (error) {
      alert('Failed to update trip status');
    }
  };

  const advanceToNextStop = async (tripId) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/trips/${tripId}/next-stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Advanced to next stop');
      fetchAllData();
    } catch (error) {
      alert('Failed to advance');
    }
  };

  const logFuel = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/fuel-logs`, {
        ...fuelForm,
        tripId: selectedTrip.id,
        totalCost: parseFloat(fuelForm.amountLiters) * parseFloat(fuelForm.costPerLiter),
        currency: 'KES',
        loggedBy: user.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Fuel logged successfully');
      setShowFuelModal(false);
      setFuelForm({ amountLiters: '', costPerLiter: '', location: '', odometerReading: '' });
      fetchAllData();
    } catch (error) {
      alert('Failed to log fuel');
    }
  };

  const reportIncident = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/incidents`, {
        ...incidentForm,
        tripId: selectedTrip.id,
        reportedBy: user.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Incident reported');
      setShowIncidentModal(false);
      setIncidentForm({ type: 'damage', severity: 'medium', description: '' });
      fetchAllData();
    } catch (error) {
      alert('Failed to report incident');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      planned: '#f59e0b',
      in_transit: '#3b82f6',
      completed: '#10b981',
      delayed: '#ef4444',
      cancelled: '#6b7280'
    };
    return { backgroundColor: colors[status] || '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '10pt', color: 'white', display: 'inline-block' };
  };

  const getSeverityColor = (severity) => {
    const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
    return colors[severity] || '#6b7280';
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
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Driver Portal - {user.name}</p>
        </div>
        <div>
          <Link to="/driver/advanced" style={{ padding: '8px 16px', backgroundColor: '#87CEEB', color: '#000', border: '1px solid #FF8C00', borderRadius: '4px', textDecoration: 'none', marginRight: '10px' }}>Advanced Features</Link>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Tracking Status Bar */}
      {trackingActive && currentLocation.lat && (
        <div style={{ backgroundColor: '#10b981', color: '#FFFFFF', padding: '8px 20px', textAlign: 'center', fontSize: '11pt' }}>
          Live Tracking Active | Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderBottom: '1px solid #FF8C00', padding: '0 20px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('current')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'current' ? '#FF8C00' : 'transparent', color: activeTab === 'current' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Current Trip</button>
        <button onClick={() => setActiveTab('history')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'history' ? '#FF8C00' : 'transparent', color: activeTab === 'history' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Trip History</button>
        <button onClick={() => setActiveTab('incidents')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'incidents' ? '#FF8C00' : 'transparent', color: activeTab === 'incidents' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>My Incidents</button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px' }}>
        
        {/* CURRENT TRIP TAB */}
        {activeTab === 'current' && (
          <div>
            {!currentTrip ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
                <p>No active trip assigned.</p>
                <p style={{ fontSize: '10pt', color: '#666' }}>Check back later or contact your dispatcher.</p>
              </div>
            ) : (
              <div>
                {/* Trip Details Card */}
                <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ color: '#FF8C00', margin: 0 }}>{currentTrip.tripNumber}</h3>
                      <p style={{ margin: '5px 0' }}><strong>Truck:</strong> {currentTrip.truckPlate}</p>
                      <p style={{ margin: '5px 0' }}><strong>Route:</strong> {currentTrip.departureBranch?.name} → {currentTrip.arrivalBranch?.name}</p>
                      <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={getStatusBadge(currentTrip.status)}>{currentTrip.status}</span></p>
                    </div>
                    <div>
                      {currentTrip.status === 'planned' && (
                        <button onClick={() => updateTripStatus(currentTrip.id, 'in_transit')} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Start Journey</button>
                      )}
                      {currentTrip.status === 'in_transit' && (
                        <button onClick={() => updateTripStatus(currentTrip.id, 'completed')} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Complete Journey</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Waypoints / Stops Section */}
                {currentTrip.waypoints && currentTrip.waypoints.length > 0 && (
                  <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
                    <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Delivery Stops</h3>
                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                      {currentTrip.waypoints.map((stop, idx) => (
                        <div key={idx} style={{ marginBottom: '20px', position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-20px',
                            top: '0',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: idx === (currentTrip.currentStopIndex || 0) ? '#FF8C00' : '#10b981',
                            border: '2px solid #FF8C00'
                          }}></div>
                          <div style={{ marginLeft: '15px' }}>
                            <strong>{stop.branchName}</strong>
                            <p style={{ margin: '5px 0 0 0', fontSize: '10pt', color: '#666' }}>{stop.shipmentCount} shipments to deliver</p>
                            {idx === (currentTrip.currentStopIndex || 0) && (
                              <button onClick={() => advanceToNextStop(currentTrip.id)} style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10pt' }}>
                                Mark Stop Completed
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <button onClick={() => { setSelectedTrip(currentTrip); setShowLocationModal(true); }} style={{ padding: '12px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer', fontSize: '12pt' }}>
                    Update Location
                  </button>
                  <button onClick={() => { setSelectedTrip(currentTrip); setShowFuelModal(true); }} style={{ padding: '12px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer', fontSize: '12pt' }}>
                    Log Fuel
                  </button>
                  <button onClick={() => { setSelectedTrip(currentTrip); setShowIncidentModal(true); }} style={{ padding: '12px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12pt' }}>
                    Report Incident
                  </button>
                </div>

                {/* Current Manifest */}
                <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Current Load Manifest</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Tracking</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Receiver</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Destination</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTrip.waypoints?.flatMap(stop => stop.shipments || []).map((shipment, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}><strong style={{ color: '#FF8C00' }}>{shipment.trackingNumber}</strong></td>
                            <td style={{ padding: '8px' }}>{shipment.receiverName}</td>
                            <td style={{ padding: '8px' }}>{getStopBranchName(currentTrip, shipment)}</td>
                            <td style={{ padding: '8px' }}>{shipment.weight} kg</td>
                          </tr>
                        ))}
                        {(!currentTrip.waypoints || currentTrip.waypoints.length === 0) && (
                          <tr>
                            <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No shipments on this trip</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRIP HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>Past Trips</h2>
            {pastTrips.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>No past trips</div>
            ) : (
              pastTrips.map(trip => (
                <div key={trip.id} style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #FF8C00' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <p><strong>{trip.tripNumber}</strong></p>
                      <p style={{ margin: '5px 0', fontSize: '10pt' }}>{trip.departureBranch?.name} → {trip.arrivalBranch?.name}</p>
                      <p style={{ margin: '5px 0', fontSize: '10pt' }}>Truck: {trip.truckPlate}</p>
                      <p style={{ margin: '5px 0', fontSize: '10pt' }}>Completed: {new Date(trip.completedAt || trip.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <span style={getStatusBadge(trip.status)}>Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>My Incident Reports</h2>
            {incidents.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>No incidents reported</div>
            ) : (
              incidents.map(inc => (
                <div key={inc.id} style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: `4px solid ${getSeverityColor(inc.severity)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <p><strong>{inc.incidentNumber}</strong> - {inc.type}</p>
                      <p style={{ margin: '5px 0', fontSize: '10pt' }}>{inc.description}</p>
                      <p style={{ margin: '5px 0', fontSize: '10pt', color: '#666' }}>Reported: {new Date(inc.createdAt).toLocaleString()}</p>
                    </div>
                    <span style={{ backgroundColor: getSeverityColor(inc.severity), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{inc.severity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* LOCATION MODAL */}
      {showLocationModal && selectedTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Update Location</h3>
            <p>Trip: {selectedTrip.tripNumber}</p>
            <button onClick={getCurrentLocation} style={{ marginBottom: '15px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Get Current Location</button>
            <input type="text" placeholder="Latitude" value={locationForm.latitude} onChange={(e) => setLocationForm({...locationForm, latitude: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="text" placeholder="Longitude" value={locationForm.longitude} onChange={(e) => setLocationForm({...locationForm, longitude: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={manualLocationUpdate} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowLocationModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FUEL MODAL */}
      {showFuelModal && selectedTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Log Fuel</h3>
            <p>Trip: {selectedTrip.tripNumber}</p>
            <input type="number" placeholder="Liters" value={fuelForm.amountLiters} onChange={(e) => setFuelForm({...fuelForm, amountLiters: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="number" placeholder="Cost per Liter" value={fuelForm.costPerLiter} onChange={(e) => setFuelForm({...fuelForm, costPerLiter: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="text" placeholder="Location" value={fuelForm.location} onChange={(e) => setFuelForm({...fuelForm, location: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <input type="number" placeholder="Odometer (km)" value={fuelForm.odometerReading} onChange={(e) => setFuelForm({...fuelForm, odometerReading: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={logFuel} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowFuelModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT MODAL */}
      {showIncidentModal && selectedTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Report Incident</h3>
            <p>Trip: {selectedTrip.tripNumber}</p>
            <select value={incidentForm.type} onChange={(e) => setIncidentForm({...incidentForm, type: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
              <option value="damage">Damage</option>
              <option value="accident">Accident</option>
              <option value="theft">Theft</option>
              <option value="loss">Loss</option>
              <option value="delay">Delay</option>
            </select>
            <select value={incidentForm.severity} onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <textarea placeholder="Description" value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} rows={4} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={reportIncident} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Report</button>
              <button onClick={() => setShowIncidentModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
