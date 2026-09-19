FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/crypto/package.json packages/crypto/package.json
COPY packages/types/package.json packages/types/package.json
RUN npm install --workspace=@vault/web --workspace=@vault/crypto --workspace=@vault/types --include-workspace-root
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
