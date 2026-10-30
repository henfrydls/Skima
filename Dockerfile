# Stage 1: Build client
FROM node:20-alpine AS build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install server dependencies + generate Prisma client.
# better-sqlite3 (the Prisma driver-adapter's SQLite driver) is a native addon
# with no musl prebuilds, so alpine compiles it from source — install the
# toolchain just for npm ci and drop it in the same layer to keep the image
# small.
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma/ ./server/prisma/
# prisma CLI is a devDependency (omitted here), so pin the npx-fetched version
# to the client's exact release: the Rust-free client (engineType=client +
# queryCompiler WASM) is a tight generator/runtime contract — a floating
# `prisma@latest` could emit a client the runtime can't load.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && cd server && npm ci --omit=dev && npx prisma@6.19.3 generate \
    && apk del .build-deps

# Copy server source
COPY server/src/ ./server/src/

# Copy built client
COPY --from=build /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=3001
ENV DATABASE_URL=file:/app/data/skills.db
ENV DOCKER=true

# Anonymous check-in. Empty by default: a local or fork build sends nothing.
# The official image gets them as build args from CI secrets (docker.yml).
ARG CHECKIN_URL=""
ARG CHECKIN_WEBSITE_ID=""
ARG SKIMA_VERSION=""
ENV CHECKIN_URL=$CHECKIN_URL
ENV CHECKIN_WEBSITE_ID=$CHECKIN_WEBSITE_ID
ENV SKIMA_VERSION=$SKIMA_VERSION

EXPOSE 3001

COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
