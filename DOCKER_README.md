# Despliegue del CRM Google con Docker

Esta guía explica cómo desplegar el CRM Google utilizando Docker y Docker Compose.

## Requisitos previos

- Docker (versión 20.10 o superior)
- Docker Compose (versión 2.0 o superior)
- Git

## Configuración inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd CRM-GOOGLE
   ```

2. **Configurar variables de entorno**
   
   Copia el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus configuraciones específicas:
   ```bash
   nano .env
   ```
   
   Asegúrate de configurar al menos estas variables:
   - `GEMINI_API_KEY`: Tu clave de API de Gemini
   - `DB_PASSWORD`: Una contraseña segura para la base de datos
   - `DB_USER`: Un nombre de usuario para la base de datos

## Despliegue con Docker Compose (Recomendado)

### Iniciar todos los servicios

Para iniciar la aplicación junto con la base de datos PostgreSQL:

```bash
docker-compose up -d
```

Este comando:
- Construirá la imagen de la aplicación
- Iniciará un contenedor con PostgreSQL
- Ejecutará las migraciones de la base de datos automáticamente
- Iniciará la aplicación en el puerto 3000

### Verificar el estado de los servicios

```bash
docker-compose ps
```

### Ver los logs

```bash
# Ver todos los logs
docker-compose logs -f

# Ver solo los logs de la aplicación
docker-compose logs -f app

# Ver solo los logs de la base de datos
docker-compose logs -f postgres
```

### Detener los servicios

```bash
docker-compose down
```

### Detener los servicios y eliminar volúmenes (¡cuidado! Esto eliminará todos los datos)

```bash
docker-compose down -v
```

## Despliegue manual con Docker

Si prefieres no usar Docker Compose, puedes desplegar los componentes manualmente:

### 1. Iniciar la base de datos

```bash
docker run -d \
  --name crm-postgres \
  -e POSTGRES_DB=crm_db \
  -e POSTGRES_USER=crm_user \
  -e POSTGRES_PASSWORD=crm_password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### 2. Construir la imagen de la aplicación

```bash
docker build -t crm-app .
```

### 3. Iniciar la aplicación

```bash
docker run -d \
  --name crm-app \
  --link crm-postgres:postgres \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db \
  -e GEMINI_API_KEY=tu_api_key_aqui \
  crm-app
```

## Comandos útiles

### Acceder a la base de datos directamente

```bash
docker-compose exec postgres psql -U crm_user -d crm_db
```

### Ejecutar migraciones manualmente

```bash
docker-compose exec app npm run db:migrate
```

### Verificar el estado de la base de datos

```bash
docker-compose exec app npm run db:status
```

### Reiniciar solo la aplicación (sin afectar la base de datos)

```bash
docker-compose restart app
```

### Actualizar la aplicación

```bash
# Obtener los últimos cambios
git pull

# Reconstruir y reiniciar la aplicación
docker-compose build app
docker-compose up -d app
```

## Respaldo y restauración de datos

### Crear un respaldo de la base de datos

```bash
docker-compose exec postgres pg_dump -U crm_user crm_db > backup.sql
```

### Restaurar un respaldo

```bash
docker-compose exec -T postgres psql -U crm_user crm_db < backup.sql
```

## Solución de problemas

### La aplicación no se inicia

1. Verifica los logs:
   ```bash
   docker-compose logs app
   ```

2. Verifica que la base de datos esté funcionando:
   ```bash
   docker-compose logs postgres
   ```

3. Verifica la configuración de variables de entorno en el archivo `.env`.

### Error de conexión a la base de datos

1. Asegúrate de que el contenedor de PostgreSQL esté funcionando:
   ```bash
   docker-compose ps
   ```

2. Verifica que las variables de entorno de la base de datos sean correctas.

3. Intenta conectarte manualmente a la base de datos:
   ```bash
   docker-compose exec postgres psql -U crm_user -d crm_db
   ```

### La aplicación se inicia pero no responde

1. Verifica que el puerto 3000 no esté siendo utilizado por otro servicio.

2. Asegúrate de que el firewall permita conexiones al puerto 3000.

3. Revisa los logs de la aplicación para ver si hay errores específicos.

## Personalización del despliegue

### Cambiar la versión de PostgreSQL

Edita el archivo `docker-compose.yml` y modifica la línea:
```yaml
image: postgres:15-alpine
```

### Cambiar los puertos

En `docker-compose.yml`, modifica la sección `ports`:
```yaml
ports:
  - "8080:3000"  # Acceder a la aplicación en el puerto 8080
```

### Añadir volúmenes adicionales

Para persistir logs u otros datos:
```yaml
volumes:
  - ./logs:/app/logs
  - ./data:/app/data
```

## Producción

Para un entorno de producción, considera:

1. Utilizar secrets de Docker para las variables de entorno sensibles.
2. Configurar un reverse proxy como Nginx o Traefik.
3. Implementar un sistema de monitoreo y alertas.
4. Configurar backups automáticos de la base de datos.
5. Utilizar HTTPS con certificados SSL/TLS.

## Soporte

Si encuentras problemas durante el despliegue, por favor:

1. Revisa esta documentación y los logs de los contenedores.
2. Verifica que todos los requisitos previos estén instalados correctamente.
3. Asegúrate de que las variables de entorno estén configuradas correctamente.

Para más información sobre el proyecto, consulta el README principal del repositorio.