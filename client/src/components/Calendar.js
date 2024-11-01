import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../CalendarStyles.css';
import EventDialog from './EventDialog';
import { useScheduling } from './SchedulingContext';
import { Tabs, Tab, Box, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import CalendarHeader from './CalendarHeader';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const [tabValue, setTabValue] = useState(0);
  const [view, setView] = useState("jobs");
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setView(newValue ? "techs":"jobs")
  };
  const { technicians, events, refreshData, throughThirty, updateDateRange } = useScheduling()
  const [resources, setResources] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { colorMap } = useScheduling();

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
  }, [selectedDate]);

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
  const EventComponent = ({ event }) => {
    const backgroundColor = colorMap[event.label] || '#6b7280'; // default
    
    const style = {
      backgroundColor,
      color: 'black',
      padding: '4px 8px',
      borderRadius: '4px',
      overflow: 'hidden',
      fontSize: '14px',
      height: '100%',
      position: 'relative'
    };
  
    const timeStyle = {
      fontSize: '12px',
      marginBottom: '4px'
    };
  
    const titleStyle = {
      fontWeight: 'bold'
    };
  
    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');
    
    return (
      <div style={style}>
        <div style={timeStyle}>{`${startTime} – ${endTime}`}</div>
        <div style={titleStyle}>{event.title}</div>
      </div>
    );
  };

  return (
    <div className='cal-container'>
      <CalendarHeader 
        view={view}
        onViewChange={(newView) => setView(newView)}
        selectedDate={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
      />
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
          allDay: event.allDay,
          label: event.label
        }))}
        components={{
          event: EventComponent
        }}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['day', 'agenda']}
        step={60}
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
        length={1}
      />
    </div>
  );
};

export default MyCalendar;