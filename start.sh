#!/bin/sh

# Script de inicio para producción del CRM Google
# Este script ejecuta las migraciones de la base de datos y luego inicia la aplicación

set -e

echo "🚀 Iniciando CRM Google en modo producción..."

# Función para verificar si la base de datos está lista
wait_for_db() {
    echo "⏳ Esperando a que la base de datos esté disponible..."
    
    # Extraer variables de conexión de DATABASE_URL o usar variables individuales
    if [ -n "$DATABASE_URL" ]; then
        # Parse DATABASE_URL (formato: postgresql://user:password@host:port/dbname)
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    fi
    
    # Valores predeterminados si no están definidos
    DB_HOST=${DB_HOST:-"localhost"}
    DB_PORT=${DB_PORT:-"5432"}
    DB_NAME=${DB_NAME:-"crm_db"}
    DB_USER=${DB_USER:-"crm_user"}
    
    # Esperar a que la base de datos esté disponible
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER >/dev/null 2>&1; then
            echo "✅ Base de datos disponible en $DB_HOST:$DB_PORT"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "⏳ Intento $attempt/$max_attempts: Esperando a la base de datos..."
        sleep 2
    done
    
    echo "❌ Error: No se pudo conectar a la base de datos después de $max_attempts intentos"
    exit 1
}

# Función para ejecutar migraciones
run_migrations() {
    echo "🔄 Ejecutando migraciones de la base de datos..."
    
    # Verificar si existen archivos de migración
    if [ -d "database/migrations" ] && [ "$(ls -A database/migrations)" ]; then
        # Ejecutar migraciones usando el CLI de la base de datos
        if npm run db:migrate; then
            echo "✅ Migraciones ejecutadas correctamente"
        else
            echo "❌ Error al ejecutar las migraciones"
            exit 1
        fi
    else
        echo "ℹ️ No se encontraron archivos de migración, omitiendo este paso"
    fi
}

# Función para iniciar la aplicación
start_app() {
    echo "🌐 Iniciando la aplicación en el puerto ${PORT:-3000}..."
    
    # Iniciar la aplicación
    if [ "$NODE_ENV" = "production" ]; then
        # En producción, usar el servidor Express
        exec npm start
    else
        # En desarrollo, usar el servidor de desarrollo
        exec npm run dev
    fi
}

# Ejecutar las funciones en orden
wait_for_db
run_migrations
start_app