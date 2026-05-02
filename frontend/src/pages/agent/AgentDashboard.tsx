import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AgentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/shipments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myShipments = response.data.filter((s: any) => s.createdBy === user.id);
      setShipments(myShipments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#87CEEB', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '15px 20px', borderBottom: '2px solid #FF8C00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FF8C00', fontSize: '18px', margin: 0 }}>Kapoeta Logistics and Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12px', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          <p style={{ color: '#FF8C00', fontSize: '10px', margin: '5px 0 0 0' }}>Agent Portal</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#1a1a2e' }}>My Shipments</h2>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto', marginTop: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tracking Number</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Receiver Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{s.trackingNumber}</td>
                  <td style={{ padding: '10px' }}>{s.receiverName}</td>
                  <td style={{ padding: '10px' }}>{s.status}</td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '20px', textAlign: 'center' }}>No shipments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;
