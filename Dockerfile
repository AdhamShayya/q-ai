# ── Stage 1: Install all dependencies ─────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY src/package.json ./src/
COPY www/package.json ./www/
RUN bun install --frozen-lockfile --trust-all-scripts

# ── Stage 2: Build frontend (Vite) ────────────────────────────────────────────
FROM oven/bun:1 AS frontend-builder
WORKDIR /app
COPY package.json bun.lockb ./
COPY src/package.json ./src/
COPY www/package.json ./www/
COPY www/ ./www/
COPY src/ ./src/
RUN bun install --frozen-lockfile --trust-all-scripts
# Bun hoists sass to /app/node_modules; Vite 6 resolves it directly from /app/www/node_modules.
# Hard-copy (not symlink) so no symlink-resolution issues inside the container.
RUN rm -rf /app/www/node_modules/sass && mkdir -p /app/www/node_modules && cp -r /app/node_modules/sass /app/www/node_modules/sass
RUN bun run --cwd www build

# ── Stage 3: Build backend (TypeScript → JS) ──────────────────────────────────
FROM deps AS backend-builder
COPY src/ ./src/
RUN bun run --cwd src build

# ── Stage 4: Production image ──────────────────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

# Install production dependencies only
COPY package.json bun.lockb ./
COPY src/package.json ./src/
COPY www/package.json ./www/
RUN bun install --production

# Compiled backend JS  →  /app/dist/
COPY --from=backend-builder /app/src/dist ./dist

# Built frontend static files  →  /app/public/
COPY --from=frontend-builder /app/www/dist ./public

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/main.js"]
