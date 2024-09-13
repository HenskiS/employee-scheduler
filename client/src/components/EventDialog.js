import React, { useState, useEffect } from 'react';
import { useScheduling } from './SchedulingContext';
import moment from 'moment';

const EventDialog = ({ event, onClose, view, onEventUpdate, onEventCreate }) => {
  const { technicians } = useScheduling();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    allDay: false,
    label: '',
    jobNumber: '',
    technicianIds: [],
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        startTime: moment(event.start).format('YYYY-MM-DDTHH:mm'),
        endTime: moment(event.end).format('YYYY-MM-DDTHH:mm'),
        allDay: event.allDay || false,
        label: event.label || '',
        jobNumber: event.jobNumber || '',
        technicianIds: event.technicianIds || [],
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTechnicianChange = (techId) => {
    setFormData(prevData => ({
      ...prevData,
      technicianIds: prevData.technicianIds.includes(techId)
        ? prevData.technicianIds.filter(id => id !== techId)
        : [...prevData.technicianIds, techId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (event && event.id) {
        // Update existing event
        const response = await fetch(`/api/events/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to update event');
        }
        const updatedEvent = await response.json();
        onEventUpdate(updatedEvent);
      } else {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to create event');
        }
        const newEvent = await response.json();
        onEventCreate(newEvent);
      }
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="event-dialog">
      <h2>{event ? 'Edit Event' : 'Add New Event'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Event Name"
          required
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <input
          type="datetime-local"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          required
        />
        <input
          type="datetime-local"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          required
        />
        <label>
          <input
            type="checkbox"
            name="allDay"
            checked={formData.allDay}
            onChange={handleChange}
          />
          All Day
        </label>
        <input
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="Label"
        />
        <input
          type="text"
          name="jobNumber"
          value={formData.jobNumber}
          onChange={handleChange}
          placeholder="Job Number"
        />
        <div>
          <h3>Assign Technicians:</h3>
          {technicians.map(tech => (
            <label key={tech.id}>
              <input
                type="checkbox"
                checked={formData.technicianIds.includes(tech.id)}
                onChange={() => handleTechnicianChange(tech.id)}
              />
              {tech.name}
            </label>
          ))}
        </div>
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default EventDialog;