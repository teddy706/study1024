# OCR to Summary Workflow

## 개요

이 n8n 워크플로우는 다음 단계를 자동화합니다:
1. 명함 이미지 OCR 처리
2. GPT를 사용한 텍스트 요약
3. 감성 분석
4. Supabase 데이터베이스 저장
5. Slack 알림 전송

## 워크플로우 구성

### 1. Webhook Trigger
- 엔드포인트: `/process-document`
- 메서드: POST
- 필요한 페이로드:
  ```json
  {
    "userId": "user-uuid",
    "imagePath": "path/in/supabase/storage",
    "visionEndpoint": "vision-api-endpoint",
    "notificationChannel": "slack-channel-id"
  }
  ```

### 2. Google Vision OCR
- OCR 모델: vision-latest
- 언어: 한국어 (ko)
- 출력: 추출된 텍스트 및 구조화된 정보

### 3. GPT Summary
- 모델: GPT-4
- 온도: 0.3 (일관된 출력을 위해)
- 최대 토큰: 200
- 프롬프트: 비즈니스 맥락에서 중요 정보 요약

### 4. Sentiment Analysis
- Google Natural Language API 사용
- 언어: 한국어 (ko)
- 출력: 감성 점수 (-1.0 ~ 1.0)

### 5. Supabase Insert
- 테이블: business_cards
- 저장 정보:
  - OCR 원본 텍스트
  - GPT 요약
  - 감성 점수
  - 메타데이터

### 6. Slack Notification
- 처리 완료 알림
- 요약 내용 및 감성 점수 포함

## 환경 설정

1. 필요한 자격 증명:
   - Google Cloud (Vision + Natural Language API)
   - OpenAI API
   - Supabase 데이터베이스
   - Slack Bot Token

2. 환경 변수:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
   OPENAI_API_KEY=your-openai-key
   SUPABASE_CONNECTION=postgresql://...
   SLACK_BOT_TOKEN=xoxb-...
   ```

## 사용 예시

```bash
curl -X POST http://your-n8n-host/webhook/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "imagePath": "business-cards/card1.jpg",
    "visionEndpoint": "https://vision.googleapis.com/v1/images:annotate",
    "notificationChannel": "C12345678"
  }'
```

## 에러 처리

워크플로우는 다음 상황에서 자동으로 재시도합니다:
- OCR API 일시적 오류
- GPT API 할당량 초과
- 네트워크 지연

최대 3번 재시도 후에도 실패하면 에러 상태로 기록되며 Slack으로 알림이 전송됩니다.