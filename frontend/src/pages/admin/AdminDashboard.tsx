import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('branches');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  
  // Filtered users by role
  const drivers = users.filter(u => u.role === 'driver');
  const agents = users.filter(u => u.role === 'agent');
  const asstDrivers = users.filter(u => u.role === 'asst_driver');
  
  // Form states for CRUD
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '', location: '', country: 'Kenya', type: 'local', hasAgent: false, isActive: true
  });
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '', phone: '', email: '', password: '', role: 'driver', branchId: '', isActive: true
  });
  
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  
  const [showChat, setShowChat] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState(null);

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
      const [branchesRes, usersRes, shipmentsRes, tripsRes, feedbackRes, incidentsRes, fuelRes] = await Promise.all([
        axios.get(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/feedback`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/incidents`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/fuel-logs`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      setBranches(branchesRes.data);
      setUsers(usersRes.data);
      setShipments(shipmentsRes.data);
      setTrips(tripsRes.data);
      setFeedback(feedbackRes.data);
      setIncidents(incidentsRes.data);
      setFuelLogs(fuelRes.data);
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

  // Branch CRUD
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      if (editingBranch) {
        await axios.put(`${API_URL}/branches/${editingBranch.id}`, branchForm, { headers: { Authorization: `Bearer ${token}` } });
        alert('Branch updated');
      } else {
        await axios.post(`${API_URL}/branches`, branchForm, { headers: { Authorization: `Bearer ${token}` } });
        alert('Branch created');
      }
      setShowBranchForm(false);
      setEditingBranch(null);
      setBranchForm({ name: '', location: '', country: 'Kenya', type: 'local', hasAgent: false, isActive: true });
      fetchAllData();
    } catch (error) {
      alert('Failed to save branch');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm('Delete this branch?')) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_URL}/branches/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAllData();
      alert('Branch deleted');
    } catch (error) {
      alert('Failed to delete branch');
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name, location: branch.location, country: branch.country,
      type: branch.type, hasAgent: branch.hasAgent, isActive: branch.isActive
    });
    setShowBranchForm(true);
  };

  // User CRUD
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      if (editingUser) {
        await axios.put(`${API_URL}/users/${editingUser.id}`, userForm, { headers: { Authorization: `Bearer ${token}` } });
        alert('User updated');
      } else {
        await axios.post(`${API_URL}/auth/register`, userForm, { headers: { Authorization: `Bearer ${token}` } });
        alert('User created');
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ name: '', phone: '', email: '', password: '', role: 'driver', branchId: '', isActive: true });
      fetchAllData();
    } catch (error) {
      alert('Failed to save user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_URL}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAllData();
      alert('User deleted');
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (usr) => {
    setEditingUser(usr);
    setUserForm({
      name: usr.name, phone: usr.phone, email: usr.email || '', password: '',
      role: usr.role, branchId: usr.branchId || '', isActive: usr.isActive
    });
    setShowUserForm(true);
  };

  const handleSuspendUser = async (id, currentStatus) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/users/${id}`, { isActive: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAllData();
      alert(currentStatus ? 'User suspended' : 'User activated');
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  // Incident Resolution
  const handleResolveIncident = async (incident) => {
    setSelectedIncident(incident);
    setShowIncidentModal(true);
  };

  const processRefund = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(`${API_URL}/incidents/${selectedIncident.id}/resolve`, {
        status: 'resolved_refunded', refundAmount: parseFloat(refundAmount), refundCurrency: 'KES'
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Refund processed');
      setShowIncidentModal(false);
      setRefundAmount('');
      fetchAllData();
    } catch (error) {
      alert('Failed to process refund');
    }
  };

  // Chat functions
  const openChat = () => {
    const allStaff = users.filter(u => u.role !== 'admin');
    setChatUsers(allStaff);
    setShowChat(true);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !selectedChatUser) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_URL}/messages/send`, {
        receiverId: selectedChatUser.id, content: chatMessage
      }, { headers: { Authorization: `Bearer ${token}` } });
      setChatMessage('');
      // Refresh messages
      const response = await axios.get(`${API_URL}/messages/conversation/${selectedChatUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const loadChat = async (chatUser) => {
    setSelectedChatUser(chatUser);
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/messages/conversation/${chatUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error('Load chat error:', error);
    }
  };

  // Export Reports
  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(header => JSON.stringify(row[header] || ''));
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleLabel = (role) => {
    const labels = { admin: 'Admin', agent: 'Agent', driver: 'Driver', asst_driver: 'Asst Driver' };
    return labels[role] || role;
  };

  const getBranchTypeLabel = (type) => {
    const labels = { hq: 'Headquarters', border: 'Border Post', city: 'City Branch', local: 'Local Branch' };
    return labels[type] || type;
  };

  const getSeverityColor = (severity) => {
    const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
    return colors[severity] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', loaded: '#87CEEB', in_transit: '#3b82f6', arrived: '#8b5cf6', delivered: '#10b981', lost: '#ef4444', damaged: '#ef4444' };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #FF8C00', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics & Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Admin Portal - {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={openChat} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Chat</button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Settings</button>
          <button onClick={() => window.location.href='/admin/financial'} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer', marginRight: '10px' }}>Financial</button><button onClick={() => window.location.href='/admin/audit'} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer', marginRight: '10px' }}>Audit Log</button><button onClick={() => window.location.href='/admin/tracking'} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer', marginRight: '10px' }}>Tracking</button><button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Tab Navigation - Scrollable */}
      <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderBottom: '1px solid #FF8C00', padding: '0 20px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('branches')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'branches' ? '#FF8C00' : 'transparent', color: activeTab === 'branches' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Branches</button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'users' ? '#FF8C00' : 'transparent', color: activeTab === 'users' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>All Users</button>
        <button onClick={() => setActiveTab('drivers')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'drivers' ? '#FF8C00' : 'transparent', color: activeTab === 'drivers' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Drivers</button>
        <button onClick={() => setActiveTab('agents')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'agents' ? '#FF8C00' : 'transparent', color: activeTab === 'agents' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Agents</button>
        <button onClick={() => setActiveTab('asst_drivers')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'asst_drivers' ? '#FF8C00' : 'transparent', color: activeTab === 'asst_drivers' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Asst Drivers</button>
        <button onClick={() => setActiveTab('shipments')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'shipments' ? '#FF8C00' : 'transparent', color: activeTab === 'shipments' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Shipments</button>
        <button onClick={() => setActiveTab('trips')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'trips' ? '#FF8C00' : 'transparent', color: activeTab === 'trips' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Trips</button>
        <button onClick={() => setActiveTab('fuel')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'fuel' ? '#FF8C00' : 'transparent', color: activeTab === 'fuel' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Fuel Logs</button>
        <button onClick={() => setActiveTab('incidents')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'incidents' ? '#FF8C00' : 'transparent', color: activeTab === 'incidents' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Incidents</button>
        <button onClick={() => setActiveTab('feedback')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'feedback' ? '#FF8C00' : 'transparent', color: activeTab === 'feedback' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Feedback</button>
        <button onClick={() => setActiveTab('finance')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'finance' ? '#FF8C00' : 'transparent', color: activeTab === 'finance' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Finance</button>
        <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'reports' ? '#FF8C00' : 'transparent', color: activeTab === 'reports' ? '#FFFFFF' : '#FF8C00', border: 'none', fontSize: '12pt', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>Reports</button>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', width: '700px', height: '500px', display: 'flex', border: '2px solid #FF8C00' }}>
            <div style={{ width: '200px', borderRight: '1px solid #FF8C00', overflowY: 'auto' }}>
              <div style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', fontWeight: 'bold' }}>Users</div>
              {chatUsers.map(u => (
                <div key={u.id} onClick={() => loadChat(u)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: selectedChatUser?.id === u.id ? '#87CEEB' : 'transparent' }}>
                  {u.name} ({getRoleLabel(u.role)})
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', fontWeight: 'bold' }}>
                {selectedChatUser ? `Chat with ${selectedChatUser.name}` : 'Select a user'}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ textAlign: msg.senderId === user.id ? 'right' : 'left', marginBottom: '10px' }}>
                    <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '8px', backgroundColor: msg.senderId === user.id ? '#FF8C00' : '#87CEEB', color: msg.senderId === user.id ? '#FFFFFF' : '#000000' }}>
                      {msg.content}
                    </span>
                    <div style={{ fontSize: '10px', color: '#999' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px', borderTop: '1px solid #FF8C00', display: 'flex' }}>
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type message..." style={{ flex: 1, padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <button onClick={sendMessage} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '500px', border: '2px solid #FF8C00' }}>
            <h3 style={{ color: '#FF8C00', marginTop: 0 }}>System Settings</h3>
            <h4>User Access Control</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                  <span>{u.name} ({getRoleLabel(u.role)})</span>
                  <div>
                    <button onClick={() => handleEditUser(u)} style={{ padding: '4px 8px', marginRight: '8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleSuspendUser(u.id, u.isActive)} style={{ padding: '4px 8px', backgroundColor: u.isActive ? '#ef4444' : '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{u.isActive ? 'Suspend' : 'Activate'}</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div style={{ padding: '20px' }}>
        
        {/* BRANCHES TAB */}
        {activeTab === 'branches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', margin: 0, textShadow: '1px 1px 0 #FF8C00' }}>Branch Management</h2>
              <button onClick={() => { setShowBranchForm(true); setEditingBranch(null); }} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Add Branch</button>
            </div>
            {showBranchForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '450px', border: '2px solid #FF8C00' }}>
                  <h3 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', marginTop: 0 }}>{editingBranch ? 'Edit Branch' : 'Add Branch'}</h3>
                  <form onSubmit={handleCreateBranch}>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Branch Name</label><input type="text" value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Location</label><input type="text" value={branchForm.location} onChange={(e) => setBranchForm({...branchForm, location: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Country</label><select value={branchForm.country} onChange={(e) => setBranchForm({...branchForm, country: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}><option value="Kenya">Kenya</option><option value="South Sudan">South Sudan</option></select></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Branch Type</label><select value={branchForm.type} onChange={(e) => setBranchForm({...branchForm, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}><option value="hq">Headquarters</option><option value="border">Border Post</option><option value="city">City Branch</option><option value="local">Local Branch</option></select></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={branchForm.hasAgent} onChange={(e) => setBranchForm({...branchForm, hasAgent: e.target.checked})} style={{ marginRight: '8px' }} /><span style={{ fontSize: '12pt' }}>Has Agent at this branch</span></label></div>
                    <div style={{ marginBottom: '15px' }}><label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={branchForm.isActive} onChange={(e) => setBranchForm({...branchForm, isActive: e.target.checked})} style={{ marginRight: '8px' }} /><span style={{ fontSize: '12pt' }}>Branch Active</span></label></div>
                    <div style={{ display: 'flex', gap: '10px' }}><button type="submit" style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Save</button><button type="button" onClick={() => setShowBranchForm(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button></div>
                  </form>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Name</th><th style={{ padding: '10px', textAlign: 'left' }}>Location</th><th style={{ padding: '10px', textAlign: 'left' }}>Type</th><th style={{ padding: '10px', textAlign: 'left' }}>Has Agent</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Actions</th></tr></thead>
                <tbody>{branches.map((branch) => (<tr key={branch.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{branch.name}</td><td style={{ padding: '10px' }}>{branch.location}</td><td style={{ padding: '10px' }}>{getBranchTypeLabel(branch.type)}</td><td style={{ padding: '10px' }}>{branch.hasAgent ? 'Yes' : 'No'}</td><td style={{ padding: '10px' }}><span style={{ color: branch.isActive ? '#10b981' : '#ef4444' }}>{branch.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ padding: '10px' }}><button onClick={() => handleEditBranch(branch)} style={{ padding: '4px 8px', marginRight: '8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '10pt', cursor: 'pointer' }}>Edit</button><button onClick={() => handleDeleteBranch(branch.id)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10pt', cursor: 'pointer' }}>Delete</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', margin: 0, textShadow: '1px 1px 0 #FF8C00' }}>All Users</h2>
              <button onClick={() => { setShowUserForm(true); setEditingUser(null); }} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Add User</button>
            </div>
            {showUserForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '450px', border: '2px solid #FF8C00' }}>
                  <h3 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', marginTop: 0 }}>{editingUser ? 'Edit User' : 'Add User'}</h3>
                  <form onSubmit={handleCreateUser}>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Full Name</label><input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Phone Number</label><input type="tel" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Email</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>
                    {!editingUser && <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Password</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }} /></div>}
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Role</label><select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}><option value="admin">Admin</option><option value="agent">Agent</option><option value="driver">Driver</option><option value="asst_driver">Assistant Driver</option></select></div>
                    <div style={{ marginBottom: '10px' }}><label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Assign Branch</label><select value={userForm.branchId} onChange={(e) => setUserForm({...userForm, branchId: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '12pt' }}><option value="">No Branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                    <div style={{ marginBottom: '15px' }}><label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})} style={{ marginRight: '8px' }} /><span style={{ fontSize: '12pt' }}>Account Active</span></label></div>
                    <div style={{ display: 'flex', gap: '10px' }}><button type="submit" style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12pt', cursor: 'pointer' }}>Save</button><button type="button" onClick={() => setShowUserForm(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button></div>
                  </form>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Name</th><th style={{ padding: '10px', textAlign: 'left' }}>Phone</th><th style={{ padding: '10px', textAlign: 'left' }}>Role</th><th style={{ padding: '10px', textAlign: 'left' }}>Branch</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Actions</th></tr></thead>
                <tbody>{users.map((usr) => (<tr key={usr.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{usr.name}</td><td style={{ padding: '10px' }}>{usr.phone}</td><td style={{ padding: '10px' }}>{getRoleLabel(usr.role)}</td><td style={{ padding: '10px' }}>{branches.find((b) => b.id === usr.branchId)?.name || '-'}</td><td style={{ padding: '10px' }}><span style={{ color: usr.isActive ? '#10b981' : '#ef4444' }}>{usr.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ padding: '10px' }}><button onClick={() => handleEditUser(usr)} style={{ padding: '4px 8px', marginRight: '8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', fontSize: '10pt', cursor: 'pointer' }}>Edit</button><button onClick={() => handleDeleteUser(usr.id)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10pt', cursor: 'pointer' }}>Delete</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Drivers</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Name</th><th style={{ padding: '10px', textAlign: 'left' }}>Phone</th><th style={{ padding: '10px', textAlign: 'left' }}>Branch</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Actions</th></tr></thead>
                <tbody>{drivers.map((d) => (<tr key={d.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{d.name}</td><td style={{ padding: '10px' }}>{d.phone}</td><td style={{ padding: '10px' }}>{branches.find((b) => b.id === d.branchId)?.name || '-'}</td><td style={{ padding: '10px' }}><span style={{ color: d.isActive ? '#10b981' : '#ef4444' }}>{d.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ padding: '10px' }}><button onClick={() => handleEditUser(d)} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Edit</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Agents</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Name</th><th style={{ padding: '10px', textAlign: 'left' }}>Phone</th><th style={{ padding: '10px', textAlign: 'left' }}>Branch</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Actions</th></tr></thead>
                <tbody>{agents.map((a) => (<tr key={a.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{a.name}</td><td style={{ padding: '10px' }}>{a.phone}</td><td style={{ padding: '10px' }}>{branches.find((b) => b.id === a.branchId)?.name || '-'}</td><td style={{ padding: '10px' }}><span style={{ color: a.isActive ? '#10b981' : '#ef4444' }}>{a.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ padding: '10px' }}><button onClick={() => handleEditUser(a)} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Edit</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ASSISTANT DRIVERS TAB */}
        {activeTab === 'asst_drivers' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Assistant Drivers</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Name</th><th style={{ padding: '10px', textAlign: 'left' }}>Phone</th><th style={{ padding: '10px', textAlign: 'left' }}>Branch</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Actions</th></tr></thead>
                <tbody>{asstDrivers.map((ad) => (<tr key={ad.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{ad.name}</td><td style={{ padding: '10px' }}>{ad.phone}</td><td style={{ padding: '10px' }}>{branches.find((b) => b.id === ad.branchId)?.name || '-'}</td><td style={{ padding: '10px' }}><span style={{ color: ad.isActive ? '#10b981' : '#ef4444' }}>{ad.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ padding: '10px' }}><button onClick={() => handleEditUser(ad)} style={{ padding: '4px 8px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Edit</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* SHIPMENTS TAB */}
        {activeTab === 'shipments' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>All Shipments</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Tracking</th><th style={{ padding: '10px', textAlign: 'left' }}>Sender</th><th style={{ padding: '10px', textAlign: 'left' }}>Receiver</th><th style={{ padding: '10px', textAlign: 'left' }}>Route</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Payment</th></tr></thead>
                <tbody>{shipments.map((s) => (<tr key={s.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}><strong style={{ color: '#FF8C00' }}>{s.trackingNumber}</strong></td><td style={{ padding: '10px' }}>{s.senderName}</td><td style={{ padding: '10px' }}>{s.receiverName}</td><td style={{ padding: '10px' }}>{s.originBranch?.name || '-'} → {s.destinationBranch?.name || '-'}</td><td style={{ padding: '10px' }}><span style={{ backgroundColor: getStatusColor(s.status), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{s.status}</span></td><td style={{ padding: '10px' }}>{s.paymentMethod === 'cod' ? `COD: ${s.currency} ${s.shippingCost}` : `Prepaid: ${s.currency} ${s.shippingCost}`}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRIPS TAB */}
        {activeTab === 'trips' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Trips & Vehicle Movement</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Trip Number</th><th style={{ padding: '10px', textAlign: 'left' }}>Truck</th><th style={{ padding: '10px', textAlign: 'left' }}>Driver</th><th style={{ padding: '10px', textAlign: 'left' }}>Route</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Location</th></tr></thead>
                <tbody>{trips.map((t) => (<tr key={t.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{t.tripNumber}</td><td style={{ padding: '10px' }}>{t.truckPlate}</td><td style={{ padding: '10px' }}>{t.driver?.name || '-'}</td><td style={{ padding: '10px' }}>{t.departureBranch?.name || '-'} → {t.arrivalBranch?.name || '-'}</td><td style={{ padding: '10px' }}>{t.status}</td><td style={{ padding: '10px' }}>{t.currentLatitude ? `${t.currentLatitude}, ${t.currentLongitude}` : '-'}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* FUEL LOGS TAB */}
        {activeTab === 'fuel' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Fuel Logs</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Trip</th><th style={{ padding: '10px', textAlign: 'left' }}>Liters</th><th style={{ padding: '10px', textAlign: 'left' }}>Cost</th><th style={{ padding: '10px', textAlign: 'left' }}>Location</th><th style={{ padding: '10px', textAlign: 'left' }}>Date</th></tr></thead>
                <tbody>{fuelLogs.map((f) => (<tr key={f.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{f.tripId}</td><td style={{ padding: '10px' }}>{f.amountLiters} L</td><td style={{ padding: '10px' }}>KES {f.totalCost}</td><td style={{ padding: '10px' }}>{f.location}</td><td style={{ padding: '10px' }}>{new Date(f.createdAt).toLocaleDateString()}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Incidents & Refunds</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Number</th><th style={{ padding: '10px', textAlign: 'left' }}>Type</th><th style={{ padding: '10px', textAlign: 'left' }}>Severity</th><th style={{ padding: '10px', textAlign: 'left' }}>Description</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Action</th></tr></thead>
                <tbody>{incidents.map((inc) => (<tr key={inc.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{inc.incidentNumber}</td><td style={{ padding: '10px' }}>{inc.type}</td><td style={{ padding: '10px' }}><span style={{ backgroundColor: getSeverityColor(inc.severity), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{inc.severity}</span></td><td style={{ padding: '10px' }}>{inc.description?.substring(0, 50)}...</td><td style={{ padding: '10px' }}>{inc.status}</td><td style={{ padding: '10px' }}>{inc.status === 'reported' && <button onClick={() => handleResolveIncident(inc)} style={{ padding: '4px 8px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Resolve</button>}</td></tr>))}</tbody>
              </table>
            </div>
            {showIncidentModal && selectedIncident && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', width: '400px', border: '2px solid #FF8C00' }}>
                  <h3 style={{ color: '#FF8C00' }}>Process Refund</h3>
                  <p>Incident: {selectedIncident.incidentNumber}</p>
                  <input type="number" placeholder="Refund Amount (KES)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                  <button onClick={processRefund} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Process Refund</button>
                  <button onClick={() => setShowIncidentModal(false)} style={{ padding: '8px 16px', backgroundColor: '#999', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Customer Feedback</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead><tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}><th style={{ padding: '10px', textAlign: 'left' }}>Customer</th><th style={{ padding: '10px', textAlign: 'left' }}>Rating</th><th style={{ padding: '10px', textAlign: 'left' }}>Comment</th><th style={{ padding: '10px', textAlign: 'left' }}>Date</th></tr></thead>
                <tbody>{feedback.map((fb) => (<tr key={fb.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{fb.customerName}</td><td style={{ padding: '10px' }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</td><td style={{ padding: '10px' }}>{fb.comment}</td><td style={{ padding: '10px' }}>{new Date(fb.createdAt).toLocaleDateString()}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCE TAB */}
        {activeTab === 'finance' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Financial Transactions</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px' }}>
              <h3>Summary</h3>
              <p>Total Revenue: <strong>KES {shipments.filter(s => s.status === 'delivered').reduce((sum, s) => sum + Number(s.shippingCost), 0).toLocaleString()}</strong></p>
              <p>Pending COD: <strong>KES {shipments.filter(s => s.paymentMethod === 'cod' && s.status !== 'delivered').reduce((sum, s) => sum + Number(s.shippingCost), 0).toLocaleString()}</strong></p>
              <p>Total Shipments: <strong>{shipments.length}</strong></p>
              <p>Delivered Shipments: <strong>{shipments.filter(s => s.status === 'delivered').length}</strong></p>
              <button onClick={() => exportToCSV(shipments, 'shipments_report')} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Export Shipments to CSV</button>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px', textShadow: '1px 1px 0 #FF8C00' }}>Generate Reports</h2>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => exportToCSV(users, 'users_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Users Report (CSV)</button>
                <button onClick={() => exportToCSV(branches, 'branches_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Branches Report (CSV)</button>
                <button onClick={() => exportToCSV(shipments, 'shipments_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Shipments Report (CSV)</button>
                <button onClick={() => exportToCSV(trips, 'trips_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Trips Report (CSV)</button>
                <button onClick={() => exportToCSV(incidents, 'incidents_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Incidents Report (CSV)</button>
                <button onClick={() => exportToCSV(feedback, 'feedback_report')} style={{ padding: '10px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}>Export Feedback Report (CSV)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
