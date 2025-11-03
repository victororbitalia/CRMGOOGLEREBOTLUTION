# Guía de Despliegue del CRM Google en EasyPanel

Esta guía te ayudará a desplegar el CRM Google en EasyPanel de manera sencilla y paso a paso. No se requieren conocimientos técnicos avanzados.

## Tabla de Contenido

1. [Requisitos Mínimos para EasyPanel](#requisitos-mínimos)
2. [Configuración Paso a Paso](#configuración-paso-a-paso)
3. [Comandos Específicos para EasyPanel](#comandos-específicos)
4. [Solución de Problemas Comunes](#solución-de-problemas)
5. [Verificación del Despliegue](#verificación-del-despliegue)

---

## Requisitos Mínimos para EasyPanel

### Recursos del Servidor

Para un funcionamiento óptimo del CRM Google, tu servidor EasyPanel debe cumplir con los siguientes requisitos:

| Recurso | Mínimo Recomendado | Óptimo |
|---------|-------------------|---------|
| CPU | 1 núcleo | 2 núcleos |
| RAM | 1 GB | 2 GB |
| Almacenamiento | 10 GB | 20 GB |
| Ancho de banda | 100 GB/mes | 500 GB/mes |

### Software Requerido

- **EasyPanel** versión 2.0 o superior
- **Docker** versión 20.10 o superior
- **Docker Compose** versión 2.0 o superior

> **Nota:** EasyPanel generalmente instala Docker automáticamente durante su configuración inicial.

---

## Configuración Paso a Paso en EasyPanel

### Paso 1: Acceder a EasyPanel

1. Abre tu navegador web y accede al panel de control de EasyPanel
2. Inicia sesión con tus credenciales de administrador

```
[Captura de pantalla simulada]
Página de inicio de sesión de EasyPanel con campos para email y contraseña
```

### Paso 2: Crear una Nueva Aplicación

1. En el dashboard principal, haz clic en el botón **"Crear Aplicación"**
2. Selecciona **"Aplicación Docker Compose"** como tipo de aplicación

```
[Captura de pantalla simulada]
Dashboard de EasyPanel mostrando el botón "Crear Aplicación" y las opciones disponibles
```

3. Completa la información básica:
   - **Nombre de la aplicación**: `crm-google`
   - **Descripción**: `Sistema CRM para gestión de reservas de restaurante`
   - **Dominio**: `tudominio.com` (reemplaza con tu dominio real)

### Paso 3: Configurar el Docker Compose

1. En la sección de configuración, pega el siguiente contenido en el campo **Docker Compose**:

```yaml
version: '3.8'

services:
  # Servicio de base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: crm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-crm_db}
      POSTGRES_USER: ${DB_USER:-crm_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-crm_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    networks:
      - crm-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-crm_user} -d ${DB_NAME:-crm_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Servicio de la aplicación CRM
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crm-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER:-crm_user}:${DB_PASSWORD:-crm_password}@postgres:5432/${DB_NAME:-crm_db}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-crm_db}
      DB_USER: ${DB_USER:-crm_user}
      DB_PASSWORD: ${DB_PASSWORD:-crm_password}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      USE_MOCK_DATA: false
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - crm-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  crm-network:
    driver: bridge
```

```
[Captura de pantalla simulada]
Editor de Docker Compose en EasyPanel mostrando el código YAML pegado
```

### Paso 4: Configurar Variables de Entorno

1. Desplázate hasta la sección **Variables de Entorno**
2. Añade las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DB_NAME` | `crm_db` | Nombre de la base de datos |
| `DB_USER` | `crm_user` | Usuario de la base de datos |
| `DB_PASSWORD` | `GENERAR_CONTRASEÑA_SEGURA` | Contraseña de la base de datos (usa una segura) |
| `GEMINI_API_KEY` | `TU_API_KEY` | Clave de API de Gemini AI |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `USE_MOCK_DATA` | `false` | Importante: debe ser false en producción |

> **Importante:** Genera una contraseña segura para `DB_PASSWORD`. Puedes usar el comando: `openssl rand -base64 32`

```
[Captura de pantalla simulada]
Sección de variables de entorno en EasyPanel mostrando las variables configuradas
```

### Paso 5: Configurar la Base de Datos PostgreSQL

1. En la sección **Base de Datos**, EasyPanel detectará automáticamente el servicio PostgreSQL
2. Verifica que la configuración sea la siguiente:
   - **Motor**: PostgreSQL
   - **Versión**: 15
   - **Usuario**: `crm_user`
   - **Base de datos**: `crm_db`

3. Haz clic en **"Crear Base de Datos"** si no se crea automáticamente

```
[Captura de pantalla simulada]
Configuración de base de datos en EasyPanel mostrando PostgreSQL configurado
```

### Paso 6: Configurar Dominio y SSL

1. En la sección **Dominios**, añade tu dominio:
   - **Dominio**: `tudominio.com` (reemplaza con tu dominio real)
   - **Forzar HTTPS**: Activa esta opción
   - **Certificado SSL**: Selecciona **"Let's Encrypt Automático"**

2. Configura las reglas de proxy:
   - **Protocolo**: HTTP
   - **Destino**: `app:3000`
   - **Path**: `/`

```
[Captura de pantalla simulada]
Configuración de dominio y SSL en EasyPanel mostrando el dominio configurado con HTTPS
```

### Paso 7: Desplegar la Aplicación

1. Revisa toda la configuración
2. Haz clic en el botón **"Crear y Desplegar"**
3. Espera a que EasyPanel complete el proceso de despliegue

```
[Captura de pantalla simulada]
Botón "Crear y Desplegar" en EasyPanel resaltado
```

---

## Comandos Específicos para EasyPanel

### Verificar Estado de los Contenedores

```bash
# Ver todos los contenedores en ejecución
docker ps

# Ver logs de la aplicación
docker logs crm-app

# Ver logs de la base de datos
docker logs crm-postgres
```

### Acceder a la Base de Datos

```bash
# Acceder a la base de datos PostgreSQL
docker exec -it crm-postgres psql -U crm_user -d crm_db

# Ver tablas creadas
\dt

# Salir de PostgreSQL
\q
```

### Reiniciar Servicios

```bash
# Reiniciar solo la aplicación
docker restart crm-app

# Reiniciar solo la base de datos
docker restart crm-postgres

# Reiniciar todos los servicios
docker-compose restart
```

### Realizar Backup de la Base de Datos

```bash
# Crear backup
docker exec crm-postgres pg_dump -U crm_user crm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i crm-postgres psql -U crm_user crm_db < backup_archivo.sql
```

---

## Solución de Problemas Comunes

### Problema 1: La aplicación no se inicia

**Síntomas:**
- La página muestra error 502 Bad Gateway
- Los logs muestran errores de conexión a la base de datos

**Solución:**
1. Verifica que la base de datos esté funcionando:
   ```bash
   docker logs crm-postgres
   ```

2. Revisa las variables de entorno:
   - Asegúrate que `DB_PASSWORD` sea la misma en ambos servicios
   - Verifica que `USE_MOCK_DATA` esté en `false`

3. Reinicia los servicios:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Problema 2: Error de conexión a la base de datos

**Síntomas:**
- La aplicación muestra "Database connection failed"
- Los logs muestran timeouts de conexión

**Solución:**
1. Verifica que el contenedor de PostgreSQL esté saludable:
   ```bash
   docker exec crm-postgres pg_isready -U crm_user -d crm_db
   ```

2. Si no está listo, espera unos minutos y reinicia la aplicación:
   ```bash
   docker restart crm-app
   ```

3. Verifica las credenciales de la base de datos en las variables de entorno

### Problema 3: El certificado SSL no se genera

**Síntomas:**
- El dominio no carga con HTTPS
- Error de certificado en el navegador

**Solución:**
1. Verifica que el dominio apunte correctamente a la IP del servidor:
   ```bash
   nslookup tudominio.com
   ```

2. Asegúrate que el puerto 80 esté abierto en el firewall

3. Reconstruye el certificado SSL desde EasyPanel:
   - Ve a la configuración del dominio
   - Haz clic en "Reconstruir Certificado"

### Problema 4: La aplicación se queda en modo de datos simulados

**Síntomas:**
- La aplicación muestra datos de ejemplo
- No se guardan los cambios en la base de datos

**Solución:**
1. Verifica la variable de entorno `USE_MOCK_DATA`:
   - Debe estar en `false`
   - Reinicia la aplicación después de cambiarla

2. Verifica que la conexión a la base de datos funcione:
   ```bash
   docker exec -it crm-postgres psql -U crm_user -d crm_db
   ```

---

## Verificación del Despliegue

### Paso 1: Verificar que los Contenedores Estén Funcionando

1. Accede a la terminal de tu servidor
2. Ejecuta el siguiente comando:
   ```bash
   docker ps
   ```

Deberías ver algo similar a:
```
CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS      NAMES
abc123def456   crm-google_app        "dumb-init -- ./star…"   2 minutes ago   Up 2 minutes   3000/tcp   crm-app
ghi789jkl012   postgres:15-alpine    "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   5432/tcp   crm-postgres
```

### Paso 2: Verificar la Conexión a la Base de Datos

1. Conéctate a la base de datos:
   ```bash
   docker exec -it crm-postgres psql -U crm_user -d crm_db
   ```

2. Verifica que las tablas se hayan creado:
   ```sql
   \dt
   ```

Deberías ver las siguientes tablas:
- reservations
- restaurant_tables
- settings
- opening_hours

### Paso 3: Verificar la Aplicación Web

1. Abre tu navegador y accede a `https://tudominio.com`
2. Deberías ver la interfaz del CRM Google

3. Verifica que puedas:
   - Crear una nueva reserva
   - Ver las mesas disponibles
   - Acceder a la configuración

### Paso 4: Verificar los Logs

1. Revisa los logs de la aplicación:
   ```bash
   docker logs crm-app
   ```

2. Busca mensajes como:
   - `✅ Database connected successfully`
   - `🌐 Iniciando la aplicación en el puerto 3000`
   - `✅ Migraciones ejecutadas correctamente`

### Paso 5: Verificar el Funcionamiento Completo

1. **Crea una reserva de prueba**:
   - Ingresa al sistema
   - Crea una nueva reserva con datos de prueba
   - Verifica que se guarde correctamente

2. **Verifica las notificaciones**:
   - Si tienes configurada la API de Gemini, prueba el funcionamiento
   - Verifica que las respuestas se generen correctamente

3. **Verifica la persistencia de datos**:
   - Reinicia los contenedores
   - Verifica que los datos se mantengan

---

## Mantenimiento Recomendado

### Backup Automático

Configura un backup diario de la base de datos:

```bash
# Crear script de backup
cat > /root/backup_crm.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec crm-postgres pg_dump -U crm_user crm_db > /backups/crm_backup_$DATE.sql
find /backups -name "crm_backup_*.sql" -mtime +7 -delete
EOF

# Hacerlo ejecutable
chmod +x /root/backup_crm.sh

# Agregar al crontab para ejecutar diario a las 2 AM
echo "0 2 * * * /root/backup_crm.sh" | crontab -
```

### Monitoreo

Monitorea el estado de los servicios regularmente:

```bash
# Script de monitoreo
cat > /root/monitor_crm.sh << 'EOF'
#!/bin/bash
if ! docker ps | grep -q crm-app; then
    echo "CRM App is down, restarting..."
    docker restart crm-app
fi

if ! docker ps | grep -q crm-postgres; then
    echo "PostgreSQL is down, restarting..."
    docker restart crm-postgres
fi
EOF

chmod +x /root/monitor_crm.sh

# Verificar cada 5 minutos
echo "*/5 * * * * /root/monitor_crm.sh" | crontab -
```

---

## Conclusión

¡Felicidades! Has desplegado exitosamente el CRM Google en EasyPanel. Tu sistema está listo para gestionar reservas de restaurante de manera eficiente.

Si encuentras algún problema no cubierto en esta guía, no dudes en consultar los logs de los contenedores o contactar al soporte técnico.

---

## Recursos Adicionales

- [Documentación oficial de EasyPanel](https://easypanel.io/docs)
- [Documentación del CRM Google](./README.md)
- [Guía de variables de entorno](./docs/ENVIRONMENT_VARIABLES.md)
- [Guía de validación de despliegue](./docs/DEPLOYMENT_VALIDATION.md)