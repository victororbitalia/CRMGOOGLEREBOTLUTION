import { executeQuery, getById, getAll, create, updateById, deleteById } from '../utils';
import { Table, TableStatus, Zone } from '../../types';

// Get a table by ID
export const getTableById = async (id: number | string): Promise<Table | null> => {
  return await getById('restaurant_tables', id);
};

// Get all tables with optional filtering
export const getAllTables = async (
  filters: {
    status?: TableStatus;
    zone?: Zone;
    capacity?: number;
  } = {},
  orderBy = 'name ASC'
): Promise<Table[]> => {
  return await getAll('restaurant_tables', filters, orderBy);
};

// Create a new table
export const createTable = async (table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table> => {
  return await create('restaurant_tables', table);
};

// Update a table
export const updateTable = async (id: number | string, updates: Partial<Table>): Promise<Table | null> => {
  return await updateById('restaurant_tables', id, updates);
};

// Delete a table
export const deleteTable = async (id: number | string): Promise<Table | null> => {
  return await deleteById('restaurant_tables', id);
};

// Get tables by zone
export const getTablesByZone = async (zone: Zone): Promise<Table[]> => {
  return await getAll('restaurant_tables', { zone }, 'name ASC');
};

// Get tables by capacity (minimum capacity)
export const getTablesByCapacity = async (minCapacity: number): Promise<Table[]> => {
  const query = `
    SELECT * FROM restaurant_tables 
    WHERE capacity >= $1
    ORDER BY capacity ASC, name ASC
  `;
  
  const result = await executeQuery(query, [minCapacity]);
  return result.rows;
};

// Get available tables
export const getAvailableTables = async (): Promise<Table[]> => {
  return await getAll('restaurant_tables', { status: 'Available' }, 'name ASC');
};

// Get available tables by zone
export const getAvailableTablesByZone = async (zone: Zone): Promise<Table[]> => {
  return await getAll('restaurant_tables', { status: 'Available', zone }, 'name ASC');
};

// Get available tables by capacity
export const getAvailableTablesByCapacity = async (minCapacity: number): Promise<Table[]> => {
  const query = `
    SELECT * FROM restaurant_tables 
    WHERE status = 'Available' AND capacity >= $1
    ORDER BY capacity ASC, name ASC
  `;
  
  const result = await executeQuery(query, [minCapacity]);
  return result.rows;
};

// Update table status
export const updateTableStatus = async (
  id: number | string,
  status: TableStatus
): Promise<Table | null> => {
  return await updateTable(id, { status });
};

// Get table statistics
export const getTableStats = async (): Promise<any> => {
  const query = `
    SELECT 
      status,
      zone,
      COUNT(*) as count,
      AVG(capacity) as avg_capacity,
      SUM(capacity) as total_capacity
    FROM restaurant_tables
    GROUP BY status, zone
    ORDER BY zone, status
  `;
  
  const result = await executeQuery(query);
  return result.rows;
};

// Get total capacity by zone
export const getCapacityByZone = async (): Promise<any> => {
  const query = `
    SELECT 
      zone,
      COUNT(*) as table_count,
      SUM(capacity) as total_capacity,
      AVG(capacity) as avg_capacity
    FROM restaurant_tables
    GROUP BY zone
    ORDER BY zone
  `;
  
  const result = await executeQuery(query);
  return result.rows;
};

// Get best table for a party size in a specific zone
export const getBestTableForParty = async (
  partySize: number,
  preferredZone?: Zone
): Promise<Table | null> => {
  let query = `
    SELECT * FROM restaurant_tables 
    WHERE status = 'Available' AND capacity >= $1
  `;
  const params: any[] = [partySize];
  
  if (preferredZone) {
    query += ' AND zone = $2';
    params.push(preferredZone);
  }
  
  query += ' ORDER BY capacity ASC, name ASC LIMIT 1';
  
  const result = await executeQuery(query, params);
  return result.rows[0] || null;
};

// Check if a table name already exists
export const tableNameExists = async (name: string, excludeId?: number): Promise<boolean> => {
  let query = 'SELECT 1 FROM restaurant_tables WHERE name = $1';
  const params: any[] = [name];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  
  query += ' LIMIT 1';
  
  const result = await executeQuery(query, params);
  return result.rows.length > 0;
};

// Get tables that can accommodate a party size
export const getTablesForPartySize = async (partySize: number): Promise<Table[]> => {
  const query = `
    SELECT * FROM restaurant_tables 
    WHERE capacity >= $1
    ORDER BY capacity ASC, name ASC
  `;
  
  const result = await executeQuery(query, [partySize]);
  return result.rows;
};

// Get tables with current reservations
export const getTablesWithReservations = async (date?: Date): Promise<any[]> => {
  let query = `
    SELECT 
      t.*,
      r.id as reservation_id,
      r.customer_name,
      r.party_size,
      r.date_time,
      r.status as reservation_status
    FROM restaurant_tables t
    LEFT JOIN reservations r ON t.id = r.table_id
  `;
  
  const params: any[] = [];
  
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    query += ' WHERE r.date_time >= $1 AND r.date_time < $2';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY t.name, r.date_time';
  
  const result = await executeQuery(query, params);
  return result.rows;
};