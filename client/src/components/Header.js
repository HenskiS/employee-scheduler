import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function Header({isAuthenticated, logout}) {
  const handleLogout = () => {
    logout();
  }
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Employee Scheduler</Typography>
        {isAuthenticated ? 
          <Button color="inherit" onClick={handleLogout}>
            Log Out</Button>
         : null}
      </Toolbar>
    </AppBar>
  );
}

export default Header;