# ----------------------------
# Stage 0: Base image with dependencies
# ----------------------------
FROM node:22.12.0-alpine AS dependencies

# Set environment variables
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false \
    PORT=8080

# Create app directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ----------------------------
# Stage 1: Build the app with all source files
# ----------------------------
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# Copy installed dependencies from the previous stage
COPY --from=dependencies /app /app

# Copy source code
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

# If you have any build steps (optional, e.g. transpiling), add them here
# RUN npm run build

# ----------------------------
# Stage 2: Final runtime container
# ----------------------------
FROM node:22.12.0-alpine AS final

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files from builder
COPY --from=builder /app /app

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose app port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Run the app
CMD ["npm", "start"]
