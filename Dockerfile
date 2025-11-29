# Root Dockerfile for building the `server` service from project root
# This keeps the Dockerfile at repo root while using the `server/` folder

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app/server

# Copy package files from server and install dev deps to build
COPY server/package*.json ./
RUN npm ci

# Copy server source and build
COPY server/ ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app/server

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files and install production deps
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/server/dist ./dist

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

# Expose the port the app listens on
EXPOSE 8080

# Health check (adjust URL if your app exposes a different health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
