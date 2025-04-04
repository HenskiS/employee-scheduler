import React, { useState } from 'react';
import axios from '../api/axios';
import AgendaView from './AgendaView';
import GridCalendarView from './GridCalendarView';
import EventDialog from './EventDialog';
import { useScheduling } from './SchedulingContext';

const Calendar = ({ 
  date,
  events,
  view = 'month',
  components = {},
  showAllEvents = true,
  dateRange = null,
  filterParams = {},
}) => {
  const { technicians, doctors, labels, throughThirty, refreshData } = useScheduling();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent(null);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    const { start, end, resourceId } = slotInfo;
    const newEventData = {
      start,
      end,
      resourceId,
      allDay: false
    };
    setSelectedEvent(null);
    setNewEvent(newEventData);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
    setNewEvent(null);
  };

  const handleSaveEvent = async (event, updateType = 'single') => {
    try {
      if (event.id) {
        await axios.put(`/events/${event.id}?updateType=${updateType}`, event);
      } else {
        await axios.post('/events', event);
      }
      refreshData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async (deleteType = 'single') => {
    if (selectedEvent?.id) {
      try {
        await axios.delete(`/events/${selectedEvent.id}?deleteType=${deleteType}`);
        await refreshData();
        handleCloseDialog();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const isDateInRange = (date) => {
    if (!dateRange) return true;
    
    const checkDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )).toISOString().split('T')[0];
    
    const startDate = dateRange.start.split('T')[0];
    const endDate = dateRange.end.split('T')[0];

    return checkDate >= startDate && checkDate <= endDate;
  };

  const isWeekInRange = (weekDays) => {
    if (!dateRange) return true;
    return weekDays.some(day => day.isInRange);
  };

  const getDaysInMonth = (date) => {
    const allDays = [];
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDay = monthStart.getDay();
    
    // Add previous month's days
    for (let i = 0; i < startDay; i++) { 
      const prevDate = new Date(monthStart);
      prevDate.setDate(prevDate.getDate() - (startDay - i));
      allDays.unshift({
        date: prevDate,
        isCurrentMonth: false,
        isInRange: isDateInRange(prevDate)
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
      allDays.push({
        date: currentDate,
        isCurrentMonth: true,
        isInRange: isDateInRange(currentDate)
      });
    }
    
    // Add remaining days from next month
    const remainingDays = 7 - (allDays.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(monthEnd);
        nextDate.setDate(monthEnd.getDate() + i);
        allDays.push({
          date: nextDate,
          isCurrentMonth: false,
          isInRange: isDateInRange(nextDate)
        });
      }
    }

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const relevantWeeks = weeks.filter(isWeekInRange);
    return relevantWeeks.flat();
  };

  const getWeekDays = (date) => {
    const weekDays = [];
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      weekDays.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === date.getMonth(),
        isInRange: isDateInRange(currentDate)
      });
    }
    
    return weekDays;
  };

  const days = view === 'month' ? getDaysInMonth(date) : getWeekDays(date);

  return (
    <div className="custom-calendar">
      {isDialogOpen && (
        <EventDialog
          open={isDialogOpen}
          event={selectedEvent}
          newEvent={newEvent}
          onClose={handleCloseDialog}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
      {view === 'agenda' ? (
        <AgendaView 
          events={events} 
          filterParams={filterParams}
          onSelectEvent={handleSelectEvent}
        />
      ) : (
        <GridCalendarView 
          date={date}
          events={events}
          view={view}
          components={components}
          days={days}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
        />
      )}
    </div>
  );
};

export default Calendar;