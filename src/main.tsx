
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Create a simple wrapper that delays app initialization
const AppWrapper = () => {
  // Dynamically import App after React is ready
  const App = require('./App.tsx').default;
  return <App />;
};

const container = document.getElementById('root')

if (!container) {
  throw new Error('Failed to find the root element')
}

// Ensure DOM is ready before initializing React
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  try {
    const root = createRoot(container!);
    root.render(
      <StrictMode>
        <AppWrapper />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize React app:', error);
    // Fallback: show error message in container
    container!.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc2626;">
        <h2>Application Error</h2>
        <p>Failed to load the application. Please refresh the page.</p>
        <details style="margin-top: 10px;">
          <summary>Error Details</summary>
          <pre style="text-align: left; background: #f3f4f6; padding: 10px; margin-top: 10px;">${error}</pre>
        </details>
      </div>
    `;
  }
}
