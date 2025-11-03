# Guía de Despliegue en Servidor - CRM GOOGLE

Esta guía explica cómo desplegar el CRM GOOGLE en tu propio servidor de forma rápida y sencilla.

## Requisitos Previos

- Servidor con Ubuntu 20.04+ o CentOS 8+
- Docker y Docker Compose instalados
- Acceso a terminal con privilegios sudo
- Dominio (opcional, pero recomendado)

## Opción 1: Despliegue con Docker (Recomendado)

### Paso 1: Clonar el Proyecto

```bash
# Clonar desde GitHub
git clone https://github.com/tu-usuario/CRM-GOOGLE.git
cd CRM-GOOGLE

# O si tienes los archivos localmente, súbelos al servidor
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo de configuración
nano .env
```

Configura las siguientes variables esenciales:

```bash
# API Configuration
GEMINI_API_KEY=tu_clave_api_gemini_aqui

# PostgreSQL Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=crm_db
DB_USER=crm_user
DB_PASSWORD=tu_contraseña_segura_aqui

# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://tu-dominio-o-ip:3000

# Security Settings
ADMIN_PASSWORD=tu_contraseña_admin_segura
JWT_SECRET=genera_un_secreto_seguro_de_32_caracteres
```

### Paso 3: Iniciar los Contenedores

```bash
# Construir e iniciar los contenedores
docker-compose up -d

# Verificar que los contenedores están corriendo
docker-compose ps

# Ver logs si hay problemas
docker-compose logs -f
```

### Paso 4: Verificar el Despliegue

```bash
# Verificar que la aplicación está funcionando
curl http://localhost:3000

# O accede desde tu navegador: http://tu-ip-servidor:3000
```

## Opción 2: Despliegue con Node.js Directo

### Paso 1: Instalar Node.js y PostgreSQL

```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar y habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Paso 2: Configurar Base de Datos PostgreSQL

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE crm_db;
CREATE USER crm_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
\q
```

### Paso 3: Clonar y Configurar el Proyecto

```bash
# Clonar el proyecto
git clone https://github.com/tu-usuario/CRM-GOOGLE.git
cd CRM-GOOGLE

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env
```

Configura las variables esenciales:

```bash
# API Configuration
GEMINI_API_KEY=tu_clave_api_gemini_aqui

# PostgreSQL Configuration
DATABASE_URL=postgres://crm_user:tu_contraseña_segura@localhost:5432/crm_db

# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://tu-dominio-o-ip:3000

# Security Settings
ADMIN_PASSWORD=tu_contraseña_admin_segura
JWT_SECRET=genera_un_secreto_seguro_de_32_caracteres
```

### Paso 4: Construir y Ejecutar la Aplicación

```bash
# Construir para producción
npm run build

# Ejecutar migraciones de la base de datos
npm run db:migrate

# Iniciar la aplicación
npm run preview
```

### Paso 5: Configurar como Servicio (Opcional)

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/crm-google.service
```

Contenido del archivo:

```ini
[Unit]
Description=CRM Google Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/CRM-GOOGLE
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Iniciar y habilitar el servicio
sudo systemctl start crm-google
sudo systemctl enable crm-google

# Verificar estado
sudo systemctl status crm-google
```

## Configuración con Nginx (Opcional pero Recomendado)

### Paso 1: Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Paso 2: Configurar Virtual Host

```bash
sudo nano /etc/nginx/sites-available/crm-google
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/crm-google /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## Comandos de Verificación

### Para Docker

```bash
# Verificar contenedores activos
docker-compose ps

# Ver logs de la aplicación
docker-compose logs -f app

# Ver logs de la base de datos
docker-compose logs -f postgres

# Verificar estado de la base de datos
docker-compose exec postgres pg_isready -U crm_user -d crm_db

# Acceder a la base de datos
docker-compose exec postgres psql -U crm_user -d crm_db
```

### Para Node.js Directo

```bash
# Verificar que la aplicación está corriendo
curl http://localhost:3000

# Verificar conexión a la base de datos
psql -h localhost -U crm_user -d crm_db -c "SELECT version();"

# Verificar logs de la aplicación
journalctl -u crm-google -f
```

## Solución de Problemas Comunes

### Problema: La aplicación no se inicia

```bash
# Verificar variables de entorno
npm run validate-env

# Verificar conexión a la base de datos
npm run db:status

# Revisar logs
docker-compose logs -f app
```

### Problema: Error de conexión a la base de datos

```bash
# Para Docker
docker-compose down
docker-compose up -d postgres
# Esperar 30 segundos
docker-compose up -d app

# Para Node.js directo
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Problema: Permisos de archivos

```bash
# Corregir permisos
sudo chown -R $USER:$USER .
chmod +x start.sh
```

## Actualización del Sistema

### Para Docker

```bash
# Actualizar código
git pull

# Reconstruir y reiniciar contenedores
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ejecutar migraciones si es necesario
docker-compose exec app npm run db:migrate
```

### Para Node.js Directo

```bash
# Actualizar código
git pull

# Instalar nuevas dependencias
npm install

# Reconstruir aplicación
npm run build

# Ejecutar migraciones
npm run db:migrate

# Reiniciar servicio
sudo systemctl restart crm-google
```

## Resumen Rápido

Para un despliegue rápido con Docker:

```bash
git clone https://github.com/tu-usuario/CRM-GOOGLE.git
cd CRM-GOOGLE
cp .env.example .env
# Editar .env con tus configuraciones
docker-compose up -d
curl http://localhost:3000
```

¡Listo! Tu CRM GOOGLE estará funcionando en http://tu-ip-servidor:3000