import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AgentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [shipments, setShipments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    itemDescription: '',
    weight: '',
    originBranchId: user.branchId || '',
    destinationBranchId: '',
    shippingCost: '',
    currency: 'KES',
    paymentMethod: 'prepaid'
  });

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
    try {
      const [shipmentsRes, branchesRes] = await Promise.all([
        axios.get(`${API_URL}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const myShipments = shipmentsRes.data.filter((s) => s.createdBy === user.id);
      setShipments(myShipments);
      setBranches(branchesRes.data);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (shipmentId) => {
    if (!selectedPhoto) return null;
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('photo', selectedPhoto);
    try {
      await axios.post(`${API_URL}/upload/shipment/${shipmentId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return true;
    } catch (error) {
      return null;
    }
  };

  const generateQR = async (shipmentId) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.get(`${API_URL}/qrcode/generate/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('QR code generated');
    } catch (error) {
      alert('Failed to generate QR code');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.post(`${API_URL}/shipments`, form, {
        headers: { Authorization: `Bearer ${token}`, 'user-id': user.id }
      });
      const newShipment = response.data;
      if (selectedPhoto) await uploadPhoto(newShipment.id);
      await generateQR(newShipment.id);
      setShowCreateForm(false);
      setForm({
        senderName: '', senderPhone: '', receiverName: '', receiverPhone: '',
        itemDescription: '', weight: '', originBranchId: user.branchId || '',
        destinationBranchId: '', shippingCost: '', currency: 'KES', paymentMethod: 'prepaid'
      });
      setSelectedPhoto(null);
      setPhotoPreview(null);
      fetchData();
      alert('Shipment created successfully!');
    } catch (error) {
      alert('Failed to create shipment');
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/shipments/${id}/status`, { status, userId: user.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      alert(`Shipment marked as ${status}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      loaded: '#87CEEB',
      in_transit: '#3b82f6',
      arrived: '#8b5cf6',
      delivered: '#10b981'
    };
    return { backgroundColor: colors[status] || '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '10pt', color: 'white', display: 'inline-block' };
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
          <p style={{ color: '#FF8C00', fontSize: '10px', margin: '5px 0 0 0' }}>Agent Portal - {user.name}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '20px' }}>
        <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Create New Shipment'}
        </button>

        {showForm && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #FF8C00', marginBottom: '20px' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Create New Shipment</h3>
            <form onSubmit={handleCreateShipment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input type="text" placeholder="Sender Name" value={form.senderName} onChange={(e) => setForm({...form, senderName: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="text" placeholder="Sender Phone" value={form.senderPhone} onChange={(e) => setForm({...form, senderPhone: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="text" placeholder="Receiver Name" value={form.receiverName} onChange={(e) => setForm({...form, receiverName: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="text" placeholder="Receiver Phone" value={form.receiverPhone} onChange={(e) => setForm({...form, receiverPhone: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="text" placeholder="Item Description" value={form.itemDescription} onChange={(e) => setForm({...form, itemDescription: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="number" placeholder="Weight (kg)" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <select value={form.originBranchId} onChange={(e) => setForm({...form, originBranchId: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="">Origin Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={form.destinationBranchId} onChange={(e) => setForm({...form, destinationBranchId: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="">Destination Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="number" placeholder="Shipping Cost" value={form.shippingCost} onChange={(e) => setForm({...form, shippingCost: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="KES">KES</option><option value="SSP">SSP</option><option value="USD">USD</option>
                </select>
                <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="prepaid">Prepaid</option><option value="cod">Cash on Delivery</option>
                </select>
              </div>
              
              <div style={{ marginTop: '15px', padding: '15px', border: '1px dashed #FF8C00', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Item Photo</label>
                <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} style={{ marginBottom: '10px' }} />
                {photoPreview && <img src={photoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
              </div>
              
              <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Shipment</button>
            </form>
          </div>
        )}

        <h3 style={{ color: '#FF8C00', marginBottom: '10px' }}>My Shipments</h3>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                <th style={{ padding: '10px' }}>Tracking</th>
                <th style={{ padding: '10px' }}>Receiver</th>
                <th style={{ padding: '10px' }}>Destination</th>
                <th style={{ padding: '10px' }}>Weight</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Action</th>
              <tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong style={{ color: '#FF8C00' }}>{s.trackingNumber}</strong></td>
                  <td style={{ padding: '10px' }}>{s.receiverName}<tr>
                  <td style={{ padding: '10px' }}>{s.destinationBranch?.name}</td>
                  <td style={{ padding: '10px' }}>{s.weight} kg</td>
                  <td style={{ padding: '10px' }}><span style={getStatusBadge(s.status)}>{s.status}</span></td>
                  <td style={{ padding: '10px' }}>
                    {s.status === 'pending' && (
                      <button onClick={() => updateStatus(s.id, 'loaded')} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Loaded</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;
