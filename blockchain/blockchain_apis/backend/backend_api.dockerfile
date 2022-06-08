FROM node:14.13.1
ENV NODE_ENV=production

RUN mkdir -p /usr/src/app && mkdir /usr/src/app/react
WORKDIR /usr/src/app

COPY . /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

# Create React Build folder
COPY ["react/package.json", "react/package-lock.json*", "./react/"]
WORKDIR /usr/src/app/react

RUN npm install --production
RUN npm run build

WORKDIR /usr/src/app

EXPOSE 4220

CMD ["node", "app.js"]
