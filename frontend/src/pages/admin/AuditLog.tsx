import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function AuditLog() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [users, setUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLogs();
    fetchUsers();
  }, []);

  const fetchLogs = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      let url = `${API_URL}/audit`;
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterUser) params.append('userId', filterUser);
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Fetch logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilterAction('');
    setFilterUser('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchLogs(), 100);
  };

  const exportToCSV = () => {
    const headers = ['User', 'Role', 'Action', 'Entity', 'Description', 'Time', 'IP Address'];
    const rows = logs.map(log => [
      log.userName, log.userRole, log.action, log.entity, log.description || '-', new Date(log.createdAt).toLocaleString(), log.ipAddress || '-'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action) => {
    const colors = {
      create: '#10b981',
      update: '#87CEEB',
      delete: '#ef4444',
      login: '#3b82f6',
      logout: '#6b7280',
      view: '#8b5cf6',
      export: '#f59e0b'
    };
    return colors[action] || '#6b7280';
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
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
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Audit Log - {user.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Audit Log - User Activity Tracker</h2>

        {/* Filters */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Filters</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Action Type</label>
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', width: '120px' }}>
                <option value="">All</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="view">View</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>User</label>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px', width: '150px' }}>
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            </div>
            <div>
              <button onClick={applyFilters} style={{ padding: '8px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Filters</button>
              <button onClick={clearFilters} style={{ marginLeft: '10px', padding: '8px 20px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Clear Filters</button>
              <button onClick={exportToCSV} style={{ marginLeft: '10px', padding: '8px 20px', backgroundColor: '#10b981', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Export to CSV</button>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'auto', border: '1px solid #FF8C00' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Entity</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>No audit logs found</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{log.userName}</td>
                    <td style={{ padding: '10px' }}>{log.userRole}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: getActionColor(log.action), color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10pt' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px' }}>{log.entity}</td>
                    <td style={{ padding: '10px' }}>{log.description || '-'}</td>
                    <td style={{ padding: '10px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{log.ipAddress || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLog;
