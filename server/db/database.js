const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./employee_scheduler.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      client_id INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      name TEXT NOT NULL,
      details TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )`);

    // Insert sample employees
    const sampleEmployees = [
      { name: 'John Doe', role: 'Manager' },
      { name: 'Jane Smith', role: 'Developer' },
      { name: 'Mike Johnson', role: 'Designer' }
    ];

    /*sampleEmployees.forEach(employee => {
      db.run('INSERT INTO employees (name, role) VALUES (?, ?)', [employee.name, employee.role], function(err) {
        if (err) {
          console.error('Error inserting employee:', err);
        } else {
          console.log(`Inserted employee with ID: ${this.lastID}`);
        }
      });
    });*/
  }
});

module.exports = db;

// To insert sample employees, we've added a new section within the database connection callback.
// We define an array of sample employees, each with a name and role.
// Then, we use forEach to iterate over this array and insert each employee into the database.
// The INSERT statement is executed using db.run(), with placeholders (?) for the values to prevent SQL injection.
// If successful, it logs the ID of the inserted employee. If there's an error, it logs the error message.
// This code will run every time the database connection is established, so you might want to add a check
// to prevent duplicate insertions in a production environment.