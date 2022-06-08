FROM node:14.13.1
ENV NODE_ENV=production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . /usr/src/app

EXPOSE 5400

CMD ["node", "run.js"]
