// GridCalendarView.js
import React from 'react';
import moment from 'moment';

const DefaultEventComponent = ({ event, onClick }) => (
  <div 
    className="calendar-event"
    onClick={(e) => {
      e.stopPropagation();
      onClick(event);
    }}
    style={{ cursor: 'pointer' }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
  >
    {event.title}
  </div>
);

const GridCalendarView = ({ 
  date, 
  events, 
  view, 
  components = {}, 
  days,
  onSelectEvent,
  onSelectSlot
}) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const numberOfWeeks = Math.ceil(days.length / 7);

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDayClick = (dayInfo) => {
    if (!dayInfo.isInRange) return;

    const start = moment(dayInfo.date).hour(9).minute(0).toDate(); // Default to 9 AM
    const end = moment(start).add(4, 'hours').toDate(); // 4-hour default duration

    onSelectSlot({
      start,
      end,
      slots: [start, end],
      resourceId: null
    });
  };

  const renderDayCell = (dayInfo) => {
    const dayEvents = getEventsForDate(dayInfo.date);
    const EventComponent = components.event || DefaultEventComponent;

    const cellClassName = [
      'calendar-cell',
      dayInfo.isCurrentMonth ? 'current-month' : 'other-month',
      !dayInfo.isInRange ? 'out-of-range' : '',
      view === 'week' ? 'week-view' : '',
      dayInfo.isInRange ? 'hover:bg-gray-50' : ''
    ].filter(Boolean).join(' ');

    return (
      <div 
        className={cellClassName}
        onClick={() => handleDayClick(dayInfo)}
        style={{ cursor: dayInfo.isInRange ? 'pointer' : 'default' }}
      >
        <div className="calendar-date">
          {dayInfo.date.getDate()}
        </div>
        <div className="calendar-events">
          {dayEvents.map((event, index) => (
            <EventComponent 
              key={`${event.title}-${index}`}
              event={event}
              onClick={() => onSelectEvent(event)}
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