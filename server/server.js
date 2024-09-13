const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/users');
const doctorsRouter = require('./routes/doctors');
const techniciansRouter = require('./routes/technicians');
const eventsRouter = require('./routes/events');
const { initializeDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    // Start your server or perform other initialization tasks here
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/technicians', techniciansRouter);
app.use('/api/events', eventsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});