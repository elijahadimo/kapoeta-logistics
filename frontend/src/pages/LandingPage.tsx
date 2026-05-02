import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function LandingPage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('tracking');
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    customerName: '', customerPhone: '', rating: 5, comment: '', shipmentId: ''
  });
  const [branches, setBranches] = useState([]);
  const [newsItems, setNewsItems] = useState([
    { id: 1, title: 'New Route Added', content: 'Now shipping directly from Nairobi to Juba in 3 days!', date: '2026-05-01' },
    { id: 2, title: 'Promotion', content: '20% off on all shipments to Kapoeta this month!', date: '2026-04-28' },
    { id: 3, title: 'Holiday Schedule', content: 'Operations running normally during public holidays.', date: '2026-04-25' }
  ]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/branches`);
      setBranches(response.data);
    } catch (error) {
      console.error('Fetch branches error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert('Please enter search value');
      return;
    }
    
    setSearching(true);
    try {
      let response;
      if (searchType === 'tracking') {
        response = await axios.get(`${API_URL}/shipments/track/${searchValue}`);
      } else if (searchType === 'sender') {
        const allShipments = await axios.get(`${API_URL}/shipments`);
        response = { data: allShipments.data.filter((s: any) => 
          s.senderName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          s.senderPhone?.includes(searchValue)
        ) };
      } else if (searchType === 'receiver') {
        const allShipments = await axios.get(`${API_URL}/shipments`);
        response = { data: allShipments.data.filter((s: any) => 
          s.receiverName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          s.receiverPhone?.includes(searchValue)
        ) };
      }
      setSearchResult(response.data);
    } catch (error) {
      alert('Shipment not found');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/feedback`, feedbackForm);
      alert('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setFeedbackForm({ customerName: '', customerPhone: '', rating: 5, comment: '', shipmentId: '' });
    } catch (error) {
      alert('Failed to submit feedback');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      loaded: '#87CEEB',
      in_transit: '#3b82f6',
      arrived: '#8b5cf6',
      delivered: '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      loaded: 'Loaded',
      in_transit: 'In Transit',
      arrived: 'Arrived',
      delivered: 'Delivered'
    };
    return labels[status] || status;
  };

  return (
    <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header / Navigation */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #FF8C00', padding: '15px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: '#FF8C00', fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics and Parcels</h1>
            <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          </div>
          <div>
            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12pt' }}>Staff Login</button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ backgroundColor: '#1a1a2e', color: '#FFFFFF', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28pt', marginBottom: '10px' }}>Track Your Parcel</h2>
          <p style={{ fontSize: '12pt', marginBottom: '30px' }}>Enter your tracking number, sender name, or receiver name to track your shipment</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: '12px', border: 'none', borderRadius: '4px', fontSize: '12pt', backgroundColor: '#FF8C00', color: '#1a1a2e' }}>
              <option value="tracking">Tracking Number</option>
              <option value="sender">Sender Name / Phone</option>
              <option value="receiver">Receiver Name / Phone</option>
            </select>
            <input type="text" placeholder={searchType === 'tracking' ? 'Enter tracking number' : 'Enter name or phone'} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} style={{ width: '300px', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '12pt' }} />
            <button onClick={handleSearch} disabled={searching} style={{ padding: '12px 30px', backgroundColor: '#FF8C00', color: '#1a1a2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12pt', fontWeight: 'bold' }}>{searching ? 'Searching...' : 'Track'}</button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResult && (
        <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
          {Array.isArray(searchResult) && searchResult.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>No shipments found</div>
          ) : Array.isArray(searchResult) ? (
            searchResult.map(shipment => (
              <div key={shipment.id} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #FF8C00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '15px' }}>
                  <div><strong>Tracking Number:</strong> <span style={{ color: '#FF8C00' }}>{shipment.trackingNumber}</span></div>
                  <div><strong>Status:</strong> <span style={{ backgroundColor: getStatusColor(shipment.status), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{getStatusLabel(shipment.status)}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div><strong>From:</strong> {shipment.originBranch?.name}</div>
                  <div><strong>To:</strong> {shipment.destinationBranch?.name}</div>
                  <div><strong>Sender:</strong> {shipment.senderName} ({shipment.senderPhone})</div>
                  <div><strong>Receiver:</strong> {shipment.receiverName} ({shipment.receiverPhone})</div>
                  <div><strong>Item:</strong> {shipment.itemDescription}</div>
                  <div><strong>Weight:</strong> {shipment.weight} kg</div>
                </div>
                <button onClick={() => { setFeedbackForm({ ...feedbackForm, shipmentId: shipment.id }); setShowFeedbackForm(true); }} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Leave Feedback</button>
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #FF8C00' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '15px' }}>
                <div><strong>Tracking Number:</strong> <span style={{ color: '#FF8C00' }}>{searchResult.trackingNumber}</span></div>
                <div><strong>Status:</strong> <span style={{ backgroundColor: getStatusColor(searchResult.status), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{getStatusLabel(searchResult.status)}</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div><strong>From:</strong> {searchResult.originBranch?.name}</div>
                <div><strong>To:</strong> {searchResult.destinationBranch?.name}</div>
                <div><strong>Sender:</strong> {searchResult.senderName} ({searchResult.senderPhone})</div>
                <div><strong>Receiver:</strong> {searchResult.receiverName} ({searchResult.receiverPhone})</div>
                <div><strong>Item:</strong> {searchResult.itemDescription}</div>
                <div><strong>Weight:</strong> {searchResult.weight} kg</div>
              </div>
              <button onClick={() => { setFeedbackForm({ ...feedbackForm, shipmentId: searchResult.id }); setShowFeedbackForm(true); }} style={{ padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Leave Feedback</button>
            </div>
          )}
        </div>
      )}

      {/* Three Column Section */}
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        {/* Branch Locations */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderTop: '4px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Our Branches</h3>
          {branches.map(branch => (
            <div key={branch.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
              <strong>{branch.name}</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '10pt', color: '#666' }}>{branch.location}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '10pt', color: '#666' }}>{branch.hasAgent ? 'Agent available' : 'Driver operated'}</p>
              {branch.contactPhone && <p style={{ margin: '5px 0 0 0', fontSize: '10pt', color: '#666' }}>📞 {branch.contactPhone}</p>}
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderTop: '4px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Contact Us</h3>
          <p><strong>Head Office:</strong><br />Nairobi, Kenya</p>
          <p><strong>Phone:</strong><br />+254 712 345 678</p>
          <p><strong>Email:</strong><br />info@kapoetalogistics.com</p>
          <p><strong>Working Hours:</strong><br />Monday - Friday: 8:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 2:00 PM</p>
        </div>

        {/* News & Promotions */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderTop: '4px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>News & Promotions</h3>
          {newsItems.map(item => (
            <div key={item.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
              <strong>{item.title}</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '10pt', color: '#666' }}>{item.content}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '9pt', color: '#999' }}>{new Date(item.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#1a1a2e', color: '#87CEEB', padding: '30px 20px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Kapoeta Logistics and Parcels | Fast. Secure. Affordable.</p>
        <p style={{ margin: '10px 0 0 0', fontSize: '10pt' }}>Follow us on social media</p>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '450px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Customer Feedback</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Your Name</label>
                <input type="text" value={feedbackForm.customerName} onChange={(e) => setFeedbackForm({...feedbackForm, customerName: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Your Phone</label>
                <input type="tel" value={feedbackForm.customerPhone} onChange={(e) => setFeedbackForm({...feedbackForm, customerPhone: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Rating</label>
                <select value={feedbackForm.rating} onChange={(e) => setFeedbackForm({...feedbackForm, rating: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="5">★★★★★ Excellent</option>
                  <option value="4">★★★★ Good</option>
                  <option value="3">★★★ Average</option>
                  <option value="2">★★ Poor</option>
                  <option value="1">★ Very Poor</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Your Comment</label>
                <textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm({...feedbackForm, comment: e.target.value})} rows={3} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Feedback</button>
                <button type="button" onClick={() => setShowFeedbackForm(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
