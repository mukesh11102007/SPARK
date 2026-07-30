import React, { useState } from 'react';

export const TeammateManager = () => {
  const [email, setEmail] = useState('');
  
  const handleInvite = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Invitation sent to ${email}`);
      setEmail('');
    }
  };

  return (
    <div className="sidebar-section">
      <h3>TEAMMATES</h3>
      <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input 
          type="email" 
          placeholder="teammate@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ide-input"
          required
        />
        <button type="submit" className="ide-btn ide-btn-secondary" style={{ marginTop: 0 }}>
          Add Teammate
        </button>
      </form>
    </div>
  );
};
