# Use an official Node.js runtime as a parent image

FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
COPY . . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
