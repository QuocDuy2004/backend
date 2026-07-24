# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application (frontend only via vite)
RUN npx vite build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (need tsx to run TypeScript directly)
RUN npm ci

# Copy source files and built frontend
COPY . .
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run TypeScript directly with tsx (reads process.env at runtime)
CMD ["npx", "tsx", "server.ts"]
