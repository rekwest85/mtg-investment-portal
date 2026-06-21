# ============================================================
# MTG Investment Portal — Dockerfile (multi-stage build)
# ============================================================

# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source & build
COPY tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Data directory (shared volume with scanner)
RUN mkdir -p /data

EXPOSE 3000

CMD ["npm", "start"]
