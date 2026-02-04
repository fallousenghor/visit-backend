# Base image
FROM node:20-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip postinstall to avoid build during install)
RUN npm ci --ignore-scripts

# Copy source code (includes prisma schema)
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Final stage - production
FROM node:20-alpine AS production

# Install dependencies for production
RUN apk add --no-cache openssl postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip postinstall which requires TypeScript)
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema and generated client from builder
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Copy built files
COPY --from=base /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
