#!/bin/bash
# MongoDB Connection Verification Script
# Usage: Run this in the terminal to verify MongoDB connection

echo "=========================================="
echo "MongoDB Connection Verification"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this from the backend/ directory:"
    echo "  cd backend"
    exit 1
fi

echo "✅ Backend directory detected"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Create .env from .env.example:"
    echo "  cp .env.example .env"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check .env contents
echo "Checking .env configuration:"
echo "---"
grep "MONGODB_URI\|MONGODB_DB_NAME\|PORT" .env || echo "❌ Missing MongoDB configuration"
echo "---"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies ready"
echo ""

# Show what will happen on startup
echo "Ready to start backend with:"
echo ""
echo "  npm run dev"
echo ""
echo "Expected output:"
echo "  - Server running on port 8000"
echo "  - ✅ MongoDB Connected: cluster0.fw5twko.mongodb.net"
echo ""
echo "To verify the connection works:"
echo "  1. Start: npm run dev"
echo "  2. In another terminal: curl http://localhost:8000/api/health"
echo "  3. Should return: {\"status\":\"ok\"}"
echo ""
echo "=========================================="
