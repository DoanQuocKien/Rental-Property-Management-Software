FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY .npmrc ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/rental.db

RUN mkdir -p /app/data /app/uploads

EXPOSE 5000

CMD ["npm", "start"]
