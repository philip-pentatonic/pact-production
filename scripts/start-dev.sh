#!/bin/bash

# PACT Development Start Script
# Starts both backend and frontend development servers

set -e

echo "=== Starting PACT Development Environment ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "wrangler dev" || true
pkill -f "vite" || true
sleep 1

# Function to open new terminal tab (macOS)
open_new_tab() {
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $1\""
}

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
open_new_tab "npm run dev"
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Test backend
echo "Testing backend API..."
max_attempts=10
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8787/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running at http://localhost:8787${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Waiting for backend... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${YELLOW}⚠ Backend may not be fully started yet${NC}"
fi

# Start frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
cd frontend
open_new_tab "npm run dev"
cd ..

echo ""
echo -e "${GREEN}=== Development servers starting ===${NC}"
echo ""
echo "Backend API: http://localhost:8787"
echo "Frontend:    http://localhost:3000"
echo ""
echo "Default credentials:"
echo "  Admin:     admin / admin123"
echo "  Demo User: demo / demo123"
echo ""
echo "To stop all servers, run: pkill -f 'wrangler dev' && pkill -f 'vite'"
echo ""