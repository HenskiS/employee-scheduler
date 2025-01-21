// Calendar.js (main component)
import React from 'react';
import AgendaView from './AgendaView';
import GridCalendarView from './GridCalendarView';

const Calendar = ({ 
  date,
  events,
  view = 'month',
  components = {},
  showAllEvents = true,
  dateRange = null,
  filterParams = {}
}) => {
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
      {view === 'agenda' ? (
        <AgendaView 
          events={events} 
          filterParams={filterParams} 
        />
      ) : (
        <GridCalendarView 
          date={date}
          events={events}
          view={view}
          components={components}
          days={days}
        />
      )}
    </div>
  );
};

export default Calendar;