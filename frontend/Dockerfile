# syntax=docker/dockerfile:1

# --- Etapa 1: build de la aplicación Angular ---
# Node 24 trae npm 11, la misma versión mayor con la que se generó package-lock.json.
FROM node:24.22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servir los estáticos con nginx ---
FROM nginx:1.29-alpine

# URL del backend a la que nginx reenvía /api. Se resuelve al arrancar el contenedor,
# así la misma imagen sirve para docker compose y para Cloud Run.
ENV API_UPSTREAM=http://backend:8000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
