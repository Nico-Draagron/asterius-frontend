# Frontend Dockerfile (React/Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package files
COPY package.json ./
COPY bun.lockb* ./

# Instalar dependências (priorizar npm por compatibilidade)
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção com nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar nginx para SPA
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass \$VITE_API_URL;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
