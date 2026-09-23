# Copyright Alejandro Martínez Corriá and the Thinkube contributors
# SPDX-License-Identifier: Apache-2.0

ARG CONTAINER_REGISTRY

# Build stage — Antora renders the AsciiDoc site to ./build/site
FROM ${CONTAINER_REGISTRY}/library/node-base:22-alpine AS build

WORKDIR /app

# git: Antora reads its content source from a git repo. We init a throwaway one
# below so the build is self-contained regardless of whether the deploy context
# carried .git (the Copier sync may not).
RUN apk add --no-cache git curl

# d2: renders the [d2] diagram blocks during the Antora build (lib/d2-block.js).
# Pinned static release for the build's architecture.
ARG D2_VERSION=v0.9.0
RUN ARCH="$(uname -m)" && \
    case "$ARCH" in \
        x86_64) D2_ARCH="amd64" ;; \
        aarch64) D2_ARCH="arm64" ;; \
        *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;; \
    esac && \
    curl --retry 5 --retry-delay 5 --retry-all-errors -fsSL \
        "https://github.com/terrastruct/d2/releases/download/${D2_VERSION}/d2-${D2_VERSION}-linux-${D2_ARCH}.tar.gz" \
        -o /tmp/d2.tar.gz && \
    tar -xzf /tmp/d2.tar.gz -C /tmp && \
    install -m 0755 "/tmp/d2-${D2_VERSION}/bin/d2" /usr/local/bin/d2 && \
    rm -rf /tmp/d2.tar.gz "/tmp/d2-${D2_VERSION}" && \
    d2 --version

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# node-base sets NODE_ENV=development; production for the build
ENV NODE_ENV=production

# Node gives each address it tries 250 ms to connect; from the build pods that
# is too short for GitHub, and the fetch fails with ETIMEDOUT.
ENV NODE_OPTIONS=--network-family-autoselection-attempt-timeout=500

# Give Antora a git HEAD to read, then build. `npm run build` runs
# `antora --fetch`, which fetches the content sources and the UI bundle and
# renders the [d2] blocks with the d2 binary above. Base path is "/" for the cluster
# (GitHub Pages overrides it with `--url /thinkube.org/` in its own workflow).
RUN git config --global --add safe.directory /app \
 && git init -q && git add -A \
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
