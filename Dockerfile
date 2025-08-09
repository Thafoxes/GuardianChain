# Multi-stage build for GuardianChain
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies (including dev dependencies for build tools like Vite)
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build API and serve everything
FROM node:18-alpine AS production

WORKDIR /app

# Install API dependencies
COPY api/package*.json ./
RUN npm ci --only=production

# Copy API source
COPY api/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the API server (which will also serve the frontend)
CMD ["npm", "start"]
