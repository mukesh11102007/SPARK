import React, { Component } from 'react';
import { triggerAutomation } from '../services/AutomationService';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // We update context via props or just call the service directly if outside context.
    // Since class components have a harder time with hooks, and this might be outside the provider,
    // we'll call the service directly and manually trigger the fallback alert if needed.
    // The user requested Watchdog to be triggered.
    try {
      // Simulate calling the watchdog
      if (this.props.onAutomationTrigger) {
         this.props.onAutomationTrigger('watchdog');
      }
      await triggerAutomation('watchdog', {
        error: error.toString(),
        stack: errorInfo.componentStack
      });
      if (this.props.onAutomationEnd) {
        this.props.onAutomationEnd('watchdog', 'idle');
      }
    } catch (e) {
      // Watchdog failed, trigger Error-Alert
      if (this.props.onAutomationEnd) {
        this.props.onAutomationEnd('watchdog', 'error');
        this.props.onAutomationTrigger('errorAlert');
      }
      try {
         await triggerAutomation('errorAlert', {
            message: "Watchdog failed to handle runtime error",
            originalError: error.toString()
         });
         if (this.props.onAutomationEnd) {
           this.props.onAutomationEnd('errorAlert', 'idle');
         }
      } catch (err) {
         if (this.props.onAutomationEnd) {
           this.props.onAutomationEnd('errorAlert', 'error');
         }
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--vscode-bg)', color: 'var(--vscode-text)', height: '100vh' }}>
          <div style={{ border: '1px solid #f14c4c', background: 'var(--vscode-sidebar)', padding: '2rem', borderRadius: '6px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f14c4c', marginBottom: '1rem' }}>⚠️ Runtime Error Detected</h2>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>The Watchdog automation is attempting to patch this issue and has sent an alert to your webhook.</p>
            <button className="ide-btn" onClick={() => window.location.reload()}>
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
