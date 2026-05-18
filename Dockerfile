# Copy to yieldagentx402-sdks/Dockerfile (repository root) for Glama "Deploy" + "Make Release".
# Glama builds from repo root by default; MCP code lives in mcp-server/.
FROM node:20-alpine AS builder
WORKDIR /app/mcp-server
COPY mcp-server/package*.json ./
RUN npm ci
COPY mcp-server/tsconfig.json ./
COPY mcp-server/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app/mcp-server
COPY mcp-server/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/mcp-server/dist ./dist
COPY mcp-server/server.json mcp-server/glama.json ./
ENV NODE_ENV=production
ENV YAX_ALLOW_PUBLIC_INTROSPECTION=1
CMD ["node", "dist/index.js"]
