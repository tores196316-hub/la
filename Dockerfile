# ==========================================
# IMGIVO — YouTube Video & Audio Converter
# Production Dockerfile for Railway / Container Runtime
# ==========================================

FROM node:20-bookworm-slim

# Install system dependencies: FFmpeg, Python3, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy project files
COPY . .

# Build Vite frontend
RUN npm run build

# Create temporary directories with permissions
RUN mkdir -p tmp/downloads && chmod -R 777 tmp

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose server port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
