import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useScheduling } from './SchedulingContext';
import EventDialog from './EventDialog';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const [view, setView] = useState('jobs');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [events, setEvents] = useState([]);
  const { technicians } = useScheduling();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Adjust the URL and date format as needed for your API
        const response = await fetch(`http://localhost:5000/api/events`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Handle error (e.g., show an error message to the user)
      }
    };

    fetchEvents();
  }, [selectedDate]);

  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedEvent({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    console.log({
      start: slotInfo.start,
      end: slotInfo.end,
    })
    setShowEventDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  }, []);

  const handleCloseEventDialog = () => {
    setShowEventDialog(false);
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: '#3174ad',
      borderRadius: '0px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
  };

  const formats = {
    dayFormat: (date, culture, localizer) =>
      localizer.format(date, 'ddd MM/DD', culture),
  };

  const getCalendarView = () => {
    if (view === 'jobs') {
      return {
        groups: Array.from(new Set(events.map(event => event.jobNumber))),
        groupBy: 'jobNumber'
      };
    } else {
      return {
        groups: technicians.map(tech => tech.id),
        groupBy: 'technicianId'
      };
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => setView('jobs')}>Jobs View</button>
        <button onClick={() => setView('technicians')}>Technicians View</button>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 100px)' }}
        step={15}
        timeslots={4}
        defaultView="day"
        views={['day']}
        min={moment().hours(6).minutes(0).toDate()}
        max={moment().hours(21).minutes(0).toDate()}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        formats={formats}
        date={selectedDate}
        onNavigate={date => setSelectedDate(date)}
        {...getCalendarView()}
      />
      {showEventDialog && (
        <EventDialog
          event={selectedEvent}
          onClose={handleCloseEventDialog}
          view={view}
          onEventUpdate={(updatedEvent) => {
            setEvents(prevEvents => 
              prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e)
            );
          }}
          onEventCreate={(newEvent) => {
            setEvents(prevEvents => [...prevEvents, newEvent]);
          }}
        />
      )}
    </div>
  );
};

export default MyCalendar;