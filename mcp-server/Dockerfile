FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.json glama.json ./
ENV NODE_ENV=production
# Glama Firecracker introspection: tools/list + yax_get_capabilities without secrets.
ENV YAX_ALLOW_PUBLIC_INTROSPECTION=1
EXPOSE 3000
CMD ["node", "dist/index.js"]
