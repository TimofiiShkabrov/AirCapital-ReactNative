# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=1 EXPO_NO_TELEMETRY=1

# Keep the dependency layer cached between source changes. The lockfile uses
# a local package, which must exist before npm ci runs.
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci --no-audit --no-fund
COPY . .

# Railway passes service variables as build args. Expo embeds these PUBLIC
# values in the exported JavaScript, so never pass API keys or other secrets.
ARG EXPO_PUBLIC_SITE_URL=https://aircapital.app
ARG EXPO_PUBLIC_APP_STORE_URL
ARG EXPO_PUBLIC_GOOGLE_PLAY_URL
ARG EXPO_PUBLIC_IOS_RELEASED=false
ARG EXPO_PUBLIC_ANDROID_RELEASED=false
ARG EXPO_PUBLIC_CONTACT_EMAIL
ARG EXPO_PUBLIC_TELEGRAM_URL
ENV NODE_ENV=production
RUN npx expo export --platform web --output-dir dist --max-workers 2

FROM nginx:stable-alpine AS runtime
# Railway can override PORT. For the domain's current target port, set PORT=80.
ENV PORT=80 NGINX_ENVSUBST_FILTER=^PORT$
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1
CMD ["nginx", "-g", "daemon off;"]
