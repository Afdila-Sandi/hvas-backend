FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Port untuk Monitoring Service
EXPOSE 5002

CMD ["node", "index.js"]