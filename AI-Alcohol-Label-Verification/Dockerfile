FROM node:22-slim

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY requirements.txt ./

# Install pnpm
RUN npm install -g pnpm

# Install Node.js dependencies
RUN pnpm install

# Install Python dependencies
RUN python3 -m venv venv
RUN . venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Build frontend
RUN pnpm build

# Make startup script executable
RUN chmod +x start_render.sh

# Expose port (Render will set PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/ || exit 1

# Start both services
CMD ["./start_render.sh"]
