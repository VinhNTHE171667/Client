FROM node:20-alpine

WORKDIR /app

# Copy package files & cài dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy dist đã build trên host + .env
COPY dist ./dist
COPY .env ./

EXPOSE 8080

CMD ["node", "dist/main.js"]
