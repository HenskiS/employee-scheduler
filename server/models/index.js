const Doctor = require('./Doctor');
const Technician = require('./Technician');
const User = require('./User');
const Event = require('./Event');

// Doctor-Technician relationships
Doctor.belongsToMany(Technician, { through: 'DoctorPreferredTechnicians', as: 'preferredTechnicians' });
Doctor.belongsToMany(Technician, { through: 'DoctorAvoidTechnicians', as: 'avoidTechnicians' });
Technician.belongsToMany(Doctor, { through: 'DoctorPreferredTechnicians', as: 'preferringDoctors' });
Technician.belongsToMany(Doctor, { through: 'DoctorAvoidTechnicians', as: 'avoidingDoctors' });

// Event-User relationship
// Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Event-Technician relationship
Event.belongsToMany(Technician, { through: 'EventTechnicians' });
Technician.belongsToMany(Event, { through: 'EventTechnicians' });

module.exports = {
  Doctor,
  Technician,
  User,
  Event
};