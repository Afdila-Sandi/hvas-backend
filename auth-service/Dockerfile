FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Port untuk Auth Service
EXPOSE 5000

CMD ["node", "index.js"]