FROM node:22-bookworm-slim AS frontend-dependencies
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM frontend-dependencies AS frontend-build
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend-dependencies
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3010
WORKDIR /app
COPY --from=backend-dependencies /build/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY --from=frontend-build /build/frontend/dist ./frontend/dist
COPY start.sh ./start.sh
RUN chown -R node:node /app
USER node
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3010/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["./start.sh"]
