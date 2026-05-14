#!/bin/bash

BACKEND_PORT=3010; FRONTEND_PORT=5174; DB_NAME="lunar_ops_db"
echo "Starting LunarBase..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
sleep 1
set -a; [ -f .env ] && source .env; set +a
createdb $DB_NAME 2>/dev/null || true
psql -d $DB_NAME -f backend/db/schema.sql -q
psql -d $DB_NAME -f backend/db/seed.sql -q
(cd backend && npm install --silent)
(cd frontend && npm install --silent)
(cd backend && npx nodemon server.js) &
sleep 2; (cd frontend && npm run dev) &
echo "LunarBase running at http://localhost:$FRONTEND_PORT | admin@demo.com / demo123"
trap 'kill $(jobs -p) 2>/dev/null' EXIT; wait
