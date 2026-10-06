# Build stage: needs dev dependencies (vite, esbuild, typescript)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: production dependencies only
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY drizzle.config.ts ./
COPY shared ./shared
RUN mkdir -p uploads consent-records consent-documents

EXPOSE 5000
# The app reads PORT (defaults to 5000). Run `npm run db:push` once against
# the database before the first start.
CMD ["npm", "start"]
