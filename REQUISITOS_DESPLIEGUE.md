# Requisitos de Despliegue - CRM GOOGLE

## Resumen
Este documento describe los requisitos y pasos necesarios para desplegar de forma segura la aplicación CRM GOOGLE en un entorno de producción.

## Requisitos del Sistema

### Hardware Mínimo
- CPU: 2 núcleos
- RAM: 4 GB
- Almacenamiento: 20 GB SSD
- Red: Conexión a internet estable

### Software Requerido
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git 2.30+

## Configuración de Variables de Entorno

### Variables Obligatorias para Producción
Antes de desplegar, asegúrese de configurar las siguientes variables en su archivo `.env`:

```bash
# Seguridad
ADMIN_PASSWORD=GENERAR_CONTRASEÑA_SEGURA_AQUI
JWT_SECRET=GENERAR_SECRETO_JWT_SEGURO_AQUI

# Base de Datos
DB_PASSWORD=CONTRASEÑA_BASE_DE_DATOS_SEGURA
DB_USER=USUARIO_BASE_DE_DATOS
DB_NAME=NOMBRE_BASE_DE_DATOS

# API
GEMINI_API_KEY=SU_CLAVE_API_GEMINI

# Aplicación
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://su-dominio.com
```

### Generación de Contraseñas Seguras
Use los siguientes comandos para generar contraseñas seguras:

```bash
# Para JWT_SECRET
openssl rand -base64 32

# Para ADMIN_PASSWORD y DB_PASSWORD
openssl rand -base64 16
```

## Pasos de Despliegue

### 1. Preparación del Entorno
```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd CRM-GOOGLE

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar variables de entorno con valores seguros
nano .env
```

### 2. Construcción y Despliegue
```bash
# Construir y levantar servicios
docker-compose up -d --build

# Verificar estado de los servicios
docker-compose ps

# Verificar logs
docker-compose logs -f
```

### 3. Verificación del Despliegue
```bash
# Verificar salud de la aplicación
curl -f http://localhost:3000

# Verificar conexión a base de datos
docker-compose exec app npm run db:status
```

## Configuraciones de Seguridad Implementadas

### 1. Contenerización Segura
- Uso de usuario no root en contenedores
- Límites de recursos CPU y memoria
- Aislamiento de red entre servicios
- No exposición de puertos de base de datos al host

### 2. Gestión de Secretos
- Eliminación de contraseñas hardcoded
- Variables de entorno sensibles no expuestas al cliente
- Separación entre variables de servidor y cliente

### 3. Configuración SSL/TLS
- Configuración para HTTPS en producción
- Redirección automática HTTP a HTTPS
- Headers de seguridad configurados

## Monitoreo y Mantenimiento

### Health Checks
La aplicación incluye health checks automáticos:
- Verificación de conexión a base de datos
- Verificación de respuesta HTTP de la aplicación
- Reinicio automático en caso de fallos

### Logs
Los logs se almacenan en `./logs` y incluyen:
- Logs de aplicación
- Logs de acceso
- Logs de errores

### Backups
Realice backups periódicos de:
- Base de datos PostgreSQL
- Archivos de configuración
- Logs importantes

## Solución de Problemas Comunes

### Problemas de Conexión
```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar red
docker network ls
docker network inspect crm-google_crm-network

# Reiniciar servicios
docker-compose restart
```

### Problemas de Base de Datos
```bash
# Verificar conexión a base de datos
docker-compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# Migraciones pendientes
docker-compose exec app npm run db:migrate
```

### Problemas de Variables de Entorno
```bash
# Validar variables de entorno
docker-compose exec app npm run validate-env

# Verificar configuración
docker-compose config
```

## Consideraciones de Producción

### Escalabilidad
- Para mayor carga, considere usar Docker Swarm o Kubernetes
- Implemente balanceo de carga con múltiples instancias
- Configure replicación de base de datos

### Rendimiento
- Configure Redis para caché si es necesario
- Implemente CDN para assets estáticos
- Optimice consultas a base de datos

### Seguridad Adicional
- Implemente WAF (Web Application Firewall)
- Configure monitoreo de seguridad
- Realice auditorías de seguridad periódicas
- Implemente políticas de respaldo y recuperación

## Contacto de Soporte
Para problemas técnicos o preguntas sobre el despliegue:
- Revisar logs en `./logs`
- Consultar documentación técnica
- Contactar al equipo de desarrollo

## Actualizaciones
Para actualizar la aplicación:
```bash
# Obtener cambios
git pull origin main

# Reconstruir y desplegar
docker-compose down
docker-compose up -d --build