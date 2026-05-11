FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar configuración de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (necesarias para compilar vite y usar tsx)
# Forzamos la instalación de devDependencies omitiendo el posible NODE_ENV de Railway
RUN npm ci --include=dev

# Copiar el resto del código
COPY . .

# Construir la aplicación Frontend (Vite)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Asegurar que el entorno sea producción
ENV NODE_ENV=production

# Ejecutar el server directamente con tsx
CMD ["npx", "tsx", "server.ts"]
