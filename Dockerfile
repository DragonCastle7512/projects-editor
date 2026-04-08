# --- Base Layer ---
FROM node:20-alpine AS base
RUN npm install -g npm@latest
WORKDIR /app

# --- Server Builder ---
FROM base AS server-builder
WORKDIR /app/server
# 의존성 파일만 먼저 복사하여 캐시 극대화
COPY server/package*.json ./
RUN npm ci --silent

# 소스 복사 후 빌드
COPY server/ ./
RUN npm run build

# --- Client Builder ---
FROM base AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --silent

# 소스 복사 후 빌드
COPY client/ ./
RUN npm run build

# --- Final Production Image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드된 결과물만 복사
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# 프로덕션 전용 패키지 설치
RUN cd server && npm ci --only=production --silent

EXPOSE 3001
VOLUME /projects

# 실행 스크립트
WORKDIR /app/server
CMD ["node", "dist/index.js"]
