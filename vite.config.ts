import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Variables que deben estar disponibles en el cliente (NEXT_PUBLIC_*)
    const clientEnv = {
        NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        NEXT_PUBLIC_NODE_ENV: env.NODE_ENV || 'development',
        NEXT_PUBLIC_PORT: env.PORT || '3000',
        NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES: env.ENABLE_EXPERIMENTAL_FEATURES || 'false',
        NEXT_PUBLIC_GA_TRACKING_ID: env.GA_TRACKING_ID || '',
    };
    
    return {
      server: {
        port: parseInt(env.PORT) || 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Externalizar módulos de Node.js que no deben ser incluidos en el bundle del cliente
      external: [
        'pg',
        'pg-native',
        'pg-pool',
        'dotenv',
        'fs',
        'path',
        'crypto',
        'util',
        'stream',
        'string_decoder',
        'events',
        'net',
        'tls',
        'dns'
      ],
      define: {
        // Variables de entorno del cliente
        ...Object.keys(clientEnv).reduce((acc, key) => {
            acc[`process.env.${key}`] = JSON.stringify(clientEnv[key as keyof typeof clientEnv]);
            return acc;
        }, {} as Record<string, string>),
        
        // Variables de entorno del servidor (solo para referencia)
        // NOTA: Las credenciales sensibles no deben exponerse al cliente
        'process.env.DATABASE_URL': JSON.stringify(''),
        'process.env.DB_HOST': JSON.stringify(''),
        'process.env.DB_PORT': JSON.stringify(''),
        'process.env.DB_NAME': JSON.stringify(''),
        'process.env.DB_USER': JSON.stringify(''),
        'process.env.DB_PASSWORD': JSON.stringify(''),
        'process.env.DB_CONNECTION_TIMEOUT': JSON.stringify(''),
        'process.env.DB_MAX_CONNECTIONS': JSON.stringify(''),
        'process.env.DB_IDLE_TIMEOUT': JSON.stringify(''),
        'process.env.USE_MOCK_DATA': JSON.stringify(env.USE_MOCK_DATA || 'false'),
        'process.env.LOG_LEVEL': JSON.stringify(''),
        'process.env.DB_QUERY_LOGGING': JSON.stringify(''),
        'process.env.JWT_SECRET': JSON.stringify(''),
        'process.env.JWT_EXPIRES_IN': JSON.stringify(''),
        'process.env.CORS_ORIGINS': JSON.stringify(''),
        'process.env.NOTIFICATION_ENDPOINT_URL': JSON.stringify(''),
        'process.env.NOTIFICATION_API_KEY': JSON.stringify(''),
        'process.env.SMTP_HOST': JSON.stringify(''),
        'process.env.SMTP_PORT': JSON.stringify(''),
        'process.env.SMTP_USER': JSON.stringify(''),
        'process.env.SMTP_PASSWORD': JSON.stringify(''),
        'process.env.SMTP_FROM': JSON.stringify(''),
        'process.env.REDIS_URL': JSON.stringify(''),
        'process.env.REDIS_PASSWORD': JSON.stringify(''),
        'process.env.MAX_FILE_SIZE': JSON.stringify(''),
        'process.env.UPLOAD_DIR': JSON.stringify(''),
        'process.env.HEALTH_CHECK_WEBHOOK_URL': JSON.stringify(''),
        'process.env.ADMIN_PASSWORD': JSON.stringify(''),
        'process.env.GEMINI_API_KEY': JSON.stringify(''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Optimizaciones para producción
      build: {
        // Solo generar source maps en desarrollo
        sourcemap: mode === 'development',
        // Minificación en producción
        minify: mode === 'production' ? 'terser' : false,
        // Optimización del tamaño del bundle
        rollupOptions: {
          // Externalizar módulos de Node.js que no deben ser incluidos en el bundle del cliente
          external: [
            'pg',
            'pg-native',
            'pg-pool',
            'dotenv',
            'fs',
            'path',
            'crypto',
            'util',
            'stream',
            'string_decoder',
            'events',
            'net',
            'tls',
            'dns'
          ],
          output: {
            manualChunks: {
              // Separar vendor libraries
              vendor: ['react', 'react-dom'],
              // Separar componentes de UI
              ui: ['recharts'],
            }
          }
        }
      },
      // Configuración de dependencias externas para producción
      optimizeDeps: {
        include: ['react', 'react-dom', 'recharts']
      }
    };
});
