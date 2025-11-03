<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CRM GOOGLE - Sistema de Gestión de Reservas

Este es un sistema completo de gestión de reservas para restaurantes desarrollado con React, TypeScript y PostgreSQL.

View your app in AI Studio: https://ai.studio/apps/drive/1--OYXSu4i9u2ZV7j_zncswL-ri8uJWWw

## Características

- 📊 **Dashboard Interactivo**: Visualización de reservas y mesas en tiempo real
- 🍽️ **Gestión de Mesas**: Organización por zonas y capacidad
- 📅 **Sistema de Reservas**: Gestión completa de reservas con estados
- 🔔 **Notificaciones Automáticas**: Sistema de notificaciones para clientes
- 📱 **Interfaz Responsiva**: Diseño adaptable para diferentes dispositivos
- 🗄️ **Base de Datos PostgreSQL**: Almacenamiento robusto y escalable
- 🧪 **Modo Desarrollo**: Soporte para datos de simulación

## Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (para producción)
- npm o yarn

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env.local
```

Configura las siguientes variables obligatorias en tu archivo `.env.local`:

```bash
# API Configuration
GEMINI_API_KEY=tu_gemini_api_key_aqui

# PostgreSQL Configuration
DATABASE_URL=postgres://admin:admin@ibidem_bot_new-crm-db:5432/admin?sslmode=disable

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

Para más información sobre todas las variables de entorno disponibles, consulta la [documentación completa](docs/ENVIRONMENT_VARIABLES.md).

### 3. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia el servidor de desarrollo
npm run build            # Construye la aplicación para producción
npm run preview          # Previsualiza la aplicación de producción

# Base de Datos
npm run db               # Ejecuta el CLI de la base de datos
npm run db:migrate       # Ejecuta las migraciones de la base de datos
npm run db:rollback      # Revierte la última migración
npm run db:status        # Muestra el estado de las migraciones
npm run db:reset         # Resetea la base de datos

# Utilidades
npm run validate-env     # Valida las variables de entorno
```

## Configuración de Base de Datos

### Usando Docker (Recomendado)

```bash
# Inicia PostgreSQL con Docker
docker-compose up -d postgres

# Ejecuta las migraciones
npm run db:migrate
```

### Configuración Manual

1. Crea una base de datos PostgreSQL
2. Configura las variables de entorno de la base de datos
3. Ejecuta las migraciones:
   ```bash
   npm run db:migrate
   ```

## Estructura del Proyecto

```
├── api/                    # Endpoints de API
├── components/             # Componentes de React
├── database/               # Configuración y servicios de base de datos
│   ├── migrations/         # Archivos de migración
│   ├── services/           # Servicios de base de datos
│   └── config.ts           # Configuración de conexión
├── docs/                   # Documentación
├── hooks/                  # Hooks personalizados de React
├── scripts/                # Scripts de utilidad
└── types.ts               # Definiciones de tipos TypeScript
```

## Desarrollo

### Modo de Datos de Simulación

Para desarrollo sin base de datos, puedes habilitar el modo de datos de simulación:

```bash
# En .env.local
USE_MOCK_DATA=true
```

### Validación de Variables de Entorno

El proyecto incluye un script de validación que verifica que todas las variables requeridas estén presentes:

```bash
npm run validate-env
```

Este script se ejecuta automáticamente antes de iniciar la aplicación o construir para producción.

## Despliegue

### Producción

1. Configura las variables de entorno de producción
2. Construye la aplicación:
   ```bash
   npm run build
   ```
3. Inicia el servidor de producción:
   ```bash
   npm run preview
   ```

### Variables de Entorno de Producción

Para producción, asegúrate de configurar:

```bash
NODE_ENV=production
DATABASE_URL=postgres://usuario:contraseña@host:puerto/base_de_datos?sslmode=require
JWT_SECRET=tu_secreto_seguro_de_al_menos_32_caracteres
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Consulte la [documentación de variables de entorno](docs/ENVIRONMENT_VARIABLES.md) para una guía completa.

## Docker

El proyecto incluye configuración para Docker:

```bash
# Construir y ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.

## Soporte

Para preguntas o soporte:

- Consulta la [documentación](docs/ENVIRONMENT_VARIABLES.md)
- Revisa los [issues del proyecto](https://github.com/tu-repo/issues)
- Contacta al equipo de desarrollo

## Cambios Recientes

- ✅ Configuración completa de variables de entorno
- ✅ Script de validación de entorno
- ✅ Mejoras en la configuración de base de datos
- ✅ Documentación detallada de variables de entorno
- ✅ Optimizaciones para producción
