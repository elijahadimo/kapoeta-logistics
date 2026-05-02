function SystemSettings() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>System Settings</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Configure system-wide settings</p>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3>System Configuration</h3>
        <p>Settings coming soon:</p>
        <ul>
          <li>Email Configuration</li>
          <li>SMS Gateway Settings</li>
          <li>Currency Rates</li>
          <li>Notification Preferences</li>
        </ul>
      </div>
    </div>
  );
}

export default SystemSettings;
