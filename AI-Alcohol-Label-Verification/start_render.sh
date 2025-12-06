#!/bin/bash
# Startup script for Render deployment
# Starts both Python OCR server and Node.js backend

set -e  # Exit on error

echo "🚀 Starting Alcohol Label Verification App on Render..."

# Activate Python virtual environment
echo "📦 Activating Python virtual environment..."
source venv/bin/activate

# Start Python OCR server in the background
echo "🐍 Starting Python OCR server on port 5001..."
HOST=0.0.0.0 python server/ocr_server.py &
OCR_PID=$!
echo "✓ Python OCR server started with PID: $OCR_PID"

# Wait for OCR server to be ready
echo "⏳ Waiting for OCR server to be ready..."
sleep 5

# Check if OCR server is running
if ! kill -0 $OCR_PID 2>/dev/null; then
    echo "❌ ERROR: Python OCR server failed to start"
    exit 1
fi

# Test OCR server health
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✓ OCR server health check passed"
else
    echo "⚠️  WARNING: OCR server health check failed, but continuing..."
fi

# Start Node.js production server
echo "🟢 Starting Node.js production server on port $PORT..."
NODE_ENV=production node dist/index.js

# If Node.js exits, kill the Python server
echo "🛑 Shutting down..."
kill $OCR_PID 2>/dev/null || true
