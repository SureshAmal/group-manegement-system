import React, { useState } from 'react';
import { auth } from './firebase';
import { useAuth } from './AuthContext';
import { ThemeToggle } from './ThemeProvider';
import './shadcn-modern.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await login();
      // The AuthContext will handle the role detection and routing automatically
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-root">
      <div className="modern-container" style={{ maxWidth: '400px' }}>
        <div className="modern-header">
          <div className="modern-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="modern-title">Welcome Back</h1>
              <p className="modern-subtitle">Sign in with Google to continue</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="modern-card">
          {error && (
            <div className="modern-alert modern-alert-error" style={{ position: 'static', marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          <button 
            onClick={handleGoogleLogin} 
            className="modern-btn modern-btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

