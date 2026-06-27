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
RUN npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Same — needed for `prisma generate` to find a matching engine binary.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build
# Compile seed script so it can be run with plain `node` in the runner stage
RUN node_modules/.bin/tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --resolveJsonModule --module commonjs --target es2020 --skipLibCheck 2>/dev/null || true

FROM deps AS prod-deps
RUN npm prune --omit=dev --no-audit --no-fund

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
# Copy compiled seed (if it built successfully)
COPY --from=builder /app/dist/prisma ./dist/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=prod-deps /app/node_modules ./node_modules
# prisma generate writes the query-engine binary into .prisma/client inside the
# builder's node_modules. prod-deps never runs generate, so we copy it across.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
