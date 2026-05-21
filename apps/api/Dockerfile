FROM node:24-bookworm-slim AS deps
WORKDIR /app

# OpenSSL is required by Prisma's query engine. The bookworm-slim base image
# ships without it, which causes prisma:warn at migrate time and an outright
# failure at `prisma generate` during the build. Install it explicitly.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install ALL dependencies (including devDeps) regardless of NODE_ENV.
# Build tools like @nestjs/cli are devDeps and must be present in the builder stage.
COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Same — needed for `prisma generate` to find a matching engine binary.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app

# Needed for Prisma's query engine binary.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS runner
WORKDIR /app

# Prisma loads the engine binary at boot.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3002

RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=prod-deps /app/node_modules ./node_modules

USER nestjs

EXPOSE 3002

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && npm run start:prod"]
