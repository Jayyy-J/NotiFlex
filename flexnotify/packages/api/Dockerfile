FROM node:20-alpine

WORKDIR /app

# Instalar dependencias (incluyendo devDependencies para compilar)
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY tsconfig.json ./
COPY src/ ./src/

# Compilar TypeScript → dist/
RUN npm run build

# Eliminar devDependencies después de compilar
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]
