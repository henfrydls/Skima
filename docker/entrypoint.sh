#!/bin/sh

cd /app/server

# Ensure DB schema is up to date
npx prisma db push --skip-generate 2>/dev/null

# Start server in the background
node src/index.js &
SERVER_PID=$!

# Wait for server to be ready
echo "Starting Skima..."
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://localhost:3001/api/config 2>/dev/null; then
    echo "  Server is up."
    break
  fi
  sleep 1
done

# Handle DB state based on DEMO_MODE
if [ "$DEMO_MODE" = "true" ]; then
  IS_SETUP=$(wget -q -O - http://localhost:3001/api/config 2>/dev/null | grep -o '"isSetup":true')
  if [ -z "$IS_SETUP" ]; then
    echo "  Seeding demo data..."
    wget -q -O /dev/null --post-data '' http://localhost:3001/api/seed-demo 2>/dev/null
    echo "  Demo data seeded."
  else
    echo "  Database already has data, skipping seed."
  fi
else
  IS_DEMO=$(wget -q -O - http://localhost:3001/api/config 2>/dev/null | grep -o '"isDemo":true')
  if [ -n "$IS_DEMO" ]; then
    echo "  Cleaning demo data for normal mode..."
    rm -f /app/data/skills.db
    npx prisma db push --skip-generate 2>/dev/null
    echo "  Database reset. Fresh setup ready."
  fi
fi

echo ""
echo "  Skima is ready!"
echo "  Open http://localhost:3000 in your browser"
echo ""

# Keep the container running
wait $SERVER_PID
