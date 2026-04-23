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

# Create public directory structure (audio files are generated at runtime)
RUN mkdir -p public/audio/tracks public/audio/soundscapes public/audio/music public/audio/interrupts public/audio/previews public/audio/temp

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE $PORT

# Start server
CMD ["node", "server/dist/index.js"]
