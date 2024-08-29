import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import Calendar from './Calendar';

function Schedule() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div>
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Jobs" />
        <Tab label="Techs" />
      </Tabs>
      <Box mt={2}>
        {tabValue === 0 && <Calendar view="jobs" />}
        {tabValue === 1 && <Calendar view="techs" />}
      </Box>
    </div>
  );
}

export default Schedule;