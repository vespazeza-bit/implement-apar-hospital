# ─── Backend (Express.js) ────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --production

COPY backend/server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
