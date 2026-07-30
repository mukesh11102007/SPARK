import React from 'react';
import { useAutomation } from '../contexts/AutomationContext';

export const WorkflowDashboard = () => {
  const { statuses } = useAutomation();

  const workflows = [
    { id: 'watchdog', name: 'Watchdog (Errors)' },
    { id: 'deployment', name: 'Deployment (Vercel)' },
    { id: 'errorAlert', name: 'Error-Alert (Notifs)' },
    { id: 'versionControl', name: 'Version-Control (Rollback)' },
  ];

  return (
    <div className="sidebar-section">
      <h3>WORKFLOW AUTOMATIONS</h3>
      <div className="dashboard-list">
        {workflows.map(wf => (
          <div key={wf.id} className="dashboard-item">
            <span>{wf.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span className={`status-dot status-${statuses[wf.id]}`}></span>
               <span style={{ fontSize: '0.75rem', color: '#999', textTransform: 'capitalize' }}>
                 {statuses[wf.id]}
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
