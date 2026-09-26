# syntax=docker/dockerfile:1
# Stage 1: Build React web application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production distribution
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

RUN apk add --no-cache gzip

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy distribution from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Clean up .map files and pre-compress JS/CSS/HTML assets with max gzip
RUN rm -f /usr/share/nginx/html/*.map && \
    find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.css" \) \
    -exec gzip -9 -k {} +

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
