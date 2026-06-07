# Build context must be the repo root so we can reach apps/api/prisma.
# Coolify: Base Directory = /   Dockerfile Location = /apps/scraper/Dockerfile

FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY apps/scraper/package*.json ./
RUN NODE_ENV=development npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY apps/scraper/ .
# Copy the shared Prisma schema from the API package
COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./prisma.config.ts
RUN npm run prisma:generate
RUN npm run build

FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY apps/scraper/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3003
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN groupadd -r nodejs && useradd -r -g nodejs scraper

# Copy prod deps first, then install Playwright browsers — this layer is
# cached independently of app code so Chromium isn't re-downloaded on each deploy.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN node_modules/.bin/playwright install --with-deps chromium \
    && chmod -R o+rx /ms-playwright

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

USER scraper

EXPOSE 3003

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]
