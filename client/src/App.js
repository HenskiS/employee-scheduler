import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Header from './components/Header';
import Schedule from './components/Schedule';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Header />
      <Container>
        <Routes>
          <Route path="/" element={<Schedule />} />
          {/* Add more routes here if needed */}
        </Routes>
      </Container>
    </Router>
  );
}

export default App;