# Variables de Entorno - CRM GOOGLE

Este documento explica todas las variables de entorno utilizadas en el CRM GOOGLE, su propósito y cómo configurarlas para diferentes entornos.

## Tabla de Contenidos

- [Variables Obligatorias](#variables-obligatorias)
- [Variables de Base de Datos](#variables-de-base-de-datos)
- [Variables de la Aplicación](#variables-de-la-aplicación)
- [Variables de Seguridad](#variables-de-seguridad)
- [Variables de Desarrollo](#variables-de-desarrollo)
- [Variables de Logging](#variables-de-logging)
- [Variables de Notificaciones](#variables-de-notificaciones)
- [Variables de Email](#variables-de-email)
- [Variables de Redis](#variables-de-redis)
- [Variables de Archivos](#variables-de-archivos)
- [Variables de Analytics](#variables-de-analytics)
- [Variables de Monitorización](#variables-de-monitorización)
- [Configuración por Entorno](#configuración-por-entorno)
- [Guía de Seguridad](#guía-de-seguridad)

## Variables Obligatorias

Estas variables son requeridas para que la aplicación funcione correctamente:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación | `https://crm.example.com` |

## Variables de Base de Datos

Configuración para la conexión a PostgreSQL:

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `DATABASE_URL` | URL completa de conexión a PostgreSQL | - | `postgres://admin:admin@ibidem_bot_new-crm-db:5432/admin?sslmode=disable` |
| `DB_HOST` | Host de la base de datos | `localhost` | `ibidem_bot_new-crm-db` |
| `DB_PORT` | Puerto de la base de datos | `5432` | `5432` |
| `DB_NAME` | Nombre de la base de datos | `crm_db` | `admin` |
| `DB_USER` | Usuario de la base de datos | `postgres` | `admin` |
| `DB_PASSWORD` | Contraseña de la base de datos | - | `admin` |
| `DB_CONNECTION_TIMEOUT` | Tiempo de espera para conexión (ms) | `10000` | `10000` |
| `DB_MAX_CONNECTIONS` | Máximo de conexiones simultáneas | `20` | `20` |
| `DB_IDLE_TIMEOUT` | Tiempo de inactividad antes de cerrar conexión (ms) | `30000` | `30000` |
| `DB_SSL_MODE` | Modo SSL para la conexión | `disable` | `require` |

**Nota**: Puedes usar `DATABASE_URL` o las variables individuales (`DB_HOST`, `DB_PORT`, etc.). Si se proporciona `DATABASE_URL`, tendrá prioridad sobre las variables individuales.

## Variables de la Aplicación

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `PORT` | Puerto en el que se ejecuta la aplicación | `3000` | `3000` |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:3000` | `https://crm.example.com,https://admin.example.com` |

## Variables de Seguridad

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | - | `your_super_secret_jwt_key_change_in_production` |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token JWT | `24h` | `24h` |

## Variables de API

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `GEMINI_API_KEY` | Clave de API para Gemini AI | - | `your_gemini_api_key_here` |

## Variables de Desarrollo

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `USE_MOCK_DATA` | Usar datos de simulación en desarrollo | `false` | `true` |

## Variables de Logging

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `LOG_LEVEL` | Nivel de logging | `info` | `debug` |
| `DB_QUERY_LOGGING` | Habilitar logging de consultas a la base de datos | `false` | `true` |

## Variables de Notificaciones

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `NOTIFICATION_ENDPOINT_URL` | URL del endpoint de notificaciones | - | `https://your-notification-service.com/webhook` |
| `NOTIFICATION_API_KEY` | Clave de API para el servicio de notificaciones | - | `your_notification_api_key` |

## Variables de Email

Configuración opcional para envío de correos:

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `SMTP_HOST` | Servidor SMTP | - | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` | `587` |
| `SMTP_USER` | Usuario SMTP | - | `your_email@gmail.com` |
| `SMTP_PASSWORD` | Contraseña SMTP | - | `your_app_password` |
| `SMTP_FROM` | Dirección de correo remitente | - | `noreply@yourdomain.com` |

## Variables de Redis

Configuración opcional para caché y sesiones:

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `REDIS_URL` | URL de conexión a Redis | - | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Contraseña de Redis | - | `your_redis_password` |

## Variables de Archivos

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `MAX_FILE_SIZE` | Tamaño máximo de archivo (bytes) | `5242880` | `10485760` |
| `UPLOAD_DIR` | Directorio para archivos subidos | `./uploads` | `/var/www/uploads` |

## Variables de Analytics

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `GA_TRACKING_ID` | ID de seguimiento de Google Analytics | - | `GA-XXXXXXXXX` |

## Variables de Monitorización

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `HEALTH_CHECK_WEBHOOK_URL` | URL de webhook para monitorización | - | `https://your-monitoring-service.com/webhook` |

## Variables de Características

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `ENABLE_EXPERIMENTAL_FEATURES` | Habilitar características experimentales | `false` | `true` |

## Configuración por Entorno

### Desarrollo

```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://dev_user:dev_password@localhost:5432/crm_dev
USE_MOCK_DATA=true
LOG_LEVEL=debug
DB_QUERY_LOGGING=true
```

### Staging

```bash
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.crm.example.com
DATABASE_URL=postgres://staging_user:staging_password@staging-db.example.com:5432/crm_staging
LOG_LEVEL=info
DB_QUERY_LOGGING=false
```

### Producción

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crm.example.com
DATABASE_URL=postgres://admin:admin@ibidem_bot_new-crm-db:5432/admin?sslmode=disable
LOG_LEVEL=warn
DB_QUERY_LOGGING=false
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
DB_SSL_MODE=require
```

## Guía de Seguridad

### Manejo de Secrets

1. **Nunca commits de secrets en el repositorio**
   - Usa `.gitignore` para excluir archivos `.env`
   - Usa variables de entorno en tu sistema de despliegue

2. **Genera secrets seguros**
   ```bash
   # Generar JWT_SECRET seguro
   openssl rand -base64 32
   
   # Generar contraseña de base de datos segura
   openssl rand -base64 16
   ```

3. **Rotación de secrets**
   - Establece una política de rotación regular para secrets
   - Documenta el proceso de rotación

4. **Principio de mínimo privilegio**
   - Usa usuarios de base de datos con permisos limitados
   - No uses el usuario `postgres` para la aplicación

### Variables Sensibles

Las siguientes variables contienen información sensible y deben manejarse con cuidado:

- `DATABASE_URL` - Contiene credenciales de base de datos
- `DB_PASSWORD` - Contraseña de base de datos
- `JWT_SECRET` - Secreto para tokens JWT
- `GEMINI_API_KEY` - Clave de API externa
- `NOTIFICATION_API_KEY` - Clave de API de notificaciones
- `SMTP_PASSWORD` - Contraseña de correo electrónico
- `REDIS_PASSWORD` - Contraseña de Redis

### Mejores Prácticas

1. **Usa diferentes secrets para cada entorno**
2. **Almacena secrets en un gestor de secrets (AWS Secrets Manager, Azure Key Vault, etc.)**
3. **Limita el acceso a secrets solo al personal necesario**
4. **Monitorea el acceso y uso de secrets**
5. **Usa variables de entorno con prefijo `NEXT_PUBLIC_` solo para datos no sensibles que deben estar disponibles en el cliente**

## Validación de Variables de Entorno

El proyecto incluye un script de validación que verifica que todas las variables requeridas estén presentes y tengan el formato correcto:

```bash
# Ejecutar validación
npm run validate-env

# Se ejecuta automáticamente antes de iniciar la aplicación
npm run dev
npm run build
```

El script validará:
- Variables requeridas
- Formatos de URL
- Valores numéricos en rangos válidos
- Configuraciones específicas de producción

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verifica `DATABASE_URL` o variables individuales
   - Confirma que el servidor de base de datos esté accesible
   - Revisa credenciales y permisos

2. **Variables no disponibles en el cliente**
   - Asegúrate de que las variables tengan el prefijo `NEXT_PUBLIC_`
   - Reinicia el servidor después de cambiar variables

3. **Error de validación de entorno**
   - Ejecuta `npm run validate-env` para ver errores específicos
   - Revisa que todas las variables requeridas estén presentes

### Depuración

Para depurar problemas con variables de entorno:

1. **Verifica qué variables están cargadas**
   ```bash
   # En Unix/Linux
   printenv | grep -E "(DATABASE_|JWT_|NEXT_PUBLIC_)"
   
   # En Windows
   set | findstr DATABASE_
   ```

2. **Usa el script de validación**
   ```bash
   npm run validate-env
   ```

3. **Revisa la configuración de Vite**
   - Asegúrate de que las variables estén definidas en `vite.config.ts`
   - Verifica que las variables críticas estén expuestas correctamente

## Recursos Adicionales

- [Documentación de Vite sobre variables de entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Guía de seguridad de OWASP](https://owasp.org/www-project-cheat-sheets/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Best practices for environment variables](https://12factor.net/config)