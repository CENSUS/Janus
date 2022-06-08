###########################
#####       Base     ######
###########################
FROM node:14.16 as built_app

# install electron dependencies
RUN apt-get update && apt-get install \
    git libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 \
    -yq --no-install-suggests --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package*.json /usr/src/app/

COPY . .
RUN chown -R node /usr/src/app/

USER node
RUN npm install
RUN npx electron-rebuild

USER root
RUN chown root /usr/src/app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /usr/src/app/node_modules/electron/dist/chrome-sandbox

USER node
CMD ["npm", "start"]

# ###########################
# #####      Nginx     ######
# ###########################

# FROM nginx:alpine
# COPY --from=built_app /usr/src/app/build /var/www
# RUN rm /etc/nginx/conf.d/default.conf
# COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# EXPOSE 4780 443
# CMD ["nginx", "-g", "daemon off;"]
