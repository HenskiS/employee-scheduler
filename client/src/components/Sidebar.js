import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

const Sidebar = ({ tab, onTabChange }) => {
  const tabs = ['DOCTORS', 'TECHNICIANS', 'USERS'];
  
  return (
    <Box sx={{ width: '20%', borderRight: 1, borderColor: 'divider', pr: 2 }}>
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{ borderRight: 1, borderColor: 'divider' }}
        TabIndicatorProps={{ sx: { left: 0, right: 'auto' } }}
      >
        {tabs.map((label, index) => (
          <Tab
            key={index}
            label={label}
            sx={{
              alignItems: 'flex-start',
              minWidth: 'unset',
              fontSize: '0.875rem',
              fontWeight: tab === index ? 'bold' : 'normal',
              color: tab === index ? 'primary.main' : 'text.primary',
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default Sidebar