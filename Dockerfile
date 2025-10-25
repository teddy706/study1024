# Node 베이스 이미지 사용
FROM node:18-alpine as builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production

# 환경 변수 설정
ENV NODE_ENV=production

# 보안 설정
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 포트 설정
EXPOSE 3000

# 서버 시작
CMD ["npm", "start"]