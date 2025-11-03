#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve('.env.local') });
dotenv.config(); // Cargar también .env si existe

// Definición de variables requeridas y su validación
interface EnvVar {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const envVars: EnvVar[] = [
  // Variables de la aplicación
  {
    name: 'NODE_ENV',
    required: true,
    validator: (value) => ['development', 'staging', 'production'].includes(value),
    errorMessage: 'NODE_ENV debe ser uno de: development, staging, production'
  },
  {
    name: 'PORT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
    errorMessage: 'PORT debe ser un número válido entre 1 y 65535'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'NEXT_PUBLIC_APP_URL debe ser una URL válida'
  },

  // Variables de base de datos
  {
    name: 'DATABASE_URL',
    required: false, // No es requerida si se usan las variables individuales
    validator: (value) => {
      if (!value) return true; // Opcional si se usan variables individuales
      try {
        const url = new URL(value);
        return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
      } catch {
        return false;
      }
    },
    errorMessage: 'DATABASE_URL debe ser una URL de PostgreSQL válida'
  },
  {
    name: 'DB_HOST',
    required: false, // Requerido solo si no se usa DATABASE_URL
  },
  {
    name: 'DB_PORT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
    errorMessage: 'DB_PORT debe ser un número válido entre 1 y 65535'
  },
  {
    name: 'DB_NAME',
    required: false, // Requerido solo si no se usa DATABASE_URL
  },
  {
    name: 'DB_USER',
    required: false, // Requerido solo si no se usa DATABASE_URL
  },
  {
    name: 'DB_PASSWORD',
    required: false, // Requerido solo si no se usa DATABASE_URL
  },

  // Variables de conexión a la base de datos
  {
    name: 'DB_CONNECTION_TIMEOUT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'DB_CONNECTION_TIMEOUT debe ser un número positivo'
  },
  {
    name: 'DB_MAX_CONNECTIONS',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'DB_MAX_CONNECTIONS debe ser un número positivo'
  },
  {
    name: 'DB_IDLE_TIMEOUT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'DB_IDLE_TIMEOUT debe ser un número positivo'
  },

  // Variables de desarrollo
  {
    name: 'USE_MOCK_DATA',
    required: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'USE_MOCK_DATA debe ser true o false'
  },

  // Variables de logging
  {
    name: 'LOG_LEVEL',
    required: false,
    validator: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
    errorMessage: 'LOG_LEVEL debe ser uno de: error, warn, info, debug'
  },
  {
    name: 'DB_QUERY_LOGGING',
    required: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'DB_QUERY_LOGGING debe ser true o false'
  },

  // Variables de seguridad
  {
    name: 'JWT_SECRET',
    required: false,
    validator: (value) => !value || value.length >= 32,
    errorMessage: 'JWT_SECRET debe tener al menos 32 caracteres'
  },
  {
    name: 'JWT_EXPIRES_IN',
    required: false,
    validator: (value) => {
      if (!value) return true;
      const regex = /^\d+[smhd]$/;
      return regex.test(value);
    },
    errorMessage: 'JWT_EXPIRES_IN debe tener un formato válido (ej: 24h, 30m, 7d)'
  },

  // Variables de CORS
  {
    name: 'CORS_ORIGINS',
    required: false,
  },

  // Variables de notificaciones
  {
    name: 'NOTIFICATION_ENDPOINT_URL',
    required: false,
    validator: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'NOTIFICATION_ENDPOINT_URL debe ser una URL válida'
  },

  // Variables de API
  {
    name: 'GEMINI_API_KEY',
    required: false,
  },

  // Variables de archivo
  {
    name: 'MAX_FILE_SIZE',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'MAX_FILE_SIZE debe ser un número positivo'
  },
];

// Función para validar las variables de entorno
function validateEnv(): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar si existe el archivo .env
  if (!existsSync('.env') && !existsSync('.env.local')) {
    warnings.push('No se encontró archivo .env o .env.local');
  }

  // Validar variables de base de datos
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasIndividualDbVars = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);

  if (!hasDatabaseUrl && !hasIndividualDbVars) {
    errors.push('Se requiere DATABASE_URL o las variables individuales de base de datos (DB_HOST, DB_NAME, DB_USER)');
  }

  // Validar cada variable
  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      errors.push(`Variable requerida faltante: ${envVar.name}`);
      continue;
    }

    if (value && envVar.validator && !envVar.validator(value)) {
      errors.push(envVar.errorMessage || `Valor inválido para ${envVar.name}: ${value}`);
    }

    // Advertencias para variables sensibles con valores por defecto
    if (envVar.name.includes('SECRET') && value && value.includes('change') && value.includes('production')) {
      warnings.push(`Usando valor por defecto para ${envVar.name} en producción. Por favor, cambie este valor.`);
    }
  }

  // Advertencias específicas para producción
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      warnings.push('Se recomienda un JWT_SECRET seguro en producción (mínimo 32 caracteres)');
    }

    if (process.env.DB_QUERY_LOGGING === 'true') {
      warnings.push('DB_QUERY_LOGGING está habilitado en producción, lo que puede afectar el rendimiento');
    }

    if (process.env.LOG_LEVEL === 'debug') {
      warnings.push('LOG_LEVEL está configurado como debug en producción, lo que puede exponer información sensible');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Función principal
function main() {
  console.log('🔍 Validando variables de entorno...\n');

  const validation = validateEnv();

  if (validation.errors.length > 0) {
    console.error('❌ Errores encontrados:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('\n⚠️  Advertencias:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (validation.isValid) {
    console.log('\n✅ Todas las variables de entorno son válidas');
    process.exit(0);
  } else {
    console.log('\n❌ La validación de variables de entorno falló');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
main();

export { validateEnv };