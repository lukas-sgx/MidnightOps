FROM node:18-alpine
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY src/public dist/public
COPY .env ./
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
