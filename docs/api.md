# API 문서

## OCR API

명함 이미지를 처리하여 정보를 추출하고 저장하는 API입니다.

### POST /api/ocr

**요청**

```json
{
  "imagePath": "string" // 이미지 파일의 경로 또는 URL
}
```

**응답**

```json
{
  "id": "uuid",
  "image_path": "string",
  "extracted_info": {
    "name": "string",
    "title": "string",
    "company": "string",
    "email": "string",
    "phone": "string",
    "address": "string"
  },
  "summary": "string",
  "sentiment_score": "number",
  "created_at": "string",
  "updated_at": "string"
}
```

## STT API

통화 녹음을 처리하여 텍스트로 변환하고 요약하는 API입니다.

### POST /api/transcribe

**요청**

```json
{
  "recordingPath": "string", // 오디오 파일의 경로 또는 URL
  "contactId": "uuid" // 연락처 ID
}
```

**응답**

```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "recording_path": "string",
  "transcript": "string",
  "summary": "string",
  "duration": "string",
  "call_date": "string",
  "call_time": "string",
  "notes": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

## 오류 응답

모든 API는 오류 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "error": "string" // 오류 메시지
}
```

## 인증

모든 API 요청에는 Authorization 헤더가 필요합니다:

```
Authorization: Bearer your-api-key
```

## 환경 변수

API 서버를 실행하기 위해 다음 환경 변수가 필요합니다:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_service_account_key.json
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
PORT=3000 // optional
```