# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --production && \
    cd client && npm install && \
    cd ../server && npm install

# Copy source code
COPY client ./client
COPY server ./server

# Create public directory structure and copy if exists
RUN mkdir -p public/audio/tracks public/audio/temp public/audio/music public/audio/soundscapes public/audio/interrupts public/audio/previews
COPY public ./public 2>/dev/null || true

# Build client and server
RUN cd client && npm run build && \
    cd ../server && npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/

# Create public directory structure and copy static assets
RUN mkdir -p public/audio/tracks public/audio/temp
COPY --from=builder /app/public ./public

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE $PORT

# Start server
CMD ["node", "server/dist/index.js"]
