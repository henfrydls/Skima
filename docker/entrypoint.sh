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

# Analytics injection (runtime only, never in source code)
#
# When running as an online demo, we inject a self-hosted Umami analytics
# script into the built HTML at container startup. This keeps the tracking
# code out of the repository — desktop and local Docker users never see it.
#
# Required env vars (set in docker-compose.demo.yml):
#   UMAMI_WEBSITE_ID  — UUID from Umami dashboard (e.g. "e1a101bc-...")
#   UMAMI_HOST        — Optional, defaults to https://analytics.henfrydls.com
#
# The script is privacy-first: no cookies, no cross-site tracking,
# respects Do Not Track. Used to measure landing-to-demo conversion.
if [ "$DEMO_MODE" = "true" ] && [ -n "$UMAMI_WEBSITE_ID" ]; then
  UMAMI_HOST="${UMAMI_HOST:-https://analytics.henfrydls.com}"
  sed -i "s|</head>|<script defer src=\"${UMAMI_HOST}/stats.js\" data-website-id=\"${UMAMI_WEBSITE_ID}\"></script></head>|" /app/client/dist/index.html
  echo "  Analytics script injected."
fi

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
