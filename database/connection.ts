import { Pool, PoolConfig } from 'pg';
import { dbConfig, createSafeConnectionString, USE_MOCK_DATA } from './config';

// Database connection pool
let pool: Pool | null = null;

// Function to create database connection pool
const createPool = (): Pool => {
  if (USE_MOCK_DATA) {
    console.log('⚠️ Using mock data mode - no real database connection');
    // Devolver un pool mock que no se conecte realmente
    return new Pool({
      connectionString: 'postgres://mock:mock@localhost:5432/mock',
      max: 1,
    }) as any;
  }

  const connectionString = createSafeConnectionString();
  
  if (!connectionString) {
    throw new Error('No se pudo crear la cadena de conexión a la base de datos');
  }

  const poolConfig: PoolConfig = {
    connectionString,
    max: dbConfig.max,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
    idleTimeoutMillis: dbConfig.idleTimeoutMillis,
    ssl: dbConfig.ssl,
  };

  // Configurar logging si está habilitado
  if (dbConfig.queryLogging) {
    console.log('🔍 Database query logging enabled');
    poolConfig.log = (messages) => {
      messages.forEach(message => {
        console.log('🗄️  DB Query:', message);
      });
    };
  }

  return new Pool(poolConfig);
};

// Function to get database connection pool
export const getPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    console.log('⚠️ Mock data mode - skipping database connection test');
    return true;
  }

  try {
    const pool = getPool();
    const client = await pool.connect();
    
    // Ejecutar una consulta simple para probar la conexión
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    
    client.release();
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Database info: ${result.rows[0].version.split(' ')[0]}`);
    console.log(`⏰ Server time: ${result.rows[0].current_time}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    // Proporcionar información más detallada sobre el error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('🔌 Connection refused - Check if database server is running');
      } else if (error.message.includes('authentication failed')) {
        console.error('🔐 Authentication failed - Check username and password');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('📂 Database does not exist - Check database name');
      }
    }
    
    return false;
  }
};

// Function to execute a query with error handling
export const executeQuery = async (query: string, params?: any[]): Promise<any> => {
  if (USE_MOCK_DATA) {
    console.log('⚠️ Mock data mode - skipping query execution');
    return { rows: [], rowCount: 0 };
  }

  const pool = getPool();
  let client;
  
  try {
    client = await pool.connect();
    
    if (dbConfig.queryLogging) {
      console.log('🔍 Executing query:', query);
      if (params && params.length > 0) {
        console.log('📋 Parameters:', params);
      }
    }
    
    const result = await client.query(query, params);
    
    if (dbConfig.queryLogging) {
      console.log(`✅ Query executed successfully. Rows returned: ${result.rowCount}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Function to execute a transaction
export const executeTransaction = async (queries: Array<{ query: string; params?: any[] }>): Promise<any[]> => {
  if (USE_MOCK_DATA) {
    console.log('⚠️ Mock data mode - skipping transaction execution');
    return [];
  }

  const pool = getPool();
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const results = [];
    
    for (const { query, params } of queries) {
      if (dbConfig.queryLogging) {
        console.log('🔍 Executing transaction query:', query);
        if (params && params.length > 0) {
          console.log('📋 Parameters:', params);
        }
      }
      
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    
    if (dbConfig.queryLogging) {
      console.log(`✅ Transaction executed successfully. Queries: ${queries.length}`);
    }
    
    return results;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Transaction execution error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Function to close the connection pool
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Database connection pool closed');
  }
};

// Export the pool for backward compatibility
export default getPool();