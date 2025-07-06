import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeProvider';
import AdminPanel from './AdminPage';
import LeaderPage from './LeaderPage';
import MemberPage from './MemberPage';
import LoginPage from './LoginPage';
import './shadcn-modern.css';

function AppContent() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="modern-root">
        <div className="modern-container">
          <div className="modern-loading">Loading application...</div>
        </div>
      </div>
    );
  }

  // If no user, show login
  if (!user) {
    return <LoginPage />;
  }

  // If user exists but no role, show loading
  if (!role) {
    return (
      <div className="modern-root">
        <div className="modern-container">
          <div className="modern-loading">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  // Render the appropriate page based on role
  let PageComponent;
  switch (role) {
    case 'admin':
      PageComponent = AdminPanel;
      break;
    case 'leader':
      PageComponent = LeaderPage;
      break;
    case 'member':
      PageComponent = MemberPage;
      break;
    default:
      PageComponent = MemberPage; // fallback
  }

  return (
    <Router>
      <Routes>
        <Route path="*" element={<PageComponent />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
