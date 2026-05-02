import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function AssistantDriverDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState({
    facePhoto: null,
    idPhoto: null,
    signature: null
  });
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsChecking, setGpsChecking] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: null, lng: null });
  const [gpsError, setGpsError] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [codAmount, setCodAmount] = useState('');
  const [codCurrency, setCodCurrency] = useState('KES');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);

  // Branches without agents
  const noAgentBranches = ['Nadapal', 'Narus', 'Torit'];

  // Branch GPS coordinates
  const branchCoordinates = {
    'Nadapal': { lat: 3.7833, lng: 34.3333, radius: 0.5 },
    'Narus': { lat: 3.7500, lng: 33.8667, radius: 0.5 },
    'Torit': { lat: 4.4167, lng: 32.5667, radius: 0.5 }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const [shipmentsRes, branchesRes] = await Promise.all([
        axios.get(`${API_URL}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      // Filter shipments to no-agent branches
      const filtered = shipmentsRes.data.filter((s: any) => 
        noAgentBranches.includes(s.destinationBranch?.name) && 
        s.status !== 'delivered'
      );
      
      setShipments(filtered);
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const verifyGPSLocation = (branchName) => {
    setGpsChecking(true);
    setGpsError('');
    setGpsVerified(false);

    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      setGpsChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        
        const branchCoord = branchCoordinates[branchName];
        if (!branchCoord) {
          setGpsError('Branch coordinates not found');
          setGpsChecking(false);
          return;
        }
        
        const distance = calculateDistance(latitude, longitude, branchCoord.lat, branchCoord.lng);
        
        if (distance <= branchCoord.radius) {
          setGpsVerified(true);
          setGpsError('');
        } else {
          setGpsError(`You are ${distance.toFixed(2)} km away. Must be within ${branchCoord.radius} km to deliver.`);
        }
        setGpsChecking(false);
      },
      (error) => {
        setGpsError('Unable to get your location. Please enable GPS.');
        setGpsChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = (type) => {
    setCameraType(type);
    setShowCamera(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(err => {
        alert('Cannot access camera: ' + err.message);
      });
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        if (cameraType === 'face') {
          setCapturedPhotos({ ...capturedPhotos, facePhoto: blob });
        } else if (cameraType === 'id') {
          setCapturedPhotos({ ...capturedPhotos, idPhoto: blob });
        }
        
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        setShowCamera(false);
      }, 'image/jpeg', 0.8);
    }
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    canvas.toBlob((blob) => {
      setCapturedPhotos({ ...capturedPhotos, signature: blob });
      alert('Signature saved');
    }, 'image/png');
  };

  const uploadPhoto = async (blob, type) => {
    const formData = new FormData();
    formData.append('photo', blob, `${type}_${Date.now()}.jpg`);
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.post(`${API_URL}/upload/delivery`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return response.data.photoUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const completeDelivery = async (shipmentId, isCOD) => {
    if (!gpsVerified) {
      alert('Please verify your GPS location first');
      return;
    }
    
    if (!capturedPhotos.facePhoto || !capturedPhotos.signature) {
      alert('Please take face photo and capture signature');
      return;
    }
    
    const token = localStorage.getItem('access_token');
    
    const facePhotoUrl = capturedPhotos.facePhoto ? await uploadPhoto(capturedPhotos.facePhoto, 'face') : null;
    const idPhotoUrl = capturedPhotos.idPhoto ? await uploadPhoto(capturedPhotos.idPhoto, 'id') : null;
    const signatureUrl = capturedPhotos.signature ? await uploadPhoto(capturedPhotos.signature, 'signature') : null;
    
    try {
      await axios.put(`${API_URL}/shipments/${shipmentId}/status`, 
        { 
          status: 'delivered', 
          userId: user.id,
          receiverName,
          receiverPhone,
          facePhoto: facePhotoUrl,
          idPhoto: idPhotoUrl,
          signature: signatureUrl,
          deliveryLatitude: gpsLocation.lat,
          deliveryLongitude: gpsLocation.lng
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (isCOD && codAmount) {
        await axios.put(`${API_URL}/shipments/${shipmentId}/payment`, 
          { amount: parseFloat(codAmount), currency: codCurrency },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      alert('Delivery completed successfully!');
      setShowDeliveryModal(false);
      setCapturedPhotos({ facePhoto: null, idPhoto: null, signature: null });
      setReceiverName('');
      setReceiverPhone('');
      setCodAmount('');
      setGpsVerified(false);
      fetchData();
    } catch (error) {
      alert('Failed to complete delivery');
    }
  };

  const openDeliveryModal = (shipment) => {
    setSelectedShipment(shipment);
    setGpsVerified(false);
    setGpsLocation({ lat: null, lng: null });
    setGpsError('');
    setShowDeliveryModal(true);
    setTimeout(() => {
      if (signatureCanvasRef.current) {
        const canvas = signatureCanvasRef.current;
        canvas.width = 300;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
      }
    }, 100);
  };

  const getShipmentsByBranch = (branchName) => {
    return shipments.filter(s => s.destinationBranch?.name === branchName);
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
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Assistant Driver Portal - {user.name}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#FFFFFF', marginBottom: '20px' }}>Deliveries at Branches Without Agents</h2>
        <p style={{ color: '#1a1a2e', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '8px' }}>
          Responsible for deliveries at: <strong>Nadapal, Narus, Torit</strong>
        </p>

        {/* Deliveries by Branch */}
        {noAgentBranches.map(branchName => {
          const branchShipments = getShipmentsByBranch(branchName);
          if (branchShipments.length === 0) return null;
          
          return (
            <div key={branchName} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
              <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Branch: {branchName}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tracking Number</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Sender</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Receiver</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Payment</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {branchShipments.map(shipment => (
                    <tr key={shipment.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><strong>{shipment.trackingNumber}</strong></td>
                      <td style={{ padding: '10px' }}>{shipment.senderName}</td>
                      <td style={{ padding: '10px' }}>{shipment.receiverName}</td>
                      <td style={{ padding: '10px' }}>{shipment.itemDescription} ({shipment.weight}kg)</td>
                      <td style={{ padding: '10px' }}>
                        {shipment.paymentMethod === 'cod' ? `COD: ${shipment.currency} ${shipment.shippingCost}` : 'Prepaid'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => openDeliveryModal(shipment)} style={{ padding: '5px 10px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Deliver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {shipments.length === 0 && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
            No pending deliveries at branches without agents.
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <video ref={videoRef} style={{ width: '90%', maxWidth: '400px', borderRadius: '10px' }} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ marginTop: '20px' }}>
            <button onClick={takePhoto} style={{ padding: '10px 20px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Take Photo</button>
            <button onClick={() => { setShowCamera(false); }} style={{ padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedShipment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Complete Delivery</h3>
            <p><strong>Shipment:</strong> {selectedShipment.trackingNumber}</p>
            <p><strong>Branch:</strong> {selectedShipment.destinationBranch?.name}</p>
            
            {/* GPS Verification Section */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
              <h4>GPS Location Verification</h4>
              {!gpsVerified ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#666' }}>You must be at the branch location to deliver</p>
                  <button onClick={() => verifyGPSLocation(selectedShipment.destinationBranch?.name)} disabled={gpsChecking} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {gpsChecking ? 'Checking Location...' : 'Verify My Location'}
                  </button>
                  {gpsError && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>{gpsError}</p>}
                  {gpsLocation.lat && <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Your location: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}</p>}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#10b981', fontWeight: 'bold' }}>Location Verified - You are at the correct branch</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>Your location: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Only show if GPS verified */}
            {gpsVerified && (
              <>
                {/* Receiver Information */}
                <div style={{ marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                  <h4>Receiver Information</h4>
                  <input type="text" placeholder="Receiver Name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                  <input type="text" placeholder="Receiver Phone" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                </div>

                {/* Proof of Delivery */}
                <div style={{ marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                  <h4>Proof of Delivery</h4>
                  
                  {/* Face Photo */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Receiver Face Photo</label>
                    {capturedPhotos.facePhoto ? (
                      <div>
                        <img src={URL.createObjectURL(capturedPhotos.facePhoto)} alt="Face" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={() => setCapturedPhotos({...capturedPhotos, facePhoto: null})} style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retake</button>
                      </div>
                    ) : (
                      <button onClick={() => startCamera('face')} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Take Face Photo</button>
                    )}
                  </div>

                  {/* ID Photo */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Receiver ID Photo</label>
                    {capturedPhotos.idPhoto ? (
                      <div>
                        <img src={URL.createObjectURL(capturedPhotos.idPhoto)} alt="ID" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={() => setCapturedPhotos({...capturedPhotos, idPhoto: null})} style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retake</button>
                      </div>
                    ) : (
                      <button onClick={() => startCamera('id')} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Take ID Photo</button>
                    )}
                  </div>

                  {/* Signature */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Receiver Signature</label>
                    {capturedPhotos.signature ? (
                      <div>
                        <img src={URL.createObjectURL(capturedPhotos.signature)} alt="Signature" style={{ width: '200px', height: '80px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} />
                        <button onClick={() => setCapturedPhotos({...capturedPhotos, signature: null})} style={{ marginLeft: '10px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
                      </div>
                    ) : (
                      <div>
                        <canvas ref={signatureCanvasRef} style={{ width: '100%', height: '150px', border: '1px solid #FF8C00', borderRadius: '4px', backgroundColor: 'white' }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                        <div style={{ marginTop: '10px' }}>
                          <button onClick={clearSignature} style={{ padding: '4px 8px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Clear</button>
                          <button onClick={saveSignature} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Signature</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* COD Section */}
                {selectedShipment.paymentMethod === 'cod' && (
                  <div style={{ marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                    <h4>COD Collection</h4>
                    <p>Amount Due: {selectedShipment.currency} {selectedShipment.shippingCost}</p>
                    <input type="number" placeholder="Amount Collected" value={codAmount} onChange={(e) => setCodAmount(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                    <select value={codCurrency} onChange={(e) => setCodCurrency(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                      <option value="KES">KES</option>
                      <option value="SSP">SSP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => completeDelivery(selectedShipment.id, selectedShipment.paymentMethod === 'cod')} disabled={!capturedPhotos.facePhoto || !capturedPhotos.signature} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!capturedPhotos.facePhoto || !capturedPhotos.signature) ? 0.5 : 1 }}>Confirm Delivery</button>
                  <button onClick={() => { setShowDeliveryModal(false); setCapturedPhotos({ facePhoto: null, idPhoto: null, signature: null }); setGpsVerified(false); }} style={{ padding: '10px 20px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssistantDriverDashboard;
