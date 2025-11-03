# Etapa de construcción
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración del paquete
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Instalar dependencias adicionales para producción
RUN apk add --no-cache dumb-init postgresql-client

# Crear un usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración del paquete
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci && npm cache clean --force

# Copiar los archivos construidos desde la etapa de construcción
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/database ./database
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar el script de inicio y hacerlo ejecutable
COPY --from=builder --chown=nodejs:nodejs /app/start.sh ./start.sh
RUN chmod +x start.sh

# Cambiar al usuario no root
USER nodejs

# Exponer el puerto
EXPOSE 3000

# Configurar el comando de inicio para producción
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]