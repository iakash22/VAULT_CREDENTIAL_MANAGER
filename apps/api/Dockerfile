FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/crypto/package.json packages/crypto/package.json
RUN npm install --workspace=@vault/api --workspace=@vault/types --workspace=@vault/crypto --include-workspace-root

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/crypto ./packages/crypto
COPY apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/api/v1/health || exit 1
CMD ["npx", "tsx", "src/index.ts"]
