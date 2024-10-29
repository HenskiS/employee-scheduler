// Run this file after changing the models to update the db

const Technician = require('./Technician')

Technician.sync({ alter: true })