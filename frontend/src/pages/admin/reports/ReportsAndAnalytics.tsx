function ReportsAndAnalytics() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>Reports & Analytics</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Generate and view system reports</p>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3>Available Reports</h3>
        <ul>
          <li>Shipment Summary Report</li>
          <li>Revenue Report</li>
          <li>User Activity Report</li>
          <li>Branch Performance Report</li>
          <li>Driver Performance Report</li>
        </ul>
      </div>
    </div>
  );
}

export default ReportsAndAnalytics;
