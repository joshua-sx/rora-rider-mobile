# Cloud Run container for Google Maps web-service proxy.
# Uses Node 20 (has built-in fetch).

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./

ENV NODE_ENV=production
ENV PORT=8080

RUN chown -R node:node /app
USER node

EXPOSE 8080

CMD ["npm", "start"]

