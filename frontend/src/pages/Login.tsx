import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { phone, password });
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const role = response.data.user.role;
      if (role === 'admin') window.location.href = '/admin/dashboard';
      else if (role === 'agent') window.location.href = '/agent/dashboard';
      else if (role === 'driver') window.location.href = '/driver/dashboard';
      else if (role === 'asst_driver') window.location.href = '/assistant/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#87CEEB',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        borderTop: '4px solid #FF8C00',
        borderBottom: '4px solid #FF8C00'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#FF8C00',
            borderRadius: '8px',
            margin: '0 auto 15px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold' }}>KL</span>
          </div>
          <h1 style={{ color: '#FF8C00', fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics & Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '5px 0 0 0' }}>fast. secure. affordable.</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FFEEEE',
            color: '#FF0000',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '12pt',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12pt', fontWeight: 'bold', color: '#333' }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #FF8C00',
                borderRadius: '4px',
                fontSize: '12pt',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your phone number"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12pt', fontWeight: 'bold', color: '#333' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #FF8C00',
                borderRadius: '4px',
                fontSize: '12pt',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FF8C00',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12pt',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '10pt', color: '#999' }}>
          © {currentYear} Kapoeta Logistics & Parcels
        </p>
      </div>
    </div>
  );
}

export default Login;
