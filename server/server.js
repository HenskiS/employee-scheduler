const express = require('express');
const cors = require('cors');
const techniciansRouter = require('./routes/technicians');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/technicians', techniciansRouter);
app.use('/api/events', eventsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});