import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function FinancialDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [summary, setSummary] = useState({
    KES: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0, profit: 0 },
    SSP: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0, profit: 0 },
    USD: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0, profit: 0 }
  });
  
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

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
    setLoading(true);
    try {
      const [shipmentsRes, expensesRes, salariesRes] = await Promise.all([
        axios.get(`${API_URL}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/expenses`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/salaries`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      
      setShipments(shipmentsRes.data);
      setExpenses(expensesRes.data);
      setSalaries(salariesRes.data);
      calculateSummary(shipmentsRes.data, expensesRes.data, salariesRes.data);
      
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (shipmentsData, expensesData, salariesData) => {
    // Apply date filter
    let filteredShipments = [...shipmentsData];
    if (startDate) {
      filteredShipments = filteredShipments.filter(s => new Date(s.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filteredShipments = filteredShipments.filter(s => new Date(s.createdAt) <= new Date(endDate));
    }
    
    const currencyTotals = {
      KES: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0 },
      SSP: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0 },
      USD: { revenue: 0, codCollected: 0, pendingCOD: 0, expenses: 0 }
    };
    
    filteredShipments.forEach((s: any) => {
      const currency = s.currency || 'KES';
      const amount = Number(s.shippingCost) || 0;
      
      if (s.status === 'delivered') {
        currencyTotals[currency].revenue += amount;
        if (s.paymentMethod === 'cod') {
          currencyTotals[currency].codCollected += amount;
        }
      } else if (s.paymentMethod === 'cod' && s.status !== 'delivered') {
        currencyTotals[currency].pendingCOD += amount;
      }
    });
    
    // Filter expenses by date
    let filteredExpenses = [...expensesData];
    if (startDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.createdAt) <= new Date(endDate));
    }
    
    filteredExpenses.forEach((e: any) => {
      const currency = e.currency || 'KES';
      if (currencyTotals[currency]) {
        currencyTotals[currency].expenses += Number(e.amount) || 0;
      }
    });
    
    let filteredSalaries = [...salariesData];
    if (startDate) {
      filteredSalaries = filteredSalaries.filter(s => new Date(s.paidAt) >= new Date(startDate));
    }
    if (endDate) {
      filteredSalaries = filteredSalaries.filter(s => new Date(s.paidAt) <= new Date(endDate));
    }
    
    filteredSalaries.forEach((sal: any) => {
      const currency = sal.currency || 'KES';
      if (currencyTotals[currency]) {
        currencyTotals[currency].expenses += Number(sal.netPay) || 0;
      }
    });
    
    setSummary({
      KES: { 
        revenue: currencyTotals.KES.revenue, 
        codCollected: currencyTotals.KES.codCollected, 
        pendingCOD: currencyTotals.KES.pendingCOD, 
        expenses: currencyTotals.KES.expenses,
        profit: currencyTotals.KES.revenue - currencyTotals.KES.expenses
      },
      SSP: { 
        revenue: currencyTotals.SSP.revenue, 
        codCollected: currencyTotals.SSP.codCollected, 
        pendingCOD: currencyTotals.SSP.pendingCOD, 
        expenses: currencyTotals.SSP.expenses,
        profit: currencyTotals.SSP.revenue - currencyTotals.SSP.expenses
      },
      USD: { 
        revenue: currencyTotals.USD.revenue, 
        codCollected: currencyTotals.USD.codCollected, 
        pendingCOD: currencyTotals.USD.pendingCOD, 
        expenses: currencyTotals.USD.expenses,
        profit: currencyTotals.USD.revenue - currencyTotals.USD.expenses
      }
    });
    
    // Monthly revenue by currency
    const monthlyMap = new Map();
    filteredShipments.filter((s: any) => s.status === 'delivered').forEach((s: any) => {
      const month = new Date(s.createdAt).toLocaleString('default', { month: 'short' });
      const currency = s.currency || 'KES';
      const key = `${month}-${currency}`;
      monthlyMap.set(key, {
        month,
        currency,
        amount: (monthlyMap.get(key)?.amount || 0) + Number(s.shippingCost)
      });
    });
    
    setMonthlyRevenue(Array.from(monthlyMap.values()));
  };

  const applyDateFilter = () => {
    fetchData();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchData(), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const exportToCSV = () => {
    let filteredShipments = [...shipments];
    if (startDate) {
      filteredShipments = filteredShipments.filter(s => new Date(s.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filteredShipments = filteredShipments.filter(s => new Date(s.createdAt) <= new Date(endDate));
    }
    if (selectedCurrency !== 'all') {
      filteredShipments = filteredShipments.filter(s => (s.currency || 'KES') === selectedCurrency);
    }
    
    const headers = ['Tracking', 'Sender', 'Receiver', 'Amount', 'Currency', 'Payment Method', 'Status', 'Date'];
    const rows = filteredShipments.map(s => [
      s.trackingNumber, s.senderName, s.receiverName, s.shippingCost, s.currency || 'KES', s.paymentMethod, s.status, new Date(s.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredShipments = () => {
    let filtered = [...shipments];
    if (startDate) {
      filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(endDate));
    }
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(s => (s.currency || 'KES') === selectedCurrency);
    }
    return filtered;
  };

  const totalRevenue = summary.KES.revenue + summary.SSP.revenue + summary.USD.revenue;
  const totalCODCollected = summary.KES.codCollected + summary.SSP.codCollected + summary.USD.codCollected;
  const totalPendingCOD = summary.KES.pendingCOD + summary.SSP.pendingCOD + summary.USD.pendingCOD;
  const totalExpenses = summary.KES.expenses + summary.SSP.expenses + summary.USD.expenses;
  const totalProfit = totalRevenue - totalExpenses;

  if (loading) {
    return <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const filteredShipments = getFilteredShipments();

  return (
    <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #FF8C00', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#FF8C00', fontSize: '12pt', fontWeight: 'bold', margin: 0 }}>Kapoeta Logistics and Parcels</h1>
          <p style={{ color: '#FF8C00', fontSize: '12pt', margin: '2px 0 0 0' }}>fast. secure. affordable.</p>
          <p style={{ color: '#FF8C00', fontSize: '10pt', margin: '5px 0 0 0' }}>Financial Dashboard - {user.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Back to Dashboard</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Financial Dashboard</h2>

        {/* Date Filter Section */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #FF8C00' }}>
          <h3 style={{ color: '#FF8C00', marginTop: 0 }}>Date Range Filter</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12pt', marginBottom: '5px' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
            </div>
            <div>
              <button onClick={applyDateFilter} style={{ padding: '8px 20px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Filter</button>
              <button onClick={clearDateFilter} style={{ marginLeft: '10px', padding: '8px 20px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>Clear Filter</button>
            </div>
          </div>
        </div>

        {/* Total Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #FF8C00' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '12pt' }}>Total Revenue (All Currencies)</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#10b981' }}>
              KES {totalRevenue.toLocaleString()} | SSP {summary.SSP.revenue.toLocaleString()} | USD {summary.USD.revenue.toLocaleString()}
            </p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #FF8C00' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '12pt' }}>COD Collected</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#f59e0b' }}>
              KES {summary.KES.codCollected.toLocaleString()} | SSP {summary.SSP.codCollected.toLocaleString()} | USD {summary.USD.codCollected.toLocaleString()}
            </p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #FF8C00' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '12pt' }}>Pending COD</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#ef4444' }}>
              KES {summary.KES.pendingCOD.toLocaleString()} | SSP {summary.SSP.pendingCOD.toLocaleString()} | USD {summary.USD.pendingCOD.toLocaleString()}
            </p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #FF8C00' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '12pt' }}>Net Profit</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0 0 0', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
              KES {summary.KES.profit.toLocaleString()} | SSP {summary.SSP.profit.toLocaleString()} | USD {summary.USD.profit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Currency Breakdown Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #10b981' }}>
            <h3 style={{ color: '#10b981', marginTop: 0 }}>Kenyan Shilling (KES)</h3>
            <p><strong>Revenue:</strong> KES {summary.KES.revenue.toLocaleString()}</p>
            <p><strong>COD Collected:</strong> KES {summary.KES.codCollected.toLocaleString()}</p>
            <p><strong>Pending COD:</strong> KES {summary.KES.pendingCOD.toLocaleString()}</p>
            <p><strong>Expenses:</strong> KES {summary.KES.expenses.toLocaleString()}</p>
            <p><strong>Profit:</strong> <span style={{ color: summary.KES.profit >= 0 ? '#10b981' : '#ef4444' }}>KES {summary.KES.profit.toLocaleString()}</span></p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <h3 style={{ color: '#f59e0b', marginTop: 0 }}>South Sudanese Pound (SSP)</h3>
            <p><strong>Revenue:</strong> SSP {summary.SSP.revenue.toLocaleString()}</p>
            <p><strong>COD Collected:</strong> SSP {summary.SSP.codCollected.toLocaleString()}</p>
            <p><strong>Pending COD:</strong> SSP {summary.SSP.pendingCOD.toLocaleString()}</p>
            <p><strong>Expenses:</strong> SSP {summary.SSP.expenses.toLocaleString()}</p>
            <p><strong>Profit:</strong> <span style={{ color: summary.SSP.profit >= 0 ? '#10b981' : '#ef4444' }}>SSP {summary.SSP.profit.toLocaleString()}</span></p>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>US Dollar (USD)</h3>
            <p><strong>Revenue:</strong> USD {summary.USD.revenue.toLocaleString()}</p>
            <p><strong>COD Collected:</strong> USD {summary.USD.codCollected.toLocaleString()}</p>
            <p><strong>Pending COD:</strong> USD {summary.USD.pendingCOD.toLocaleString()}</p>
            <p><strong>Expenses:</strong> USD {summary.USD.expenses.toLocaleString()}</p>
            <p><strong>Profit:</strong> <span style={{ color: summary.USD.profit >= 0 ? '#10b981' : '#ef4444' }}>USD {summary.USD.profit.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Shipment Transactions */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF8C00' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ color: '#FF8C00', margin: 0 }}>Shipment Transactions</h3>
            <div>
              <label style={{ marginRight: '10px' }}>Filter by Currency:</label>
              <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                <option value="all">All Currencies</option>
                <option value="KES">KES Only</option>
                <option value="SSP">SSP Only</option>
                <option value="USD">USD Only</option>
              </select>
              <button onClick={exportToCSV} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#FF8C00', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Export to CSV</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#FF8C00', color: '#FFFFFF' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Tracking</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Sender</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Currency</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Payment</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.slice(0, 50).map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{s.trackingNumber}</td>
                    <td style={{ padding: '8px' }}>{s.senderName}</td>
                    <td style={{ padding: '8px' }}>{s.shippingCost}</td>
                    <td style={{ padding: '8px' }}><strong>{s.currency || 'KES'}</strong></td>
                    <td style={{ padding: '8px' }}>{s.paymentMethod}</td>
                    <td style={{ padding: '8px' }}>{s.status}</td>
                    <td style={{ padding: '8px' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialDashboard;
