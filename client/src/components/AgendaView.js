// AgendaView.js
import React from 'react';
import moment from 'moment';
import { useScheduling } from './SchedulingContext';

const AgendaView = ({ events, filterParams }) => {
  const { colorMap, labels } = useScheduling();
  
  const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
  
  const eventsByDate = sortedEvents.reduce((acc, event) => {
    const dateKey = moment(event.start).format('ddd MMM D');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const renderDoctorInfo = (event) => {
    if (!event.Doctor || !filterParams.displayOptions?.doctorInfo) return null;
    
    return (
      <div className="agenda-event-doctor-details">
        {filterParams.displayOptions.doctorInfo.showName && (
          <div className="agenda-event-doctor-name">
            {event.Doctor.name}
          </div>
        )}
        {filterParams.displayOptions.doctorInfo.showAddress && (
          <div className="agenda-event-doctor-address">
            {[
              event.Doctor.address1,
              event.Doctor.address2,
              event.Doctor.city,
              event.Doctor.zip
            ].filter(Boolean).join(', ')}
          </div>
        )}
        {filterParams.displayOptions.doctorInfo.showPhone && (
          <div className="agenda-event-doctor-phone">
            {event.Doctor.phoneNumber}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-agenda">
      <table className="agenda-table">
        <thead>
          <tr>
            <th className="agenda-header">Date</th>
            <th className="agenda-header">Time</th>
            <th className="agenda-header">Event</th>
            {filterParams.displayOptions?.showDescription && 
                <th className="agenda-header">Description</th>}
            <th className="agenda-header">Doctor</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
            dateEvents.map((event, index) => (
              <tr key={`${dateKey}-${index}`} className="agenda-row">
                {index === 0 && (
                  <td className="agenda-date" rowSpan={dateEvents.length}>
                    {dateKey}
                  </td>
                )}
                <td className="agenda-time">
                  {event.allDay ? (
                    <span>All Day</span>
                  ) : (
                    moment(event.start).format('h:mm a')
                  )}
                </td>
                <td className="agenda-event">
                  <div className="agenda-event-content">
                    <div 
                      className="agenda-event-color-indicator"
                      style={{ backgroundColor: colorMap[event.label] || '#3174ad' }}
                    />
                    <div className="agenda-event-details">
                      <span className="agenda-event-title">{event.title}</span>
                      {filterParams.displayOptions?.showLabel && event.label && event.label !== 'none' && (
                        <span className="agenda-event-label">
                          {labels?.find(l => l.value === event.label)?.label}
                        </span>
                      )}
                      {/* filterParams.displayOptions?.showDescription && event.description && (
                        <div className="agenda-event-description">
                          {event.description}
                        </div>
                      ) */}
                      {filterParams.displayOptions?.showTechnicians && event.Technicians && (
                        <div className="agenda-event-label">
                          {event.Technicians.map(t => t.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {filterParams.displayOptions?.showDescription &&
                <td className="agenda-details">
                  {event.description && (
                    <div className="agenda-event-description">
                      {event.description}
                    </div>
                  )}
                </td>}
                <td className="agenda-details">
                  {renderDoctorInfo(event)}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgendaView;