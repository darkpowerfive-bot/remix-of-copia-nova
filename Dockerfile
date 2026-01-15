# ============================================
# LA CASA DARK CORE - Production Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Set environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
# Skip image optimization in Docker (images already optimized locally)
ENV VITE_SKIP_IMAGE_OPTIMIZATION=true

# Build the application
RUN npm run build

# ============================================
# Production stage - Nginx (optimized for 1000+ users)
# ============================================
FROM nginx:alpine AS production

# Install curl for health checks and performance tools
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Pre-compress static assets with gzip for gzip_static
RUN find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.svg" \) -exec gzip -k -9 {} \;

# Create health check endpoint
RUN echo "OK" > /usr/share/nginx/html/health

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Increase nginx worker file limit
RUN echo "worker_rlimit_nofile 100000;" > /etc/nginx/conf.d/worker-limit.conf || true

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx with optimized settings
CMD ["nginx", "-g", "daemon off;"]