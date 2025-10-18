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
  const { technicians, events, refreshData, jobNumberOptions, updateDateRange } = useScheduling();
  const [resources, setResources] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { colorMap } = useScheduling();
  const [currentView, setCurrentView] = useState('day'); // cal view (day/agenda)
  const [conflictError, setConflictError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Modified to handle job numbers, technician, and doctor resources
  useEffect(() => {
    let r = [];
    if (view === "jobs") {
      r = jobNumberOptions.map(num => ({ id: num, title: num }));
    } else if (view === "techs") {
      r = technicians.map(technician => ({
        id: technician.id,
        title: technician.name
      }));
    } else if (view === "doctors") {
      // Extract unique doctors from events that have them AND are on the selected date
      const startOfDay = moment(selectedDate).startOf('day');
      const endOfDay = moment(selectedDate).endOf('day');

      const doctorsMap = new Map();
      events.forEach(event => {
        if (event.Doctor && event.Doctor.id) {
          // Check if event is on the selected date
          const eventStart = moment(event.startTime);
          const eventEnd = moment(event.endTime);

          if ((eventStart.isSameOrAfter(startOfDay) && eventStart.isSameOrBefore(endOfDay)) ||
              (eventEnd.isSameOrAfter(startOfDay) && eventEnd.isSameOrBefore(endOfDay)) ||
              (eventStart.isBefore(startOfDay) && eventEnd.isAfter(endOfDay))) {
            const doctorKey = event.Doctor.id;
            if (!doctorsMap.has(doctorKey)) {
              const doctorName = event.Doctor.customer || 'Unknown Doctor';
              doctorsMap.set(doctorKey, {
                id: doctorKey,
                title: doctorName
              });
            }
          }
        }
      });
      r = Array.from(doctorsMap.values());
    }
    setResources(r);
  }, [view, technicians, jobNumberOptions, events, selectedDate]);

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
    setConflictError(null); // Clear any previous conflicts
    setIsDialogOpen(true); 
  };

  const handleSelectSlot = (slotInfo) => {
    // if (view === "jobs" || view === "techs") {
      const { start, end, resourceId, slots } = slotInfo;
      let adjEnd = end;
      if (slots.length === 2) {
        adjEnd = moment(start).add(4, 'hour');
      }

      const newEvent = {
        start,
        end: adjEnd,
        resourceId: resourceId,
        allDay: slots.length === 1,
        view
      };
      setSelectedEvent(null);
      setNewEvent(newEvent);
      setConflictError(null); // Clear any previous conflicts
      setIsDialogOpen(true);
    // }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
    setNewEvent(null);
    setConflictError(null); // Clear conflicts when closing
    setGeneralError(null); // Clear general errors when closing
  };

  const handleSaveEvent = async (event, updateType = 'single', force = false) => {
    try {
      let url;
      let response;
      
      if (event.id) {
        url = `/events/${event.id}?updateType=${updateType}`;
        if (force) url += '&force=true';
        response = await axios.put(url, event);
      } else {
        url = '/events';
        if (force) url += '?force=true';
        response = await axios.post(url, event);
      }
      
      // If successful, refresh data and close dialog
      refreshData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);

      // Check if it's a conflict error
      if (error.response && error.response.status === 409 && error.response.data.hasConflicts) {
        setConflictError(error.response.data);
        setGeneralError(null);
        // Don't close the dialog - let user decide what to do
      } else {
        // For other errors, show a general error message
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred while saving the event';
        setGeneralError(errorMessage);
        setConflictError(null);
        console.error('Non-conflict error:', error);
      }
    }
  };

  const handleDeleteEvent = async (deleteType = 'single') => {
    if (selectedEvent?.id) {
      try {
        await axios.delete(`/events/${selectedEvent.id}?deleteType=${deleteType}`);
        refreshData();
        handleCloseDialog();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  const handleNavigate = (date, view, action) => {
    if (view === 'agenda') {
      let newDate = selectedDate;
      switch (action) {
        case 'PREV':
          newDate = moment(date).subtract(1, 'day').toDate();
          break;
        case 'NEXT':
          newDate = moment(date).add(1, 'day').toDate();
          break;
        case 'TODAY':
          newDate = new Date();
          break;
        default:
          newDate = date;
      }
      setSelectedDate(newDate);
    } else {
      setSelectedDate(date);
    }
  };

  const processEvents = () => {
    return events.flatMap(event => {
      if (view === "jobs") {
        // Create an event instance for each job number assigned to the event
        const jobNumbers = event.jobNumbers || [];
        if (jobNumbers.length === 0) {
          // If no job numbers, still show the event but without a resource
          return [{
            id: event.id,
            title: event.name,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            description: event.description,
            resourceId: null,
            allDay: event.allDay,
            label: event.label,
            Doctor: event.Doctor
          }];
        }

        return jobNumbers.map(jobNumber => ({
          id: event.id,
          title: event.name,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          description: event.description,
          resourceId: jobNumber,
          allDay: event.allDay,
          label: event.label,
          Doctor: event.Doctor
        }));
      } else if (view === "techs") {
        // Create an event instance for each technician assigned to the event
        return (event.Technicians || []).map(technician => ({
          id: event.id,
          title: event.name,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          description: event.description,
          resourceId: technician.id, // Use technician ID as resource ID
          allDay: event.allDay,
          label: event.label,
          Doctor: event.Doctor
        }));
      } else if (view === "doctors") {
        // Create an event instance for the doctor assigned to the event
        if (event.Doctor && event.Doctor.id) {
          return [{
            id: event.id,
            title: event.name,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            description: event.description,
            resourceId: event.Doctor.id, // Use doctor ID as resource ID
            allDay: event.allDay,
            label: event.label,
            Doctor: event.Doctor
          }];
        }
        // If no doctor, don't show the event in doctors view
        return [];
      }
      return [];
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

    let dr = ""
    if (event.Doctor?.customer) dr += event.Doctor.customer
    if (event.Doctor?.city) dr += " - " + event.Doctor.city
    
    return (
      <div style={style}>
        <div style={timeStyle}>{`${startTime} – ${endTime}`}</div>
        <div style={titleStyle}>{event.title}</div>
        <div style={timeStyle}>{event.description}</div>
        <div style={timeStyle}>{dr}</div>
      </div>
    );
  };

  return (
    <div className='home-cal'>
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
          onDelete={handleDeleteEvent}
          conflictError={conflictError}
          onClearConflicts={() => setConflictError(null)}
          generalError={generalError}
          onClearGeneralError={() => setGeneralError(null)}
        />
      )}
      {(view === "doctors" && resources.length === 0) ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No doctors scheduled for this day
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={processEvents()}
          components={{
            event: EventComponent
          }}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          views={['day', 'agenda']}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          step={60}
          length={0}
          timeslots={1}
          min={new Date(2024, 0, 1, 7, 0, 0)}
          max={new Date(2024, 0, 1, 21, 0, 0)}
          date={selectedDate}
          //onNavigate={(date) => setSelectedDate(date)}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
        />
      )}
    </div>
  );
};

export default MyCalendar;