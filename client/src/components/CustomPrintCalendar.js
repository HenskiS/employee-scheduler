import React from 'react';
import moment from 'moment';
import { useScheduling } from './SchedulingContext';

const Calendar = ({ 
    date,
    events,
    view = 'month',
    components = {},
    showAllEvents = true,
    dateRange = null
  }) => {

    const { colorMap } = useScheduling();

    const isDateInRange = (date) => {
        if (!dateRange) return true;
        
        // Convert the check date to UTC string format for fair comparison
        const checkDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )).toISOString().split('T')[0];
        
        // Get just the date portions of the range dates (they're already in UTC)
        const startDate = dateRange.start.split('T')[0];
        const endDate = dateRange.end.split('T')[0];
    
        return checkDate >= startDate && checkDate <= endDate;
    };

    const isWeekInRange = (weekDays) => {
      if (!dateRange) return true;
      
      // Check if any day in the week falls within the date range
      return weekDays.some(day => day.isInRange);
    };
  
    const getDaysInMonth = (date) => {
      const allDays = [];
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const startDay = monthStart.getDay();
      
      // Add previous month's days; if 1st is a Wed, add Sun(0), Mon(1), Tue(2) from end of prev. month
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
      
      // Add only enough days from next month to complete the week
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

      // Split all days into weeks
      const weeks = [];
      for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
      }

      // Filter weeks to only include those that contain dates in the range
      const relevantWeeks = weeks.filter(isWeekInRange);

      // Flatten the weeks back into a single array
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

    const getEventsForDate = (date) => {
      return events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });
    };

    const renderDayCell = (dayInfo) => {
      const dayEvents = getEventsForDate(dayInfo.date);
      const EventComponent = components.event || DefaultEventComponent;

      const cellClassName = [
        'calendar-cell',
        dayInfo.isCurrentMonth ? 'current-month' : 'other-month',
        !dayInfo.isInRange ? 'out-of-range' : '',
        view === 'week' ? 'week-view' : ''
      ].filter(Boolean).join(' ');

      return (
        <div className={cellClassName}>
          <div className="calendar-date">
            {dayInfo.date.getDate()}
          </div>
          <div className="calendar-events">
            {dayEvents.map((event, index) => (
              <EventComponent 
                key={`${event.title}-${index}`}
                event={event}
              />
            ))}
          </div>
        </div>
      );
    };

    const DefaultEventComponent = ({ event }) => (
      <div className="calendar-event">
        {event.title}
      </div>
    );

    const renderAgendaView = () => {
      const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
      
      const eventsByDate = sortedEvents.reduce((acc, event) => {
        const dateKey = moment(event.start).format('ddd MMM D');
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      }, {});

      return (
        <div className="calendar-agenda">
          <table className="agenda-table">
            <thead>
              <tr>
                <th className="agenda-header">Date</th>
                <th className="agenda-header">Time</th>
                <th className="agenda-header">Event</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
                dateEvents.map((event, index) => (
                  <tr key={`${dateKey}-${index}`} className="agenda-row">
                    {index === 0 ? (
                      <td className="agenda-date" rowSpan={dateEvents.length}>
                        {dateKey}
                      </td>
                    ) : null}
                    <td className="agenda-time">
                      {event.allDay ? 'All Day' : `${moment(event.start).format('h:mm a')} – ${moment(event.end).format('h:mm a')}`}
                    </td>
                    <td className="agenda-event">
                      <div className="agenda-event-content">
                        <div 
                          className="agenda-event-color-indicator"
                          style={{ backgroundColor: colorMap[event.label] || '#3174ad' }}
                        />
                        <span className="agenda-event-title">{event.title}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const renderCalendarGrid = () => {
      const days = view === 'month' ? getDaysInMonth(date) : getWeekDays(date);
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const numberOfWeeks = Math.ceil(days.length / 7);

      return (
        <div className="calendar-container">
          <div className="calendar-header">
            {weekdays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div 
            className={`calendar-grid ${view}-view`}
            style={{
              gridTemplateRows: `repeat(${numberOfWeeks}, minmax(120px, auto))`
            }}
          >
            {days.map((dayInfo, index) => (
              <div key={index} className="calendar-day">
                {renderDayCell(dayInfo)}
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="custom-calendar">
        {view === 'agenda' ? renderAgendaView() : renderCalendarGrid()}
      </div>
    );
};

export default Calendar;