const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');
db.run("UPDATE SequelizeMeta SET name = REPLACE(name, '2024', '2025') WHERE name LIKE '2024%'");