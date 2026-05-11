FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar configuración de dependencias
COPY package*.json ./

# Instalar dependencias e instalar dependencias específicas de Playwright y navegadores
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación Frontend (Vite)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Asegurar que el entorno sea producción
ENV NODE_ENV=production

# Ejecutar el script start
CMD ["npm", "start"]
