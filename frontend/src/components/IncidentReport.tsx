import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function IncidentReport({ shipmentId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'damage',
    severity: 'medium',
    description: '',
    shipmentId: shipmentId,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      await axios.post(`${API_URL}/incidents`, {
        ...formData,
        reportedBy: user.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Incident reported successfully');
      onSuccess();
    } catch (error) {
      alert('Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
      <h3>Report Incident</h3>
      <form onSubmit={handleSubmit}>
        <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
          <option value="damage">Damage</option>
          <option value="loss">Loss</option>
          <option value="theft">Theft</option>
          <option value="accident">Accident</option>
          <option value="delay">Delay</option>
        </select>
        <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <textarea placeholder="Describe the incident..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        <button type="submit" disabled={loading}>Submit Report</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

export default IncidentReport;
