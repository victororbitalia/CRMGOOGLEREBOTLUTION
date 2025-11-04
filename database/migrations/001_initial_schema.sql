-- Initial schema for CRM Google Restaurant Management System

-- Create tables for reservations, tables, and settings

-- Tables table (created first to avoid foreign key reference issues)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    zone VARCHAR(50) NOT NULL CHECK (zone IN ('Indoors', 'Outdoors', 'Terrace', 'Private')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Reserved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table (created after restaurant_tables to reference it)
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    date_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled')),
    notes TEXT,
    table_id INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    restaurant_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    max_booking_days INTEGER DEFAULT 30 CHECK (max_booking_days > 0),
    min_booking_hours INTEGER DEFAULT 2 CHECK (min_booking_hours >= 0),
    default_booking_duration INTEGER DEFAULT 120 CHECK (default_booking_duration > 0),
    max_party_size INTEGER DEFAULT 10 CHECK (max_party_size > 0),
    walk_in_tables INTEGER DEFAULT 5 CHECK (walk_in_tables >= 0),
    max_occupancy_percent INTEGER DEFAULT 85 CHECK (max_occupancy_percent > 0 AND max_occupancy_percent <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opening hours table
CREATE TABLE IF NOT EXISTS opening_hours (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    is_open BOOLEAN DEFAULT TRUE,
    lunch_start TIME,
    lunch_end TIME,
    dinner_start TIME,
    dinner_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (
        (lunch_start IS NULL OR lunch_end IS NULL OR lunch_start < lunch_end) AND
        (dinner_start IS NULL OR dinner_end IS NULL OR dinner_start < dinner_end)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(phone);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_name ON reservations(customer_name);
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_zone ON restaurant_tables(zone);
CREATE INDEX IF NOT EXISTS idx_tables_capacity ON restaurant_tables(capacity);
CREATE INDEX IF NOT EXISTS idx_opening_hours_day ON opening_hours(day_of_week);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opening_hours_updated_at BEFORE UPDATE ON opening_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();