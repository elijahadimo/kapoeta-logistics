import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function BranchModal({ isOpen, onClose, onSave, branch, mode }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    country: 'South Sudan',
    type: 'local',
    hasAgent: false,
    contactPhone: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (branch && mode === 'edit') {
      setFormData({
        name: branch.name || '',
        location: branch.location || '',
        country: branch.country || 'South Sudan',
        type: branch.type || 'local',
        hasAgent: branch.hasAgent || false,
        contactPhone: branch.contactPhone || '',
        isActive: branch.isActive !== undefined ? branch.isActive : true,
      });
    }
  }, [branch, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('access_token');
    
    try {
      if (mode === 'create') {
        await axios.post(`${API_URL}/branches`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.put(`${API_URL}/branches/${branch.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '450px',
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#FF6B35' }}>
          {mode === 'create' ? 'Add Branch' : 'Edit Branch'}
        </h2>
        
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Branch Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Country</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="Kenya">Kenya</option>
              <option value="South Sudan">South Sudan</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Branch Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="hq">Headquarters</option>
              <option value="border">Border Post</option>
              <option value="city">City Branch</option>
              <option value="local">Local Branch</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.hasAgent}
                onChange={(e) => setFormData({ ...formData, hasAgent: e.target.checked })}
              />
              Has Agent at this branch
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Contact Phone</label>
            <input
              type="text"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Branch is Active
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BranchModal;
