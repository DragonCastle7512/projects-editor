FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install
RUN cd server && npm install
RUN cd client && npm install

COPY . .
RUN cd server && npm run build
RUN cd client && npm run build

FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/package.json ./server/package.json

RUN cd server && npm install --only=production

ENV PORT=3001
ENV NODE_ENV=production
ENV WORKSPACE_ROOT=/projects

EXPOSE 3001

VOLUME /projects

CMD ["npm", "start"]
