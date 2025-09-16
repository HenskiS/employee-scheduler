// models/index.js
const Doctor = require('./Doctor');
const DoctorEmail = require('./DoctorEmail');
const Technician = require('./Technician');
const User = require('./User');
const Event = require('./Event');

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

module.exports = {
  Doctor,
  DoctorEmail,
  Technician,
  User,
  Event
};