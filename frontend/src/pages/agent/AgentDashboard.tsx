import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CrewForm from '../../components/CrewForm';

const API_URL = 'http://localhost:3000';

function AgentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  
  const [shipments, setShipments] = useState([]);
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [transitVehicles, setTransitVehicles] = useState([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showTransitModal, setShowTransitModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [crewType, setCrewType] = useState('loading');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentQRCode, setCurrentQRCode] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('my');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [createForm, setCreateForm] = useState({
    senderName: '', senderPhone: '', receiverName: '', receiverPhone: '',
    itemDescription: '', weight: '', originBranchId: user.branchId || '',
    destinationBranchId: '', shippingCost: '',
    currency: 'KES', paymentMethod: 'prepaid'
  });
  
  const [dispatchForm, setDispatchForm] = useState({
    truckPlate: '', driverId: '', arrivalBranchId: '', maxWeight: 1000, maxItems: 50, loadingFee: 0
  });
  
  const [transitForm, setTransitForm] = useState({ selectedShipments: [], loadingFee: 0 });
  const [unloadingForm, setUnloadingForm] = useState({ shipmentId: '', unloadingFee: 0 });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const [shipmentsRes, branchesRes, driversRes, transitRes] = await Promise.all([
        axios.get(`${API_URL}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/users?role=driver`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/trips/available?branchId=${user.branchId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      
      const myShipments = shipmentsRes.data.filter((s: any) => s.createdBy === user.id);
      const incoming = shipmentsRes.data.filter((s: any) => s.destinationBranchId === user.branchId && s.status !== 'delivered');
      
      setShipments(myShipments);
      setIncomingShipments(incoming);
      setBranches(branchesRes.data);
      setDrivers(driversRes.data.filter((d: any) => d.role === 'driver'));
      setTransitVehicles(transitRes.data);
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      alert('Cannot access camera. Please check permissions or use file upload.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], `camera_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
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
      const response = await axios.post(`${API_URL}/upload/shipment/${shipmentId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return response.data.photoUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return null;
    }
  };

  const generateQR = async (shipmentId) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/qrcode/generate/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentQRCode(response.data.qrCode);
      setShowQRModal(true);
    } catch (error) {
      alert('Failed to generate QR code');
    }
  };

  const printReceipt = async (shipmentId, type) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/receipts/${type}/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentReceipt(response.data);
      setShowReceiptModal(true);
    } catch (error) {
      alert('Failed to generate receipt');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.post(`${API_URL}/shipments`, createForm, {
        headers: { Authorization: `Bearer ${token}`, 'user-id': user.id }
      });
      const newShipment = response.data;
      if (selectedPhoto) await uploadPhoto(newShipment.id);
      await generateQR(newShipment.id);
      setShowCreateForm(false);
      setCreateForm({
        senderName: '', senderPhone: '', receiverName: '', receiverPhone: '',
        itemDescription: '', weight: '', originBranchId: user.branchId || '',
        destinationBranchId: '', shippingCost: '',
        currency: 'KES', paymentMethod: 'prepaid'
      });
      setSelectedPhoto(null);
      setPhotoPreview(null);
      fetchAllData();
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
      if (status === 'arrived') {
        setUnloadingForm({ shipmentId: id, unloadingFee: 0 });
        setCrewType('unloading');
        setShowCrewForm(true);
      }
      fetchAllData();
      alert(`Shipment marked as ${status}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const toggleShipmentSelection = (id) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter(sid => sid !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleDispatchSave = async (crewMembers) => {
    const token = localStorage.getItem('access_token');
    try {
      const tripResponse = await axios.post(`${API_URL}/trips/from-loaded`, {
        departureBranchId: user.branchId,
        arrivalBranchId: dispatchForm.arrivalBranchId,
        truckPlate: dispatchForm.truckPlate,
        driverId: dispatchForm.driverId,
        shipmentIds: selectedShipmentIds,
        maxWeight: dispatchForm.maxWeight,
        maxItems: dispatchForm.maxItems
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      const tripId = tripResponse.data.id;
      
      for (const crew of crewMembers) {
        await axios.post(`${API_URL}/crew`, {
          ...crew,
          tripId: tripId,
          type: 'loading',
          amount: parseFloat(crew.amount) || 0
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      alert('Trip created and dispatched with crew!');
      setShowDispatchModal(false);
      setShowCrewForm(false);
      setSelectedShipmentIds([]);
      setDispatchForm({ truckPlate: '', driverId: '', arrivalBranchId: '', maxWeight: 1000, maxItems: 50, loadingFee: 0 });
      fetchAllData();
    } catch (error) {
      alert('Failed to create trip');
    }
  };

  const handleTransitSave = async (crewMembers) => {
    const token = localStorage.getItem('access_token');
    try {
      for (const shipmentId of transitForm.selectedShipments) {
        const shipment = shipments.find(s => s.id === shipmentId);
        await axios.post(`${API_URL}/trips/${selectedVehicle.id}/add-shipment/${shipmentId}`, {
          weight: shipment.weight
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      for (const crew of crewMembers) {
        await axios.post(`${API_URL}/crew`, {
          ...crew,
          tripId: selectedVehicle.id,
          type: 'loading',
          amount: parseFloat(crew.amount) || 0
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      alert('Shipments loaded to transit vehicle!');
      setShowTransitModal(false);
      setShowCrewForm(false);
      setTransitForm({ selectedShipments: [], loadingFee: 0 });
      setSelectedVehicle(null);
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load shipments');
    }
  };

  const handleUnloadingSave = async (crewMembers) => {
    const token = localStorage.getItem('access_token');
    try {
      for (const crew of crewMembers) {
        await axios.post(`${API_URL}/crew`, {
          ...crew,
          shipmentId: unloadingForm.shipmentId,
          type: 'unloading',
          amount: parseFloat(crew.amount) || 0
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      alert('Unloading crew recorded!');
      setShowCrewForm(false);
      setUnloadingForm({ shipmentId: '', unloadingFee: 0 });
      fetchAllData();
    } catch (error) {
      alert('Failed to save unloading crew');
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

  const pendingShipments = shipments.filter(s => s.status === 'pending');
  const loadedShipments = shipments.filter(s => s.status === 'loaded');

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
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Agent Portal - {user.name}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <video ref={videoRef} style={{ width: '90%', maxWidth: '400px', borderRadius: '10px' }} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ marginTop: '20px' }}>
            <button onClick={capturePhoto} style={{ padding: '10px 20px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Capture Photo</button>
            <button onClick={stopCamera} style={{ padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Crew Form Modal */}
      {showCrewForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, overflow: 'auto' }}>
          <div style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <CrewForm
              type={crewType}
              onSave={crewType === 'loading' ? (showDispatchModal ? handleDispatchSave : (showTransitModal ? handleTransitSave : null)) : handleUnloadingSave}
              onCancel={() => { setShowCrewForm(false); setShowDispatchModal(false); setShowTransitModal(false); }}
            />
            {crewType === 'loading' && showDispatchModal && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Vehicle Info</label>
                <input type="text" placeholder="Truck Plate" value={dispatchForm.truckPlate} onChange={(e) => setDispatchForm({...dispatchForm, truckPlate: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <select value={dispatchForm.driverId} onChange={(e) => setDispatchForm({...dispatchForm, driverId: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select value={dispatchForm.arrivalBranchId} onChange={(e) => setDispatchForm({...dispatchForm, arrivalBranchId: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="">Destination Branch</option>
                  {branches.filter(b => b.id !== user.branchId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderBottom: '1px solid #FF8C00', padding: '0 20px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('my')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'my' ? '#FF8C00' : 'transparent', color: activeTab === 'my' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>My Shipments</button>
        <button onClick={() => setActiveTab('pending')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'pending' ? '#FF8C00' : 'transparent', color: activeTab === 'pending' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Pending Load</button>
        <button onClick={() => setActiveTab('dispatch')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'dispatch' ? '#FF8C00' : 'transparent', color: activeTab === 'dispatch' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Ready to Dispatch</button>
        <button onClick={() => setActiveTab('transit')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'transit' ? '#FF8C00' : 'transparent', color: activeTab === 'transit' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Transit Vehicles</button>
        <button onClick={() => setActiveTab('incoming')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'incoming' ? '#FF8C00' : 'transparent', color: activeTab === 'incoming' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer' }}>Incoming</button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px' }}>
        
        {/* Create Shipment Button */}
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '10px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>
            {showCreateForm ? 'Cancel' : '+ Create New Shipment'}
          </button>
        </div>

        {/* Create Shipment Form - No loading fee */}
        {showCreateForm && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #FF8C00', marginBottom: '20px' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Create New Shipment</h3>
            <form onSubmit={handleCreateShipment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Sender Name" value={createForm.senderName} onChange={(e) => setCreateForm({...createForm, senderName: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <input type="text" placeholder="Sender Phone" value={createForm.senderPhone} onChange={(e) => setCreateForm({...createForm, senderPhone: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <input type="text" placeholder="Receiver Name" value={createForm.receiverName} onChange={(e) => setCreateForm({...createForm, receiverName: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <input type="text" placeholder="Receiver Phone" value={createForm.receiverPhone} onChange={(e) => setCreateForm({...createForm, receiverPhone: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <input type="text" placeholder="Item Description" value={createForm.itemDescription} onChange={(e) => setCreateForm({...createForm, itemDescription: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <input type="number" placeholder="Weight (kg)" value={createForm.weight} onChange={(e) => setCreateForm({...createForm, weight: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <select value={createForm.originBranchId} onChange={(e) => setCreateForm({...createForm, originBranchId: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}>
                  <option value="">Origin Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={createForm.destinationBranchId} onChange={(e) => setCreateForm({...createForm, destinationBranchId: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}>
                  <option value="">Destination Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="number" placeholder="Shipping Cost" value={createForm.shippingCost} onChange={(e) => setCreateForm({...createForm, shippingCost: e.target.value})} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} />
                <select value={createForm.currency} onChange={(e) => setCreateForm({...createForm, currency: e.target.value})} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}>
                  <option value="KES">KES</option><option value="SSP">SSP</option><option value="USD">USD</option>
                </select>
                <select value={createForm.paymentMethod} onChange={(e) => setCreateForm({...createForm, paymentMethod: e.target.value})} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}>
                  <option value="prepaid">Prepaid</option><option value="cod">Cash on Delivery</option>
                </select>
              </div>
              
              {/* Photo Upload */}
              <div style={{ marginTop: '15px', padding: '15px', border: '1px dashed #FF8C00', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Item Photo</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={startCamera} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer', fontSize: '11pt' }}>Take Photo</button>
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer', fontSize: '11pt' }}>Upload File</button>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} style={{ display: 'none' }} />
                {photoPreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button type="button" onClick={() => { setSelectedPhoto(null); setPhotoPreview(null); }} style={{ marginTop: '5px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>
              
              <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Shipment</button>
            </form>
          </div>
        )}

        {/* My Shipments Tab */}
        {activeTab === 'my' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>My Shipments</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                    <th style={{ padding: '10px' }}>Tracking</th>
                    <th style={{ padding: '10px' }}>Receiver</th>
                    <th style={{ padding: '10px' }}>Destination</th>
                    <th style={{ padding: '10px' }}>Weight</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><strong style={{ color: '#FF8C00' }}>{s.trackingNumber}</strong></td>
                      <td style={{ padding: '10px' }}>{s.receiverName}</td>
                      <td style={{ padding: '10px' }}>{s.destinationBranch?.name}</td>
                      <td style={{ padding: '10px' }}>{s.weight} kg</td>
                      <td style={{ padding: '10px' }}><span style={getStatusBadge(s.status)}>{s.status}</span></td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => generateQR(s.id)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>QR</button>
                        <button onClick={() => printReceipt(s.id, 'sending')} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Receipt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Load Tab */}
        {activeTab === 'pending' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>Pending Shipments (Ready to Load)</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                    <th style={{ padding: '10px' }}>Select</th>
                    <th style={{ padding: '10px' }}>Tracking</th>
                    <th style={{ padding: '10px' }}>Receiver</th>
                    <th style={{ padding: '10px' }}>Destination</th>
                    <th style={{ padding: '10px' }}>Weight</th>
                    <th style={{ padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingShipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><input type="checkbox" checked={selectedShipmentIds.includes(s.id)} onChange={() => toggleShipmentSelection(s.id)} /></td>
                      <td style={{ padding: '10px' }}>{s.trackingNumber}</td>
                      <td style={{ padding: '10px' }}>{s.receiverName}</td>
                      <td style={{ padding: '10px' }}>{s.destinationBranch?.name}</td>
                      <td style={{ padding: '10px' }}>{s.weight} kg</td>
                      <td style={{ padding: '10px' }}><button onClick={() => updateStatus(s.id, 'loaded')} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Loaded</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedShipmentIds.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <button onClick={() => { setCrewType('loading'); setShowDispatchModal(true); setShowCrewForm(true); }} style={{ padding: '10px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Trip ({selectedShipmentIds.length} selected)</button>
              </div>
            )}
          </div>
        )}

        {/* Ready to Dispatch Tab */}
        {activeTab === 'dispatch' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>Loaded Shipments Ready for Dispatch</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                    <th style={{ padding: '10px' }}>Tracking</th>
                    <th style={{ padding: '10px' }}>Receiver</th>
                    <th style={{ padding: '10px' }}>Destination</th>
                    <th style={{ padding: '10px' }}>Weight</th>
                    <th style={{ padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadedShipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{s.trackingNumber}</td>
                      <td style={{ padding: '10px' }}>{s.receiverName}</td>
                      <td style={{ padding: '10px' }}>{s.destinationBranch?.name}</td>
                      <td style={{ padding: '10px' }}>{s.weight} kg</td>
                      <td style={{ padding: '10px' }}><button onClick={() => { setSelectedShipmentIds([s.id]); setCrewType('loading'); setShowDispatchModal(true); setShowCrewForm(true); }} style={{ padding: '4px 8px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Dispatch</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transit Vehicles Tab */}
        {activeTab === 'transit' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>Available Transit Vehicles</h2>
            {transitVehicles.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>No transit vehicles available</div>
            ) : (
              transitVehicles.map(vehicle => (
                <div key={vehicle.id} style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #FF8C00' }}>
                  <p><strong>Truck:</strong> {vehicle.truckPlate} | <strong>Driver:</strong> {vehicle.driver?.name} | <strong>Status:</strong> {vehicle.status}</p>
                  <p><strong>Available:</strong> {vehicle.maxWeight - vehicle.currentWeight} kg | {vehicle.maxItems - vehicle.currentItems} items</p>
                  <button onClick={() => { setSelectedVehicle(vehicle); setTransitForm({ selectedShipments: [], loadingFee: 0 }); setCrewType('loading'); setShowTransitModal(true); setShowCrewForm(true); }} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Load to this Vehicle</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Incoming Shipments Tab */}
        {activeTab === 'incoming' && (
          <div>
            <h2 style={{ color: '#FFFFFF', marginBottom: '10px' }}>Incoming Shipments</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                    <th style={{ padding: '10px' }}>Tracking</th>
                    <th style={{ padding: '10px' }}>Sender</th>
                    <th style={{ padding: '10px' }}>Origin</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingShipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{s.trackingNumber}</td>
                      <td style={{ padding: '10px' }}>{s.senderName}</td>
                      <td style={{ padding: '10px' }}>{s.originBranch?.name}</td>
                      <td style={{ padding: '10px' }}><span style={getStatusBadge(s.status)}>{s.status}</span></td>
                      <td style={{ padding: '10px' }}>
                        {s.status === 'in_transit' && <button onClick={() => updateStatus(s.id, 'arrived')} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Mark Arrived</button>}
                        {s.status === 'arrived' && <button onClick={() => updateStatus(s.id, 'delivered')} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Delivered</button>}
                        {s.status === 'delivered' && <button onClick={() => printReceipt(s.id, 'delivery')} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Print Receipt</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '350px', textAlign: 'center', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>QR Code</h3>
            {currentQRCode && <img src={currentQRCode} alt="QR Code" style={{ width: '200px', height: '200px', margin: '20px auto' }} />}
            <button onClick={() => window.print()} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print</button>
            <button onClick={() => setShowQRModal(false)} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && currentReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00' }}>Receipt</h3>
            <p><strong>Receipt Number:</strong> {currentReceipt.receiptNumber}</p>
            <p><strong>Tracking:</strong> {currentReceipt.trackingNumber}</p>
            <p><strong>Sender:</strong> {currentReceipt.senderName}</p>
            <p><strong>Receiver:</strong> {currentReceipt.receiverName}</p>
            <p><strong>From:</strong> {currentReceipt.originBranch} → <strong>To:</strong> {currentReceipt.destinationBranch}</p>
            <p><strong>Item:</strong> {currentReceipt.itemDescription} | <strong>Weight:</strong> {currentReceipt.weight} kg</p>
            <p><strong>Total Paid:</strong> {currentReceipt.currency} {currentReceipt.totalPaid}</p>
            <button onClick={() => window.print()} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print</button>
            <button onClick={() => setShowReceiptModal(false)} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentDashboard;
