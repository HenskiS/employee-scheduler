const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./technician_scheduler.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // Wrap all operations in a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const tables = [
      `CREATE TABLE IF NOT EXISTS clients (
        client_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS technicians (
        technician_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT,
        password TEXT,
        email TEXT,
        phone TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_all_day INTEGER NOT NULL DEFAULT 0,
        client_id INTEGER,
        technician_id INTEGER,
        label TEXT CHECK(label IN ('Available', 'Unavailable', 'TOR')),
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_by INTEGER,
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(client_id),
        FOREIGN KEY (technician_id) REFERENCES technicians(technician_id),
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        FOREIGN KEY (updated_by) REFERENCES users(user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS event_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_all_day INTEGER NOT NULL,
        client_id INTEGER,
        technician_id INTEGER,
        event_name TEXT,
        label TEXT CHECK(label IN ('Available', 'Unavailable', 'TOR')),
        changed_by INTEGER NOT NULL,
        changed_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (event_id) REFERENCES events(event_id),
        FOREIGN KEY (client_id) REFERENCES clients(client_id),
        FOREIGN KEY (technician_id) REFERENCES technicians(technician_id),
        FOREIGN KEY (changed_by) REFERENCES users(user_id)
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_event_start_time ON events(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_event_end_time ON events(end_time)',
      'CREATE INDEX IF NOT EXISTS idx_event_label ON events(label)',
      'CREATE INDEX IF NOT EXISTS idx_event_history_event_id ON event_history(event_id)',
      'CREATE INDEX IF NOT EXISTS idx_event_history_changed_at ON event_history(changed_at)'
    ];

    // Create tables
    tables.forEach((table, index) => {
      db.run(table, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err);
          db.run('ROLLBACK');
        } else {
          console.log(`Table ${index + 1} created successfully`);
        }
      });
    });

    // Create indexes
    indexes.forEach((index, i) => {
      db.run(index, (err) => {
        if (err) {
          console.error(`Error creating index ${i + 1}:`, err);
          db.run('ROLLBACK');
        } else {
          console.log(`Index ${i + 1} created successfully`);
        }
      });
    });

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
        db.run('ROLLBACK');
      } else {
        console.log('All tables and indexes created successfully');
      }
    });
  });
  /*const sampletechnicians = [
    { name: 'John Doe', username: 'JDoe' },
    { name: 'Jane Smith', username: 'JSmith' },
    { name: 'Mike Johnson', username: 'MJohnson' }
  ];

  sampletechnicians.forEach(technician => {
    db.run('INSERT INTO technicians (name, username) VALUES (?, ?)', [technician.name, technician.username], function(err) {
      if (err) {
        console.error('Error inserting technician:', err);
      } else {
        console.log(`Inserted technician with ID: ${this.lastID}`);
      }
    });
  });*/
});

module.exports = db;