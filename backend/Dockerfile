# Smart Skill Hub — Backend API Production Container
# Multi-stage secure build with least-privilege non-root execution

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for build / validation
RUN npm ci

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Install runtime utilities for container healthchecks
RUN apk add --no-cache curl

# Copy dependency manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code and tasks catalog
COPY src/ ./src/
COPY tasks/ ./tasks/
COPY render.yaml ./render.yaml

# Initialize uploads directory and enforce non-root ownership
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose backend API port
EXPOSE 8000

# Container healthcheck using liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/healthcheck/live || exit 1

# Start production server
CMD ["node", "src/index.js"]
