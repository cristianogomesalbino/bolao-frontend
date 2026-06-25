# Estágio 1: build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY next.config.ts tsconfig.json postcss.config.mjs components.json ./
RUN npm run build

# Estágio 2: produção
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Rodar como usuário não-root
USER node

EXPOSE 3003

CMD ["npm", "run", "start", "--", "-p", "3003"]
