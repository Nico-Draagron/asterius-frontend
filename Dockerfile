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

# Criar configuração nginx para SPA
RUN echo 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    \n\
    location /health {\n\
        return 200 "healthy";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
