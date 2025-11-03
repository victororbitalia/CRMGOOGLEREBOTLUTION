import pool from './connection';

// Generic query executor with error handling
export const executeQuery = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, params, error });
    throw error;
  }
};

// Get a single record by ID
export const getById = async (table: string, id: number | string) => {
  const query = `SELECT * FROM ${table} WHERE id = $1`;
  const result = await executeQuery(query, [id]);
  return result.rows[0] || null;
};

// Get all records from a table with optional filtering
export const getAll = async (table: string, filters: Record<string, any> = {}, orderBy?: string) => {
  let query = `SELECT * FROM ${table}`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Build WHERE clause
  Object.entries(filters).forEach(([key, value], index) => {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${key} = $${index + 1}`);
      params.push(value);
    }
  });

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add ORDER BY clause
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  const result = await executeQuery(query, params);
  return result.rows;
};

// Create a new record
export const create = async (table: string, data: Record<string, any>) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  
  const query = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await executeQuery(query, values);
  return result.rows[0];
};

// Update a record by ID
export const updateById = async (table: string, id: number | string, data: Record<string, any>) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  
  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await executeQuery(query, [id, ...values]);
  return result.rows[0] || null;
};

// Delete a record by ID
export const deleteById = async (table: string, id: number | string) => {
  const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
  const result = await executeQuery(query, [id]);
  return result.rows[0] || null;
};

// Check if a record exists
export const exists = async (table: string, field: string, value: any) => {
  const query = `SELECT 1 FROM ${table} WHERE ${field} = $1 LIMIT 1`;
  const result = await executeQuery(query, [value]);
  return result.rows.length > 0;
};

// Count records in a table with optional filters
export const count = async (table: string, filters: Record<string, any> = {}) => {
  let query = `SELECT COUNT(*) as count FROM ${table}`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  Object.entries(filters).forEach(([key, value], index) => {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${key} = $${index + 1}`);
      params.push(value);
    }
  });

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  const result = await executeQuery(query, params);
  return parseInt(result.rows[0].count, 10);
};

// Transaction helper
export const withTransaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Database connection utilities
export const connect = async () => {
  const client = await pool.connect();
  console.log('Connected to database');
  return client;
};

export const disconnect = async (client: any) => {
  client.release();
  console.log('Disconnected from database');
};

// Close all connections in the pool
export const closePool = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};