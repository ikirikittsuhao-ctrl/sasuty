# ──────────────────────────────────────────────
# Stage 1: Install ALL workspace dependencies
# ──────────────────────────────────────────────
FROM node:24-slim AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-spec/package.json              lib/api-spec/
COPY lib/api-client-react/package.json      lib/api-client-react/
COPY lib/api-zod/package.json               lib/api-zod/
COPY lib/db/package.json                    lib/db/
COPY artifacts/api-server/package.json      artifacts/api-server/
COPY artifacts/sasuty/package.json          artifacts/sasuty/

# Install dependencies (skip lifecycle scripts that need secrets)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ──────────────────────────────────────────────
# Stage 2: Build frontend (Vite)
# ──────────────────────────────────────────────
FROM deps AS frontend-builder

WORKDIR /app

# Copy all source
COPY . .

# Build frontend — SUPABASE_* vars must be provided at build time
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV NODE_ENV=production
ENV BASE_PATH=/

RUN pnpm --filter @workspace/sasuty run build

# ──────────────────────────────────────────────
# Stage 3: Build backend (esbuild bundle)
# ──────────────────────────────────────────────
FROM deps AS backend-builder

WORKDIR /app

COPY . .

RUN pnpm --filter @workspace/api-server run build

# ──────────────────────────────────────────────
# Stage 4: Production image
# ──────────────────────────────────────────────
FROM node:24-slim AS runner

WORKDIR /app

# Only copy the built artefacts and the pnpm store for pg native
COPY --from=backend-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=frontend-builder /app/artifacts/sasuty/dist/public ./artifacts/sasuty/dist/public

# Copy node_modules needed at runtime (pg, drizzle, etc.)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib ./lib
COPY --from=deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
