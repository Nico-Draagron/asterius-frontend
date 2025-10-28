# Frontend Dockerfile (React/Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package files primeiro
COPY package.json ./
COPY package-lock.json* ./
COPY bun.lockb* ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar configuração do projeto
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build da aplicação
RUN npm run build

# Stage de produção com nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Criar arquivo de configuração nginx
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    listen [::]:8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Para SPAs - todas as rotas vão para index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF

# Configurar nginx.conf principal para Cloud Run
COPY <<EOF /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types
        text/css
        text/javascript
        text/xml
        text/plain
        text/x-component
        application/javascript
        application/x-javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

EXPOSE 8080

# Usar um script de entrada personalizado
COPY <<EOF /docker-entrypoint.sh
#!/bin/sh
set -e

echo "Starting nginx on port 8080..."
echo "Nginx config:"
cat /etc/nginx/conf.d/default.conf

# Testar configuração
nginx -t

# Iniciar nginx
exec nginx -g "daemon off;"
EOF

RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
