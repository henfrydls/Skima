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

# Install server dependencies + generate Prisma client
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma/ ./server/prisma/
RUN cd server && npm ci --omit=dev && npx prisma generate

# Copy server source
COPY server/src/ ./server/src/

# Copy built client
COPY --from=build /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=3001
ENV DATABASE_URL=file:/app/data/skills.db

EXPOSE 3001

COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
