const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'scheduling.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');

      // People table (base table for all person types)
      db.run(`CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        type TEXT NOT NULL
      )`);

      // Users table (extends People)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        FOREIGN KEY (id) REFERENCES people (id)
      )`);

      // Doctors table (extends People)
      db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY,
        address1 TEXT,
        address2 TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        FOREIGN KEY (id) REFERENCES people (id)
      )`);

      // Technicians table (extends People)
      db.run(`CREATE TABLE IF NOT EXISTS technicians (
        id INTEGER PRIMARY KEY,
        FOREIGN KEY (id) REFERENCES people (id)
      )`);

      // Labels table
      db.run(`CREATE TABLE IF NOT EXISTS labels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`);

      // Insert default labels
      db.run(`INSERT OR IGNORE INTO labels (name) VALUES 
        ('None'), ('Available'), ('Canceled'), ('Holiday'), ('Meeting')`);

      // Events table
      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        is_all_day BOOLEAN NOT NULL DEFAULT 0,
        label_id INTEGER,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (label_id) REFERENCES labels (id),
        FOREIGN KEY (created_by) REFERENCES people (id)
      )`);

      // Event attendees (many-to-many relationship between events and people)
      db.run(`CREATE TABLE IF NOT EXISTS event_attendees (
        event_id INTEGER,
        person_id INTEGER,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (person_id) REFERENCES people (id),
        PRIMARY KEY (event_id, person_id)
      )`);

    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function addPerson(person) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO people (name, email, phone, type) VALUES (?, ?, ?, ?)',
      [person.name, person.email, person.phone, person.type],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function addUser(user) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION');
    addPerson({...user, type: 'user'})
      .then(personId => {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
            [personId, user.username, hash],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
              } else {
                db.run('COMMIT');
                resolve(personId);
              }
            }
          );
        });
      })
      .catch(err => {
        db.run('ROLLBACK');
        reject(err);
      });
  });
}

function addDoctor(doctor) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION');
    addPerson({...doctor, type: 'doctor'})
      .then(personId => {
        db.run('INSERT INTO doctors (id, address1, address2, city, state, zip) VALUES (?, ?, ?, ?, ?, ?)',
          [personId, doctor.address1, doctor.address2, doctor.city, doctor.state, doctor.zip],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT');
              resolve(personId);
            }
          }
        );
      })
      .catch(err => {
        db.run('ROLLBACK');
        reject(err);
      });
  });
}

function addTechnician(technician) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION');
    addPerson({...technician, type: 'technician'})
      .then(personId => {
        db.run('INSERT INTO technicians (id) VALUES (?)',
          [personId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT');
              resolve(personId);
            }
          }
        );
      })
      .catch(err => {
        db.run('ROLLBACK');
        reject(err);
      });
  });
}

function addEvent(event) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO events 
      (name, description, start_time, end_time, is_all_day, label_id, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event.name, event.description, event.start_time, event.end_time, 
       event.is_all_day ? 1 : 0, event.label_id, event.created_by],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

module.exports = {
  initializeDatabase,
  addUser,
  addDoctor,
  addTechnician,
  addEvent,
  db  // Exporting the database connection for other operations
};