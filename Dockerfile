FROM node:12

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
