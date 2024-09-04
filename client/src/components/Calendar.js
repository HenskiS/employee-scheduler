import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventDialog from './EventDialog';
import { useScheduling } from './SchedulingContext';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const { technicians } = useScheduling()
  //const [technicians, settechnicians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /*const fetchtechnicians = async () => {
    try {
      const response = await axios.get('/api/technicians');
      settechnicians(response.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };*/

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`/api/events/range/${selectedDate.toISOString()}/${selectedDate.toISOString()}`);
      const formattedEvents = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(`${selectedDate.toDateString()} ${event.time}`),
        end: new Date(`${selectedDate.toDateString()} ${moment(event.time, 'HH:mm').add(1, 'hour').format('HH:mm')}`),
        resourceId: event.technicianId,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    //fetchtechnicians();
    fetchEvents();
  }, [selectedDate]);

  const findtechnicianById = (technicianId) => {
    return technicians.find(technician => technician.technician_id === technicianId) || null;
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent(null)
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    const { start, end, resourceId } = slotInfo;
    const newEvent = {
      start,
      end,
      technician: findtechnicianById(resourceId),
    };
    setSelectedEvent(null);
    setNewEvent(newEvent);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = async (event) => {
    try {
      const eventData = {
        title: event.title,
        time: moment(event.start).format('HH:mm'),
        technicianId: event.resourceId,
      };

      if (event.id) {
        await axios.put(`/api/schedules/${event.id}`, eventData);
      } else {
        await axios.post('/api/schedules', eventData);
      }
      fetchEvents();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };


  return (
    <div>
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
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="day"
            views={['day']}
            step={60}
            timeslots={1}
            min={new Date(2023, 0, 1, 6, 0, 0)}
            max={new Date(2023, 0, 1, 21, 0, 0)}
            date={selectedDate}
            onNavigate={(date) => setSelectedDate(date)}
            resources={technicians.map(technician => ({ id: technician.technician_id, title: technician.name }))}
            //resourceIdAccessor="id"
            resourceTitleAccessor="title"
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={true}
            style={{ height: 'calc(100vh - 100px)' }}
        />
    </div>
  );
};

export default MyCalendar;
//test