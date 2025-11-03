import { executeQuery, getById, getAll, create, updateById, deleteById, count } from '../utils';
import { Reservation, ReservationStatus } from '../../types';

// Get a reservation by ID
export const getReservationById = async (id: number | string): Promise<Reservation | null> => {
  return await getById('reservations', id);
};

// Get all reservations with optional filtering
export const getAllReservations = async (
  filters: {
    status?: ReservationStatus;
    date?: string;
    phone?: string;
    table_id?: number;
  } = {},
  orderBy = 'date_time ASC'
): Promise<Reservation[]> => {
  // Build date filter for a specific day
  if (filters.date) {
    const startDate = new Date(filters.date);
    const endDate = new Date(filters.date);
    endDate.setDate(endDate.getDate() + 1);
    
    return await executeQuery(
      `SELECT * FROM reservations 
       WHERE date_time >= $1 AND date_time < $2
       ${filters.status ? 'AND status = $3' : ''}
       ${filters.phone ? (filters.status ? 'AND phone = $4' : 'AND phone = $3') : ''}
       ${filters.table_id ? (filters.status || filters.phone ? 'AND table_id = $5' : 'AND table_id = $3') : ''}
       ORDER BY ${orderBy}`,
      [
        startDate,
        endDate,
        ...(filters.status ? [filters.status] : []),
        ...(filters.phone ? [filters.phone] : []),
        ...(filters.table_id ? [filters.table_id] : [])
      ]
    ).then(result => result.rows);
  }
  
  return await getAll('reservations', filters, orderBy);
};

// Create a new reservation
export const createReservation = async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> => {
  return await create('reservations', reservation);
};

// Update a reservation
export const updateReservation = async (id: number | string, updates: Partial<Reservation>): Promise<Reservation | null> => {
  return await updateById('reservations', id, updates);
};

// Delete a reservation
export const deleteReservation = async (id: number | string): Promise<Reservation | null> => {
  return await deleteById('reservations', id);
};

// Get reservations for a specific date range
export const getReservationsByDateRange = async (
  startDate: Date,
  endDate: Date,
  status?: ReservationStatus
): Promise<Reservation[]> => {
  let query = `
    SELECT * FROM reservations
    WHERE date_time >= $1 AND date_time <= $2
  `;
  const params: any[] = [startDate, endDate];
  
  if (status) {
    query += ' AND status = $3';
    params.push(status);
  }
  
  query += ' ORDER BY date_time ASC';
  
  const result = await executeQuery(query, params);
  return result.rows;
};

// Get reservations for today
export const getTodayReservations = async (status?: ReservationStatus): Promise<Reservation[]> => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return await getReservationsByDateRange(today, tomorrow, status);
};

// Get upcoming reservations (from now onwards)
export const getUpcomingReservations = async (days = 7): Promise<Reservation[]> => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);
  
  const query = `
    SELECT * FROM reservations 
    WHERE date_time >= $1 AND date_time <= $2
    ORDER BY date_time ASC
  `;
  
  const result = await executeQuery(query, [now, futureDate]);
  return result.rows;
};

// Check if a table is available at a specific time
export const isTableAvailable = async (
  tableId: number,
  dateTime: Date,
  durationMinutes = 120,
  excludeReservationId?: number
): Promise<boolean> => {
  const startTime = new Date(dateTime);
  const endTime = new Date(dateTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  
  let query = `
    SELECT COUNT(*) as count FROM reservations
    WHERE table_id = $1
    AND status NOT IN ('Cancelled', 'Completed')
    AND (
      (date_time <= $2 AND date_time + INTERVAL '${durationMinutes} minutes' > $2)
      OR (date_time < $3 AND date_time + INTERVAL '${durationMinutes} minutes' >= $3)
      OR (date_time >= $2 AND date_time < $3)
    )
  `;
  
  const params = [tableId, startTime, endTime];
  
  if (excludeReservationId) {
    query += ' AND id != $4';
    params.push(excludeReservationId);
  }
  
  const result = await executeQuery(query, params);
  return parseInt(result.rows[0].count, 10) === 0;
};

// Get available tables for a specific date and time
export const getAvailableTables = async (
  dateTime: Date,
  partySize: number,
  durationMinutes = 120
): Promise<any[]> => {
  const query = `
    SELECT t.* FROM restaurant_tables t
    WHERE t.capacity >= $1
    AND t.status = 'Available'
    AND NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.table_id = t.id
      AND r.status NOT IN ('Cancelled', 'Completed')
      AND (
        (r.date_time <= $2 AND r.date_time + INTERVAL '${durationMinutes} minutes' > $2)
        OR (r.date_time < $3 AND r.date_time + INTERVAL '${durationMinutes} minutes' >= $3)
        OR (r.date_time >= $2 AND r.date_time < $3)
      )
    )
    ORDER BY t.capacity ASC
  `;
  
  const startTime = new Date(dateTime);
  const endTime = new Date(dateTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  
  const result = await executeQuery(query, [partySize, startTime, endTime]);
  return result.rows;
};

// Update reservation status
export const updateReservationStatus = async (
  id: number | string,
  status: ReservationStatus
): Promise<Reservation | null> => {
  return await updateReservation(id, { status });
};

// Mark notification as sent
export const markNotificationSent = async (id: number | string): Promise<Reservation | null> => {
  return await updateReservation(id, { notification_sent: true });
};

// Get reservation statistics
export const getReservationStats = async (startDate?: Date, endDate?: Date): Promise<any> => {
  let query = `
    SELECT 
      status,
      COUNT(*) as count,
      AVG(party_size) as avg_party_size
    FROM reservations
  `;
  
  const params: any[] = [];
  
  if (startDate && endDate) {
    query += ' WHERE date_time >= $1 AND date_time <= $2';
    params.push(startDate, endDate);
  }
  
  query += ' GROUP BY status';
  
  const result = await executeQuery(query, params);
  return result.rows;
};