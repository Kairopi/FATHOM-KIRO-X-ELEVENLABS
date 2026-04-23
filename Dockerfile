# Use Node 18 with build tools
FROM node:18-bullseye-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --include=dev
RUN cd client && npm ci --include=dev
RUN cd server && npm ci --include=dev

# Copy source code
COPY . .

# Build client
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "run", "start"]
