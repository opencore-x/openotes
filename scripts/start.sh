#!/bin/bash

# openotes MCP Server - Start Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Load environment variables
if [[ -f .env ]]; then
    set -a
    source .env
    set +a
fi

# Default port
PORT=${PORT:-3000}

echo "=== Starting openotes MCP Server ==="
echo ""
echo "Port: $PORT"
echo "Vault: $VAULT_PATH"
echo ""

# Check if already running
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Error: Port $PORT is already in use."
    echo "Kill existing process with: lsof -ti:$PORT | xargs kill"
    exit 1
fi

# Start server
if [[ "$1" == "--dev" ]]; then
    echo "Starting in development mode..."
    npm run dev
else
    echo "Starting in production mode..."
    npm start
fi
