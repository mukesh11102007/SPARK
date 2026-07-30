import React, { createContext, useState, useContext, useCallback } from 'react';
import { triggerAutomation as triggerAutomationApi } from '../services/AutomationService';

const AutomationContext = createContext();

export const useAutomation = () => useContext(AutomationContext);

export const AutomationProvider = ({ children }) => {
  const [statuses, setStatuses] = useState({
    watchdog: 'idle', // idle | active | error
    deployment: 'idle',
    errorAlert: 'idle',
    versionControl: 'idle',
  });

  const runAutomation = useCallback(async (workflowName, payload) => {
    setStatuses((prev) => ({ ...prev, [workflowName]: 'active' }));
    try {
      const result = await triggerAutomationApi(workflowName, payload);
      setStatuses((prev) => ({ ...prev, [workflowName]: 'idle' }));
      return result;
    } catch (error) {
      setStatuses((prev) => ({ ...prev, [workflowName]: 'error' }));
      throw error;
    }
  }, []);

  return (
    <AutomationContext.Provider value={{ statuses, runAutomation }}>
      {children}
    </AutomationContext.Provider>
  );
};
