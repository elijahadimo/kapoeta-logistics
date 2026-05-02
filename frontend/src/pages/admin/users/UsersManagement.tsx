import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const [usersRes, branchesRes] = await Promise.all([
        axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      admin: '#ef4444',
      agent: '#f59e0b',
      driver: '#10b981',
      asst_driver: '#87CEEB',
    };
    return { backgroundColor: colors[role] || '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', display: 'inline-block' };
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>User Management</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Manage system users and permissions</p>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Branch</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}><strong>{user.name}</strong></td>
                  <td style={{ padding: '12px' }}>{user.phone}</td>
                  <td style={{ padding: '12px' }}><span style={getRoleBadge(user.role)}>{user.role.toUpperCase()}</span></td>
                  <td style={{ padding: '12px' }}>{branches.find((b: any) => b.id === user.branchId)?.name || '-'}</td>
                  <td style={{ padding: '12px' }}><span style={{ color: user.isActive ? '#10b981' : '#ef4444' }}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default UsersManagement;
