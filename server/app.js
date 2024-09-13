require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const doctorRoutes = require('./routes/doctors');
const technicianRoutes = require('./routes/technicians');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');

// Import models (this will also set up the relationships)
require('./models');

const app = express();

app.use(cors)
app.use(express.json());

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});