#!/bin/sh

cd /app/server

# Start server in the background
node src/index.js &
SERVER_PID=$!

# Wait for server to be ready
echo "Starting Skima..."
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://localhost:3001/api/config 2>/dev/null; then
    echo ""
    echo "  Skima is ready!"
    echo "  Open http://localhost:3000 in your browser"
    echo ""
    break
  fi
  sleep 1
done

# Keep the container running
wait $SERVER_PID
