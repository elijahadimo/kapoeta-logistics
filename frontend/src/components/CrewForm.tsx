import { useState } from 'react';

interface CrewMember {
  id?: string;
  name: string;
  phone: string;
  role: string;
  agreementSigned: boolean;
  paymentType: string;
  amount: string;
  currency: string;
  paymentStatus: string;
}

interface CrewFormProps {
  type: 'loading' | 'unloading';
  onSave: (crewMembers: CrewMember[]) => void;
  onCancel: () => void;
  existingCrew?: CrewMember[];
}

function CrewForm({ type, onSave, onCancel, existingCrew = [] }: CrewFormProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(
    existingCrew.length > 0 ? existingCrew : [{ name: '', phone: '', role: 'loader', agreementSigned: false, paymentType: 'individual', amount: '', currency: 'KES', paymentStatus: 'pending' }]
  );

  const addCrewMember = () => {
    setCrewMembers([...crewMembers, { name: '', phone: '', role: 'loader', agreementSigned: false, paymentType: 'individual', amount: '', currency: 'KES', paymentStatus: 'pending' }]);
  };

  const removeCrewMember = (index: number) => {
    const updated = [...crewMembers];
    updated.splice(index, 1);
    setCrewMembers(updated);
  };

  const updateCrewMember = (index: number, field: string, value: any) => {
    const updated = [...crewMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCrewMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(crewMembers);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #FF8C00' }}>
      <h3 style={{ color: '#FF8C00', marginTop: 0 }}>{type === 'loading' ? 'Loading Crew' : 'Unloading Crew'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
          {crewMembers.map((member, idx) => (
            <div key={idx} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Crew Member {idx + 1}</strong>
                {crewMembers.length > 1 && (
                  <button type="button" onClick={() => removeCrewMember(idx)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Full Name" value={member.name} onChange={(e) => updateCrewMember(idx, 'name', e.target.value)} required style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <input type="tel" placeholder="Phone Number" value={member.phone} onChange={(e) => updateCrewMember(idx, 'phone', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <select value={member.role} onChange={(e) => updateCrewMember(idx, 'role', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="loader">Loader</option>
                  <option value="unloader">Unloader</option>
                  <option value="supervisor">Supervisor</option>
                </select>
                <select value={member.paymentType} onChange={(e) => updateCrewMember(idx, 'paymentType', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="individual">Individual Payment</option>
                  <option value="bulk">Bulk Payment</option>
                </select>
                <input type="number" placeholder="Amount" value={member.amount} onChange={(e) => updateCrewMember(idx, 'amount', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }} />
                <select value={member.currency} onChange={(e) => updateCrewMember(idx, 'currency', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="KES">KES</option>
                  <option value="SSP">SSP</option>
                  <option value="USD">USD</option>
                </select>
                <select value={member.paymentStatus} onChange={(e) => updateCrewMember(idx, 'paymentStatus', e.target.value)} style={{ padding: '8px', border: '1px solid #FF8C00', borderRadius: '4px' }}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={member.agreementSigned} onChange={(e) => updateCrewMember(idx, 'agreementSigned', e.target.checked)} />
                  <span>Agreement Signed</span>
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <button type="button" onClick={addCrewMember} style={{ marginBottom: '15px', padding: '8px 16px', backgroundColor: '#87CEEB', border: '1px solid #FF8C00', borderRadius: '4px', cursor: 'pointer' }}>+ Add Crew Member</button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Crew</button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CrewForm;
