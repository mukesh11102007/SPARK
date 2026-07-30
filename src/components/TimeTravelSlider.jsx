import React, { useState, useEffect } from 'react';
import { useAutomation } from '../contexts/AutomationContext';

export const TimeTravelSlider = () => {
  const { runAutomation } = useAutomation();
  const [historyIndex, setHistoryIndex] = useState(100); // 100 is current state
  const [debouncedIndex, setDebouncedIndex] = useState(historyIndex);

  // Debounce the slider to avoid spamming the webhook
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedIndex !== historyIndex) {
        setDebouncedIndex(historyIndex);
        triggerRollback(historyIndex);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [historyIndex]);

  const triggerRollback = async (index) => {
    try {
      await runAutomation('versionControl', { targetStateIndex: index });
    } catch (e) {
      console.warn("Version control webhook failed, this is expected with dummy URLs.");
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Time-Travel Canvas</h3>
      <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
        Slide to fetch previous states from Supabase via the Version-Control webhook.
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Past</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={historyIndex} 
          onChange={(e) => setHistoryIndex(parseInt(e.target.value, 10))}
        />
        <span>Present</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
        State Version: {historyIndex}%
      </div>
    </div>
  );
};
