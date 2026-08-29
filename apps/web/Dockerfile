FROM node:24-alpine

WORKDIR /app

COPY apps/web/.next/standalone ./
COPY apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
