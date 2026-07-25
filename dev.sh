#!/bin/bash

# Ensure we're running from the root of the project
cd "$(dirname "$0")"

# Function to handle cleanup when the script is stopped
cleanup() {
    echo ""
    echo "🛑 Stopping built-in servers (Backend & Frontend)..."
    kill 0
}

# Catch the SIGINT (Ctrl+C) and SIGTERM signals
trap cleanup SIGINT SIGTERM

echo "🚀 Starting backend (Deno) in background..."
(cd backend && deno task dev) &

echo "🚀 Starting frontend (Angular) in background..."
(cd frontend && npm start) &

echo "✅ Both servers are running in watch mode!"
echo "Press Ctrl+C to terminate both servers."

# Wait for background processes to finish
wait
