FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/rental.db

RUN mkdir -p /app/data /app/uploads

EXPOSE 5000

CMD ["npm", "start"]
