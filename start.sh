#!/bin/bash

# THROWN — Quick Start Script
# Starts both client (Vite) and server (Express) simultaneously

set -e

PROJECT_DIR="/mnt/G/Development/Thrown"

echo "🎮 THROWN — Starting development servers..."
echo ""

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if node_modules exist, install if not
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "   Press Ctrl+C to stop all servers."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start both client and server
npm run dev
