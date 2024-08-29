const express = require('express');
const cors = require('cors');
const employeesRouter = require('./routes/employees');
const schedulesRouter = require('./routes/schedules');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/employees', employeesRouter);
app.use('/api/schedules', schedulesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});