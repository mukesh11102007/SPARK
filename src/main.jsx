import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Global Error Caught]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0d0d12',
          color: '#f87171', fontFamily: 'system-ui, sans-serif', padding: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>⚠️ SPARK Studio Runtime Encountered an Issue</h2>
          <pre style={{
            background: '#1a1a24', padding: '1rem', borderRadius: '8px',
            color: '#fca5a5', maxWidth: '800px', overflowX: 'auto', border: '1px solid #2e2e3e'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.6rem 1.2rem', borderRadius: '6px',
              background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
