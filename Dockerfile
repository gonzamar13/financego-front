# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Aprovecha caché: copia solo manifests primero
COPY package.json package-lock.json* ./
RUN npm install

# Copia el resto del proyecto
COPY . .

# La URL de la API se inyecta en build time. Default a producción.
ARG VITE_API_URL=https://api.financego.cloud
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# Reemplaza el server block por defecto
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia el build estático
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
