FROM oven/bun:1.4-slim AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
# Template — API_URL substituted at container start via envsubst
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# nginx:alpine includes envsubst; the official image processes /etc/nginx/templates/ automatically
CMD ["nginx", "-g", "daemon off;"]
