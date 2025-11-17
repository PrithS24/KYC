# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Ensure PDF output directory exists
RUN mkdir -p pdfs

EXPOSE 5000
CMD ["node", "src/server.js"]
