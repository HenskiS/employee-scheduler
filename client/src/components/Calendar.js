import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventDialog from './EventDialog';
import { useScheduling } from './SchedulingContext';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

const localizer = momentLocalizer(moment);

const MyCalendar = ({ view }) => {
  const { technicians, events, refreshData, throughThirty, updateDateRange } = useScheduling()
  const [resources, setResources] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    let r
    if (view === "jobs")
      r = throughThirty.map(num => ({ id: num, title: num}))
    else r = technicians.map(technician => ({ id: technician.id, title: technician.name })) 
    setResources(r)
  }, [view, technicians])

  useEffect(() => {
    const start = moment(selectedDate).startOf('day');
    const end = moment(selectedDate).endOf('day');
    updateDateRange(start, end);
  }, [selectedDate, updateDateRange]);

  const findtechnicianById = (technicianId) => {
    return technicians.find(technician => technician.technician_id === technicianId) || null;
  };
  
  const findEventById = (eventId) => {
    return events.find(event => event.id === eventId) || null;
  };

  const handleSelectEvent = (e) => {
    const event = findEventById(e.id)
    setSelectedEvent(event);
    setNewEvent(null)
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    if (view === "jobs") {
      const { start, end, resourceId, slots } = slotInfo;

      let adjEnd = end
      if (slots.length === 2) {
        adjEnd = moment(start).add(4, 'hour');
      }

      const newEvent = {
        start,
        end: adjEnd,
        resourceId: resourceId,
        allDay: slots.length === 1
      };
      setSelectedEvent(null);
      setNewEvent(newEvent);
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = async (event) => {
    try {
      const user = {id: 1}
      const eventData = {...event, attendees: [event.technicianId] }

      if (event.id) {
        await axios.put(`/api/events/${event.id}`, eventData);
      } else {
        await axios.post('/api/events', eventData);
      }
      refreshData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const calendarStyle = {
    flex: 1,
    minHeight: 0,
    overflowX: 'auto',
    overflowY: 'auto'
  };

  return (
    <div className='cal-container'>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DatePicker
            label="Select Date"
            value={moment(selectedDate)}
            onChange={(newDate) => setSelectedDate(newDate.toDate())}
            sx={{ width: 200 }}
          />
        </LocalizationProvider>
      </Box>
      {isDialogOpen && (
        <EventDialog
          open={isDialogOpen}
          event={selectedEvent}
          newEvent={newEvent}
          onClose={handleCloseDialog} 
          onSave={handleSaveEvent}
        />
      )}
      <Calendar
        localizer={localizer}
        events={events.map(event => ({
          id: event.id,
          title: event.name,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          resourceId: view === "jobs" ? event.jobNumber : null,
          allDay: event.allDay
        }))}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['day', 'agenda']}
        step={30}
        timeslots={1}
        min={new Date(2024, 0, 1, 7, 0, 0)}
        max={new Date(2024, 0, 1, 21, 0, 0)}
        date={selectedDate}
        onNavigate={(date) => setSelectedDate(date)}
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable={true}
        style={calendarStyle}
      />
    </div>
  );
};

export default MyCalendar;