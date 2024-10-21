import React, { useState } from 'react';
import { Tabs, Tab, Box, Button } from '@mui/material';
import { 
  LocalHospital as DoctorIcon,
  Engineering as TechnicianIcon,
  People as UsersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import Calendar from './Calendar';
import PeopleDialog from './PeopleDialog';

function Schedule() {
  const [tabValue, setTabValue] = useState(0);

  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);

  const handleOpenPeopleDialog = () => {
    setIsPeopleDialogOpen(true);
  };

  const handleClosePeopleDialog = () => {
    setIsPeopleDialogOpen(false);
  };

  /*const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };*/

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
        {/*<Button startIcon={<DoctorIcon />}>Doctors</Button>
        <Button startIcon={<TechnicianIcon />}>Technicians</Button>*/}
        <Button startIcon={<UsersIcon />} onClick={handleOpenPeopleDialog}>
          People
        </Button>
        <PeopleDialog open={isPeopleDialogOpen} onClose={handleClosePeopleDialog} />
        <Button startIcon={<SettingsIcon />}>Settings</Button>
      </Box>
      {/*<Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Jobs" />
        <Tab label="Techs" />
      </Tabs>*/}
      <Box mt={2}>
        {tabValue === 0 && <Calendar view="jobs" />}
        {tabValue === 1 && <Calendar view="techs" />}
      </Box>
    </div>
  );
}

export default Schedule;