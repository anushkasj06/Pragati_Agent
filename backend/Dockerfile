FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p logs

EXPOSE 3001

CMD ["npm", "start"]
