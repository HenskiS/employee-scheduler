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
  const { refreshData } = useScheduling();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent(null);
    setConflictError(null); // Clear any previous conflicts
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
    setConflictError(null); // Clear any previous conflicts
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
    setNewEvent(null);
    setConflictError(null); // Clear conflicts when closing
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
        // Don't close the dialog - let user decide what to do
      } else {
        // For other errors, you might want to show a general error message
        // but still keep the dialog open
        console.error('Non-conflict error:', error);
      }
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
      allDays.push({
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
      currentDate.setDate(currentDate.getDate() + i);
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
          conflictError={conflictError}
          onClearConflicts={() => setConflictError(null)}
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