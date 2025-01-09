import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import axios from '../api/axios';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.username || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      const response = await axios.post('/users/login', formData);
      
      // Store token securely
      localStorage.setItem('token', response.data.token);
      
      // Clear sensitive data
      setFormData({ username: '', password: '' });
      
      // Notify parent component of successful login
      onLoginSuccess();
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, width: 300 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            name="username"
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="username"
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </form>
      </Paper>
    </Box>
  );
}

export default Login;