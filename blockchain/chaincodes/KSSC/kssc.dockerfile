FROM alpine:3.13 as base

# Add CA certificates and timezone data files
RUN apk add -U --no-cache ca-certificates tzdata

# Add unprivileged user
RUN adduser -s /bin/true -u 1000 -D -h /app app \
    && sed -i -r "/^(app|root)/!d" /etc/group /etc/passwd \
    && sed -i -r 's#^(.*):[^:]*$#\1:/sbin/nologin#' /etc/passwd

FROM node:14.18.1 AS chaincode_base

WORKDIR /chaincode

COPY package.json ./
COPY . ./

RUN npm install --production

CMD ["npm", "start"]
