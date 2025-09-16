# Migration Commands

## Run All Pending Migrations
```bash
npx sequelize-cli db:migrate
```

## Check Migration Status
```bash
npx sequelize-cli db:migrate:status
```

## Rollback Last Migration
```bash
npx sequelize-cli db:migrate:undo
```

## Rollback All Migrations
```bash
npx sequelize-cli db:migrate:undo:all
```

---

## Production Deployment Steps
1. `git pull`
2. `npm install` (if needed)
3. `npx sequelize-cli db:migrate --env production`

## SIMPLE Production Commands
```bash
# Run all pending migrations
npx sequelize-cli db:migrate --env production

# Check what happened
npx sequelize-cli db:migrate:status --env production
```

## If Migration 003 Fails (DoctorId already exists)
This is normal - just run this command to mark it complete and continue:
```bash
node -e "
const config = require('./config/config.js');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(config.production);
sequelize.query('INSERT INTO \"SequelizeMeta\" (\"name\") VALUES (\"003-add-doctorid-column.js\")')
  .then(() => console.log('Migration 003 marked complete'))
  .catch(e => console.log('Already marked or error:', e.message))
  .finally(() => process.exit());
"
```

Then run migrations again:
```bash
npx sequelize-cli db:migrate --env production
```