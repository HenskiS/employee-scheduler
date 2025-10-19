// models/index.js
const Doctor = require('./Doctor');
const DoctorEmail = require('./DoctorEmail');
const Technician = require('./Technician');
const User = require('./User');
const Event = require('./Event');
const EventCompletion = require('./EventCompletion');
const Tag = require('./Tag');

// Doctor-Email relationship
Doctor.hasMany(DoctorEmail, { as: 'emails' });
DoctorEmail.belongsTo(Doctor);

// Doctor-Technician relationships
Doctor.belongsToMany(Technician, { through: 'DoctorPreferredTechnicians', as: 'preferredTechnicians' });
Doctor.belongsToMany(Technician, { through: 'DoctorAvoidTechnicians', as: 'avoidTechnicians' });
Technician.belongsToMany(Doctor, { through: 'DoctorPreferredTechnicians', as: 'preferringDoctors' });
Technician.belongsToMany(Doctor, { through: 'DoctorAvoidTechnicians', as: 'avoidingDoctors' });

// Event-User relationship
// Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Self-referential relationship for recurring events
Event.belongsTo(Event, { as: 'originalEvent', foreignKey: 'originalEventId' });
Event.hasMany(Event, { as: 'recurrences', foreignKey: 'originalEventId' });

// Event-Technician relationship
Event.belongsToMany(Technician, { through: 'EventTechnicians' });
Technician.belongsToMany(Event, { through: 'EventTechnicians' });

// Event-Doctor relationship
Event.belongsTo(Doctor);
Doctor.hasMany(Event);

// Event-EventCompletion relationship (one-to-one)
Event.hasOne(EventCompletion, { as: 'completion', foreignKey: 'EventId' });
EventCompletion.belongsTo(Event, { foreignKey: 'EventId' });

// Event-Tag relationship (many-to-many)
Event.belongsToMany(Tag, { through: 'EventTags', as: 'tags' });
Tag.belongsToMany(Event, { through: 'EventTags', as: 'events' });

module.exports = {
  Doctor,
  DoctorEmail,
  Technician,
  User,
  Event,
  EventCompletion,
  Tag
};