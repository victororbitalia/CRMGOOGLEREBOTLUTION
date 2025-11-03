import dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve('.env.local') });
dotenv.config(); // Cargar también .env si existe

// Configuration to determine if we should use the real database or mock data
// IMPORTANTE: Para producción, USE_MOCK_DATA debe ser 'false'
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Database connection configuration
export const dbConfig = {
  // Usar DATABASE_URL si está disponible, si no usar variables individuales
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crm_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Configuración de conexión avanzada
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  
  // Configuración de SSL
  ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false,
  
  // Configuración de logging
  queryLogging: process.env.DB_QUERY_LOGGING === 'true',
  
  // Configuración de reintentos
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
};

// Function to test database connection with retries
export const testDatabaseConnection = async (): Promise<boolean> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= dbConfig.retryAttempts; attempt++) {
    try {
      // Try to import and test the real database connection
      const { testConnection } = await import('./connection');
      const isConnected = await testConnection();
      
      if (isConnected) {
        console.log('✅ Database connected successfully');
        return true;
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < dbConfig.retryAttempts) {
        console.log(`⏳ Retrying in ${dbConfig.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, dbConfig.retryDelay));
      }
    }
  }
  
  console.error(`❌ All ${dbConfig.retryAttempts} database connection attempts failed`);
  if (lastError) {
    console.error('Last error:', lastError.message);
  }
  
  // En desarrollo, si USE_MOCK_DATA es true, no es un error crítico
  // En producción, la conexión a la base de datos es obligatoria
  if (process.env.NODE_ENV === 'development' && USE_MOCK_DATA) {
    console.log('⚠️ Using mock data due to connection failure');
    return true;
  }
  
  // En producción, advertir si estamos usando mock data
  if (process.env.NODE_ENV === 'production' && USE_MOCK_DATA) {
    console.error('❌ CRITICAL: Mock data mode is enabled in production!');
    console.error('❌ Please set USE_MOCK_DATA=false for production deployment');
  }
  
  return false;
};

// Function to get database configuration with fallbacks
export const getDatabaseConfig = () => {
  // Si estamos en modo mock, devolver configuración vacía
  if (USE_MOCK_DATA) {
    return {
      connectionString: null,
      host: null,
      port: null,
      database: null,
      user: null,
      password: null,
    };
  }
  
  return dbConfig;
};

// Function to validate database configuration
export const validateDatabaseConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Si estamos en modo mock, no es necesario validar
  if (USE_MOCK_DATA) {
    // En producción, advertir sobre el uso de mock data
    if (process.env.NODE_ENV === 'production') {
      return {
        isValid: false,
        errors: ['Mock data mode is not allowed in production. Set USE_MOCK_DATA=false']
      };
    }
    return { isValid: true, errors: [] };
  }
  
  // Verificar si tenemos DATABASE_URL o variables individuales
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasIndividualDbVars = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
  
  if (!hasDatabaseUrl && !hasIndividualDbVars) {
    errors.push('Se requiere DATABASE_URL o las variables individuales de base de datos (DB_HOST, DB_NAME, DB_USER)');
  }
  
  // Validar formato de DATABASE_URL si está presente
  if (hasDatabaseUrl) {
    try {
      const url = new URL(process.env.DATABASE_URL!);
      if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
        errors.push('DATABASE_URL debe ser una URL de PostgreSQL válida');
      }
    } catch (error) {
      errors.push('DATABASE_URL tiene un formato inválido');
    }
  }
  
  // Validar valores numéricos
  const numericVars = [
    { name: 'DB_PORT', value: process.env.DB_PORT, min: 1, max: 65535 },
    { name: 'DB_CONNECTION_TIMEOUT', value: process.env.DB_CONNECTION_TIMEOUT, min: 1000 },
    { name: 'DB_MAX_CONNECTIONS', value: process.env.DB_MAX_CONNECTIONS, min: 1 },
    { name: 'DB_IDLE_TIMEOUT', value: process.env.DB_IDLE_TIMEOUT, min: 1000 },
  ];
  
  for (const { name, value, min, max } of numericVars) {
    if (value) {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < min || (max && numValue > max)) {
        const maxStr = max ? ` y máximo ${max}` : '';
        errors.push(`${name} debe ser un número entre ${min}${maxStr}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Function to create a safe database connection string
export const createSafeConnectionString = (): string | null => {
  if (dbConfig.connectionString) {
    return dbConfig.connectionString;
  }
  
  // Crear URL de conexión a partir de variables individuales
  if (dbConfig.host && dbConfig.database && dbConfig.user) {
    const port = dbConfig.port || 5432;
    const password = dbConfig.password ? `:${dbConfig.password}` : '';
    const sslMode = process.env.DB_SSL_MODE || 'disable';
    
    return `postgres://${dbConfig.user}${password}@${dbConfig.host}:${port}/${dbConfig.database}?sslmode=${sslMode}`;
  }
  
  return null;
};

// Export configuration for use in other modules
export default dbConfig;