FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages packages/
COPY apps apps/
COPY tsconfig.json .

RUN npm ci
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist /app/dist
COPY --from=builder /app/packages/prisma /app/prisma

EXPOSE 3001

CMD ["node", "dist/main.js"]
