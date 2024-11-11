// Based on this app.js, write a logout function that I can copy paste into my page header file
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Header from './components/Header';
import Schedule from './components/Schedule';
import Login from './components/Login';
import { SchedulingProvider } from './components/SchedulingContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLoginSuccess = () => {
    console.log('Login successful, setting authenticated state');
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, navigating to home');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <CssBaseline />
      <Header isAuthenticated={isAuthenticated} logout={handleLogout} />
      <Container maxWidth={false}>
        <SchedulingProvider>
          <Routes>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route
              path="/"
              element={isAuthenticated ? <Schedule /> : <Navigate to="/login" />}
            />
            {/* Add more protected routes here if needed */}
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