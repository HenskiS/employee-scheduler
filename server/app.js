require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const { router: doctorRoutes} = require('./routes/doctors');
const { router: technicianRoutes} = require('./routes/technicians');
const { router: userRoutes} = require('./routes/users');
const { router: eventRoutes} = require('./routes/events');
const { router: scheduleRoutes} = require('./routes/schedules');
const refreshRoutes = require('./routes/refresh')
const loggingMiddleware = require('./middleware/logging')

require('./models');

const app = express();

app.set('trust proxy', true); // gets correct IP from nginx proxy
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(loggingMiddleware);

// Serve static files from the React build directory
// Note the path is now going up one level and into the client/build directory
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// API routes
app.use('/api/test', (req, res) => { return res.json("Server is running!")});
app.use('/api/refresh', refreshRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/schedules', scheduleRoutes);

app.get('/print', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress;
  
  if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.includes('::ffff:127.0.0.1')) {
    // Request is from localhost, proceed with print route
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  } else {
    // Not from localhost, redirect to root
    res.redirect('/');
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

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