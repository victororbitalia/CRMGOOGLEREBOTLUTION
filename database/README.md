# Database Documentation

This directory contains all database-related files for the CRM Google Restaurant Management System.

## Structure

```
database/
├── connection.ts          # Database connection configuration
├── migrate.ts            # Migration system
├── utils.ts              # Generic database utilities
├── cli.ts                # Command-line interface for migrations
├── services/             # Data service layer
│   ├── index.ts          # Service exports
│   ├── reservationService.ts  # Reservation operations
│   ├── tableService.ts   # Table operations
│   └── settingsService.ts     # Settings operations
└── migrations/           # SQL migration files
    ├── 001_initial_schema.sql  # Database schema
    └── 002_initial_data.sql    # Initial data
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your database connection in `.env.local`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. Run migrations to create the database schema:
   ```bash
   npm run db:migrate
   ```

## Migration Commands

- `npm run db:migrate` - Run all pending migrations
- `npm run db:rollback` - Rollback the last migration
- `npm run db:status` - Show migration status
- `npm run db:reset` - Drop all tables and re-run all migrations

## Database Schema

### Tables

1. **reservations** - Customer reservations
   - id, customer_name, phone, party_size, date_time, status, notes, table_id, notification_sent

2. **restaurant_tables** - Restaurant tables
   - id, name, capacity, zone, status

3. **settings** - Restaurant settings
   - id, restaurant_name, email, phone, address, booking settings

4. **opening_hours** - Restaurant opening hours
   - id, day_of_week, is_open, lunch_start, lunch_end, dinner_start, dinner_end

5. **migrations** - Migration tracking
   - id, filename, executed_at

## Data Services

### Reservation Service

```typescript
import { getReservationById, createReservation, updateReservation } from './database/services';

// Get a reservation
const reservation = await getReservationById(1);

// Create a new reservation
const newReservation = await createReservation({
  customerName: 'John Doe',
  phone: '+1234567890',
  partySize: 4,
  dateTime: '2023-12-25T19:00:00Z',
  status: 'Pending'
});

// Update a reservation
const updatedReservation = await updateReservation(1, { status: 'Confirmed' });
```

### Table Service

```typescript
import { getTableById, getAvailableTables, updateTableStatus } from './database/services';

// Get a table
const table = await getTableById(1);

// Get available tables
const availableTables = await getAvailableTables();

// Update table status
const updatedTable = await updateTableStatus(1, 'Occupied');
```

### Settings Service

```typescript
import { getSettings, updateSettings, isRestaurantOpen } from './database/services';

// Get restaurant settings
const settings = await getSettings();

// Update settings
const updatedSettings = await updateSettings(1, {
  restaurantName: 'New Restaurant Name',
  maxBookingDays: 60
});

// Check if restaurant is open
const isOpen = await isRestaurantOpen(new Date());
```

## Database Utilities

The `utils.ts` file provides generic database operations:

- `executeQuery` - Execute raw SQL queries
- `getById` - Get a record by ID
- `getAll` - Get all records with optional filtering
- `create` - Create a new record
- `updateById` - Update a record by ID
- `deleteById` - Delete a record by ID
- `withTransaction` - Execute operations in a transaction

## Connection Management

```typescript
import { connect, disconnect, closePool, testConnection } from './database/connection';

// Test connection
const isConnected = await testConnection();

// Get a client connection
const client = await connect();

// Release the connection
await disconnect(client);

// Close all connections (for app shutdown)
await closePool();
```

## Best Practices

1. Always use the service layer for database operations
2. Use transactions for multiple related operations
3. Handle errors appropriately in your application code
4. Use parameterized queries to prevent SQL injection
5. Test database connections before performing operations
6. Close connections properly when shutting down the application

## Adding New Migrations

1. Create a new SQL file in the `migrations/` directory with a sequential number:
   ```
   003_new_feature.sql
   ```

2. Write your SQL migration code:
   ```sql
   -- Add new column to existing table
   ALTER TABLE reservations ADD COLUMN special_requests TEXT;
   
   -- Create new table
   CREATE TABLE IF NOT EXISTS customers (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. Run the migration:
   ```bash
   npm run db:migrate
   ```

For rollback support, you can also create a corresponding rollback file:
```
003_new_feature_rollback.sql