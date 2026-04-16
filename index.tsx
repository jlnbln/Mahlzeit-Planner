import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, fontFamily: 'sans-serif' }}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Ein Fehler ist aufgetreten.</p>
          <p style={{ color: '#666', fontSize: 14 }}>{(this.state.error as Error).message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: '#426500', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
