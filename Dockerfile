# ==============================================================================
# TechTink E-Commerce - Multi-Stage Production Dockerfile
# Base: Node.js 22 Alpine (Native node:sqlite support)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Frontend Assets (Vite + React)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /build

# Copy dependency manifests for efficient Docker caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm ci

# Copy full source and build production static bundle
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Server Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy dependency manifests and install production-only dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application server code
COPY server.js ./
COPY server ./server
COPY scripts ./scripts
COPY index.html ./

# Copy built frontend distribution from builder stage
COPY --from=builder /build/dist ./dist

# Create persistent data directory for SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user for security best practices
USER node

# Expose internal backend port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/config || exit 1

# Start TechTink server
CMD ["node", "server.js"]
