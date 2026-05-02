function RolesPermissions() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>Roles & Permissions</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Manage user roles and access permissions</p>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Permission</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Admin</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Agent</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Driver</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '8px' }}>Create Shipments</td><td>✅</td><td>✅</td><td>❌</td></tr>
            <tr><td style={{ padding: '8px' }}>View All Shipments</td><td>✅</td><td>❌</td><td>❌</td></tr>
            <tr><td style={{ padding: '8px' }}>Manage Users</td><td>✅</td><td>❌</td><td>❌</td></tr>
            <tr><td style={{ padding: '8px' }}>Manage Branches</td><td>✅</td><td>❌</td><td>❌</td></tr>
            <tr><td style={{ padding: '8px' }}>View Reports</td><td>✅</td><td>❌</td><td>❌</td></tr>
            <tr><td style={{ padding: '8px' }}>Manage Trips</td><td>✅</td><td>✅</td><td>✅</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RolesPermissions;
