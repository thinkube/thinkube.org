ARG CONTAINER_REGISTRY

# Build stage
FROM ${CONTAINER_REGISTRY}/library/node-base:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Override base path for cluster deployment (GitHub Pages uses /thinkube.org/)
ENV ASTRO_BASE=/

RUN sed -i "s|base: '/thinkube.org/'|base: '/'|" astro.config.mjs && \
    npm run build

# Serve stage
FROM ${CONTAINER_REGISTRY}/library/nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback and security headers
RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ $uri.html /index.html;\n\
    }\n\
\n\
    # Cache static assets\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
