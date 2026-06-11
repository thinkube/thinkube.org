ARG CONTAINER_REGISTRY

# Build stage — Antora renders the AsciiDoc site to ./build/site
FROM ${CONTAINER_REGISTRY}/library/node-base:22-alpine AS build

WORKDIR /app

# git: Antora reads its content source from a git repo. We init a throwaway one
# below so the build is self-contained regardless of whether the deploy context
# carried .git (the Copier sync may not).
RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# node-base sets NODE_ENV=development; production for the build
ENV NODE_ENV=production

# Give Antora a git HEAD to read, then build. `npm run build` runs
# `antora --fetch`, which fetches the UI bundle and renders d2 diagrams via the
# Kroki server — the cluster build has external egress (the previous Astro build
# already curl'd d2lang.com and ran npm ci). Base path is "/" for the cluster
# (GitHub Pages overrides it with `--url /thinkube.org/` in its own workflow).
RUN git init -q && git add -A \
 && git -c user.email=build@thinkube.io -c user.name=thinkube-build commit -qm build \
 && npm run build

# Serve stage — static nginx on :8080, base path "/"
FROM ${CONTAINER_REGISTRY}/library/nginx:stable-alpine

COPY --from=build /app/build/site /usr/share/nginx/html

RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
\n\
    error_page 404 /404.html;\n\
\n\
    # Antora UI assets are NOT content-hashed, so never cache them immutably —\n\
    # revalidate (cheap via etags) so a redeploy is picked up immediately.\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        add_header Cache-Control "no-cache";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
