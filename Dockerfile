# ==========================================
# IMGIVO — YouTube Video & Audio Converter
# Production Dockerfile for Railway / Container Runtime
# Node.js 22+ with Python3, FFmpeg, yt-dlp[default] & yt-dlp-ejs
# ==========================================

FROM node:22-bookworm-slim

# Install system dependencies: FFmpeg, Python3, pip, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with [default] dependencies and yt-dlp-ejs plugin/package
RUN pip3 install --no-cache-dir --break-system-packages "yt-dlp[default]" yt-dlp-ejs

# Ensure Node binary is explicitly discoverable and symlinked
RUN ln -sf /usr/local/bin/node /usr/bin/node || true

# Ensure binaries and Node.js are readily discoverable in PATH
ENV PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
ENV YTDLP_JS_ENGINE="node"
ENV PYTHONUNBUFFERED="1"

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
