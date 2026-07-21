#!/bin/sh
set -eu

if [ "${NODE_ENV:-development}" != "production" ]; then
  if [ "${CORS_ALLOWED_ORIGINS:-}" = "" ]; then
    export CORS_ALLOWED_ORIGINS="http://127.0.0.1:${FRONTEND_PORT:-5174}"
  fi
  if [ "${CERTIFICATE_ALLOWED_HOSTS:-}" = "" ]; then
    export CERTIFICATE_ALLOWED_HOSTS="certificates.example.test"
  fi
fi

exec node backend/server.js
