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
import PrintDialog from './PrintDialog';
import PrintCalendar from './PrintCalendar';
import { useEffect } from 'react';
import axios from '../api/axios'
function Schedule() {
  const [tabValue, setTabValue] = useState(0);

  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintCalendarOpen, setIsPrintCalendarOpen] = useState(false);
  const [filterParams, setFilterParams] = useState()
  const [events, setEvents] = useState([])

  useEffect(()=>{
    if (filterParams) {
      const getEvents = async () => {
        const response = await axios.get(`/api/events/?start=${filterParams.startDate}&end=${filterParams.endDate}`)
        const filteredEvents = response.data
        setEvents(filteredEvents)
        console.log("FILTERED EVENTS")
        console.log(filteredEvents)
      }
      getEvents()
    }
  }, [filterParams])
  
  useEffect(() => {
    if (events.length) {
      setIsPrintCalendarOpen(true)
    }
  }, [events])
  

  const handleOpenPeopleDialog = () => {
    setIsPeopleDialogOpen(true);
  };

  const handleClosePeopleDialog = () => {
    setIsPeopleDialogOpen(false);
  };

  const handleOpenPrintDialog = () => {
    setIsPrintDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
  };

  const handleClosePrintCalendar = () => {
    setIsPrintCalendarOpen(false);
  };

  const handlePrint = (params) => {
    setFilterParams(params)
    setIsPrintCalendarOpen(true)
  }


  return (
    isPrintCalendarOpen ? 
      <PrintCalendar 
        eventsList={events} 
        viewMode={filterParams.view} 
        dateRange={{start: filterParams.startDate, end: filterParams.endDate}}
        close={handleClosePrintCalendar}
      />
      :
      <div>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
          <Button startIcon={<UsersIcon />} onClick={handleOpenPeopleDialog}>
            People
          </Button>
          <Button startIcon={<UsersIcon />} onClick={handleOpenPrintDialog}>
            Print
          </Button>
          <PeopleDialog open={isPeopleDialogOpen} onClose={handleClosePeopleDialog} />
          <PrintDialog open={isPrintDialogOpen} onClose={handleClosePrintDialog} onPrint={handlePrint} />
          <Button startIcon={<SettingsIcon />}>Settings</Button>
        </Box>
        <Box mt={2}>
          {tabValue === 0 && <Calendar view="jobs" />}
          {tabValue === 1 && <Calendar view="techs" />}
        </Box>
      </div>
  );
}

export default Schedule;