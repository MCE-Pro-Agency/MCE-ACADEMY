import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/db';
import ConfigMissing from './pages/ConfigMissing';
import './index.css';
import './public.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '14px', background: '#112842', color: '#fff', fontSize: '14px' },
              success: { iconTheme: { primary: '#2B9FDC', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <ConfigMissing />
    )}
  </React.StrictMode>
);
