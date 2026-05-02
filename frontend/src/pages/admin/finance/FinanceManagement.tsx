function FinanceManagement() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>Finance Management</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Track revenue, expenses, and COD collections</p>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3>Financial Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#666' }}>Today's Revenue</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0' }}>KES 0</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#666' }}>Pending COD</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0' }}>KES 0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceManagement;
