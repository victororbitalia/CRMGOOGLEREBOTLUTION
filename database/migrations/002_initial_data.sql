-- Initial data for CRM Google Restaurant Management System

-- Insert default settings
INSERT INTO settings (
    restaurant_name, email, phone, address, 
    max_booking_days, min_booking_hours, default_booking_duration,
    max_party_size, walk_in_tables, max_occupancy_percent
) VALUES (
    'Google Bistro',
    'reservations@bistro.google.com',
    '+1 (555) 123-4567',
    '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    30, 2, 120, 10, 5, 85
) ON CONFLICT DO NOTHING;

-- Insert opening hours
INSERT INTO opening_hours (day_of_week, is_open, lunch_start, lunch_end, dinner_start, dinner_end) VALUES
('Monday', true, '11:30:00', '14:30:00', '17:30:00', '22:00:00'),
('Tuesday', true, '11:30:00', '14:30:00', '17:30:00', '22:00:00'),
('Wednesday', true, '11:30:00', '14:30:00', '17:30:00', '22:00:00'),
('Thursday', true, '11:30:00', '14:30:00', '17:30:00', '22:00:00'),
('Friday', true, '11:30:00', '14:30:00', '17:30:00', '23:00:00'),
('Saturday', true, '12:00:00', '15:00:00', '17:30:00', '23:00:00'),
('Sunday', true, '12:00:00', '15:00:00', '17:30:00', '21:00:00')
ON CONFLICT DO NOTHING;

-- Insert restaurant tables
INSERT INTO restaurant_tables (name, capacity, zone, status) VALUES
-- Indoor tables
('T1', 2, 'Indoors', 'Available'),
('T2', 2, 'Indoors', 'Available'),
('T3', 4, 'Indoors', 'Available'),
('T4', 4, 'Indoors', 'Available'),
('T5', 4, 'Indoors', 'Available'),
('T6', 6, 'Indoors', 'Available'),
('T7', 6, 'Indoors', 'Available'),
('T8', 8, 'Indoors', 'Available'),
-- Outdoor tables
('T9', 2, 'Outdoors', 'Available'),
('T10', 2, 'Outdoors', 'Available'),
('T11', 4, 'Outdoors', 'Available'),
('T12', 4, 'Outdoors', 'Available'),
('T13', 6, 'Outdoors', 'Available'),
-- Terrace tables
('T14', 2, 'Terrace', 'Available'),
('T15', 2, 'Terrace', 'Available'),
('T16', 4, 'Terrace', 'Available'),
('T17', 4, 'Terrace', 'Available'),
-- Private dining
('P1', 10, 'Private', 'Available'),
('P2', 12, 'Private', 'Available')
ON CONFLICT DO NOTHING;

-- Insert sample reservations for the next few days
INSERT INTO reservations (
    customer_name, phone, party_size, date_time, status, notes, table_id, notification_sent
) VALUES
-- Today's reservations
('John Smith', '+1 (555) 111-2222', 2, CURRENT_TIMESTAMP + INTERVAL '3 hours', 'Confirmed', 'Anniversary dinner', 1, true),
('Emily Johnson', '+1 (555) 333-4444', 4, CURRENT_TIMESTAMP + INTERVAL '5 hours', 'Confirmed', 'Business meeting', 3, true),
('Michael Brown', '+1 (555) 555-6666', 6, CURRENT_TIMESTAMP + INTERVAL '7 hours', 'Pending', 'Birthday celebration', 6, false),
-- Tomorrow's reservations
('Sarah Davis', '+1 (555) 777-8888', 2, CURRENT_TIMESTAMP + INTERVAL '1 day 3 hours', 'Confirmed', NULL, 2, true),
('Robert Wilson', '+1 (555) 999-0000', 4, CURRENT_TIMESTAMP + INTERVAL '1 day 6 hours', 'Confirmed', 'Vegetarian options needed', 4, true),
('Jessica Martinez', '+1 (555) 222-3333', 3, CURRENT_TIMESTAMP + INTERVAL '1 day 7 hours', 'Pending', NULL, NULL, false),
-- Day after tomorrow
('David Anderson', '+1 (555) 444-5555', 2, CURRENT_TIMESTAMP + INTERVAL '2 days 2 hours', 'Confirmed', NULL, 9, true),
('Lisa Taylor', '+1 (555) 666-7777', 5, CURRENT_TIMESTAMP + INTERVAL '2 days 5 hours', 'Confirmed', 'Kids menu needed', 7, true),
('James Thomas', '+1 (555) 888-9999', 8, CURRENT_TIMESTAMP + INTERVAL '2 days 6 hours', 'Pending', 'Company dinner', 8, false),
-- Next week
('Maria Garcia', '+1 (555) 123-4567', 4, CURRENT_TIMESTAMP + INTERVAL '7 days 3 hours', 'Confirmed', NULL, 5, true),
('William Rodriguez', '+1 (555) 234-5678', 6, CURRENT_TIMESTAMP + INTERVAL '7 days 6 hours', 'Confirmed', 'Private event', 19, true),
('Jennifer Lee', '+1 (555) 345-6789', 2, CURRENT_TIMESTAMP + INTERVAL '7 days 7 hours', 'Pending', NULL, NULL, false)
ON CONFLICT DO NOTHING;