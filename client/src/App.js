import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Header from './components/Header';
import Schedule from './components/Schedule';
import Login from './components/Login';
import { SchedulingProvider } from './components/SchedulingContext';
import PrintCalendar from './components/PrintCalendar';

function ProtectedRoute({ children, isLoading }) {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const intendedPath = location.state?.from?.pathname || '/';
    navigate(intendedPath);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <>
      <CssBaseline />
      <Header isAuthenticated={isAuthenticated} logout={handleLogout} />
      <Container maxWidth={false}>
        <SchedulingProvider>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLoginSuccess={handleLoginSuccess} />
              } 
            />
            <Route
              path="/"
              element={
                <ProtectedRoute isLoading={isLoading}>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/print"
              element={
                <ProtectedRoute isLoading={isLoading}>
                  <PrintCalendar 
                    dateRange={{
                      start: '2024-10-01',
                      end: '2024-12-31'
                    }}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SchedulingProvider>
      </Container>
    </>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;