import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../CalendarStyles.css';
import EventDialog from './EventDialog';
import { useScheduling } from './SchedulingContext';
import CalendarHeader from './CalendarHeader';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const [view, setView] = useState("jobs");
  const { technicians, events, refreshData, throughThirty, updateDateRange } = useScheduling();
  const [resources, setResources] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { colorMap } = useScheduling();

  // Modified to handle both job numbers and technician resources
  useEffect(() => {
    let r;
    if (view === "jobs") {
      r = throughThirty.map(num => ({ id: num, title: num }));
    } else {
      r = technicians.map(technician => ({ 
        id: technician.id, 
        title: technician.name 
      }));
    }
    setResources(r);
  }, [view, technicians, throughThirty]);

  useEffect(() => {
    const start = moment(selectedDate).startOf('day');
    const end = moment(selectedDate).endOf('day');
    updateDateRange(start, end);
  }, [selectedDate]);

  const findEventById = (eventId) => {
    return events.find(event => event.id === eventId) || null;
  };

  const handleSelectEvent = (e) => {
    const event = findEventById(e.id);
    setSelectedEvent(event);
    setNewEvent(null);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    if (view === "jobs") {
      const { start, end, resourceId, slots } = slotInfo;
      let adjEnd = end;
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
      const eventData = {...event, attendees: [event.technicianId] };
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

  // Modified to create multiple events for each technician assignment
  const processEvents = () => {
    return events.flatMap(event => {
      if (view === "jobs") {
        return [{
          id: event.id,
          title: event.name,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          resourceId: event.jobNumber,
          allDay: event.allDay,
          label: event.label
        }];
      } else {
        // Create an event instance for each technician assigned to the event
        return (event.Technicians || []).map(technician => ({
          id: event.id,
          title: event.name,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          resourceId: technician.id, // Use technician ID as resource ID
          allDay: event.allDay,
          label: event.label
        }));
      }
    });
  };

  const EventComponent = ({ event }) => {
    const backgroundColor = colorMap[event.label] || '#6b7280';
    
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
        events={processEvents()}
        components={{
          event: EventComponent
        }}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['day', 'agenda']}
        step={60}
        length={0}
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
        style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
      />
    </div>
  );
};

export default MyCalendar;