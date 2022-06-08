FROM node:14.13.1 AS base
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
COPY . /usr/src/app

RUN npm install --production

EXPOSE 4120

CMD ["node", "app.js"]
