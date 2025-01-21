// GridCalendarView.js
import React from 'react';

const DefaultEventComponent = ({ event }) => (
  <div className="calendar-event">
    {event.title}
  </div>
);

const GridCalendarView = ({ 
  date, 
  events, 
  view, 
  components = {}, 
  days 
}) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const numberOfWeeks = Math.ceil(days.length / 7);

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

export default GridCalendarView;