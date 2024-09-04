import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const [technicians, settechnicians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchtechnicians = async () => {
    try {
      const response = await axios.get('/api/technicians');
      settechnicians(response.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`/api/events/range/${selectedDate.toISOString()}/${selectedDate.toISOString()}`);
      const formattedEvents = response.data.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        start: new Date(`${selectedDate.toDateString()} ${schedule.time}`),
        end: new Date(`${selectedDate.toDateString()} ${moment(schedule.time, 'HH:mm').add(1, 'hour').format('HH:mm')}`),
        resourceId: schedule.technicianId,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  useEffect(() => {
    fetchtechnicians();
    fetchSchedules();
  }, [selectedDate]);

  const findtechnicianById = (technicianId) => {
    return technicians.find(technician => technician.technician_id === technicianId) || null;
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    const { start, end, resourceId } = slotInfo;
    const newEvent = {
      start,
      end,
      resourceId,
    };
    setSelectedEvent(newEvent);
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
      fetchSchedules();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };


  return (
    <div>
        {isDialogOpen && (
            <h3>{findtechnicianById(selectedEvent.resourceId).username+', '+moment(selectedEvent.start).format('h:mma')+'-'+moment(selectedEvent.end).format('h:mma')}</h3>
            /*<EventDialog
                event={selectedEvent}
                onClose={handleCloseDialog} 
                onSave={handleSaveEvent}
            />*/
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