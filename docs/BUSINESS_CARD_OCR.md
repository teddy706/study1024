# 명함 OCR 기능 설정 가이드

## 개요

Google Cloud Vision AI를 사용하여 명함 사진에서 자동으로 연락처 정보를 추출하는 기능입니다.

## 기능

- 📸 명함 사진 업로드
- 🤖 Google Vision AI로 텍스트 자동 추출
- 📝 이름, 회사명, 직책, 전화번호, 이메일, 주소 자동 파싱
- 💾 contacts 테이블에 자동 저장
- 🔄 즉시 연락처 목록 새로고침

## 설정 방법

### 1. Google Cloud Vision API 설정

#### 1.1 Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > 라이브러리** 메뉴로 이동
4. "Cloud Vision API" 검색 후 **사용 설정** 클릭

#### 1.2 API 키 생성

1. **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동
2. **+ 사용자 인증 정보 만들기 > API 키** 선택
3. 생성된 API 키 복사
4. (선택) **키 제한** 설정:
   - 애플리케이션 제한: HTTP 리퍼러 또는 IP 주소
   - API 제한: Cloud Vision API만 허용

### 2. Supabase Edge Function에 Secret 등록

```bash
# Supabase CLI로 Secret 설정
supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here

# 또는 Supabase Dashboard에서:
# Settings > Edge Functions > Secrets
# Name: GOOGLE_CLOUD_VISION_API_KEY
# Value: your_api_key_here
```

### 3. Edge Function 배포

```bash
# process-business-card Edge Function 배포
supabase functions deploy process-business-card
```

### 4. 테스트

1. 애플리케이션 실행: `npm run dev`
2. **전체 고객** 페이지로 이동
3. "📇 명함 스캔으로 연락처 추가" 카드에서 명함 사진 업로드
4. 자동으로 연락처가 생성되고 목록에 추가됨

## 파일 구조

```
study1024/
├── supabase/functions/
│   └── process-business-card/
│       └── index.ts              # Edge Function (OCR 처리)
├── src/
│   ├── components/contact/
│   │   └── BusinessCardUpload.tsx  # 명함 업로드 UI 컴포넌트
│   ├── pages/
│   │   └── Contacts.tsx          # 연락처 페이지 (업로드 컴포넌트 포함)
│   └── services/ocr/
│       └── vision-ai.service.ts  # OCR 서비스 (참고용, 실제는 Edge Function 사용)
```

## Edge Function 동작 원리

### process-business-card/index.ts

1. **이미지 수신**: 클라이언트로부터 base64 인코딩된 이미지 수신
2. **Vision API 호출**: Google Cloud Vision API TEXT_DETECTION 기능 사용
3. **텍스트 파싱**: 
   - 이름: 첫 번째 줄 (일반적으로)
   - 회사명: "주식회사", "Co.", "Ltd." 등 키워드 포함 라인
   - 직책: "대표", "이사", "부장", "CEO" 등 키워드 포함 라인
   - 전화번호: 정규식으로 한국 전화번호 패턴 추출
   - 이메일: 정규식으로 이메일 패턴 추출
   - 주소: 지역명 키워드 포함 라인
4. **DB 저장**: 추출된 정보를 contacts 테이블에 insert
5. **응답**: 생성된 연락처 정보 반환

## 파싱 규칙 커스터마이징

명함 형식에 맞게 파싱 로직을 수정하려면 `process-business-card/index.ts`의 `parseBusinessCard` 함수를 수정하세요:

```typescript
// 회사명 키워드 추가
const companyKeywords = ['주식회사', '(주)', 'Co.', 'Ltd.', 'Inc.', 'Corp.']

// 직책 키워드 추가
const positionKeywords = ['대표', '이사', '부장', 'CEO', 'CTO', 'Manager']

// 전화번호 정규식 수정
const phoneRegex = /(\+?82[-\s]?)?0?1[0-9][-\s]?\d{3,4}[-\s]?\d{4}/
```

## 비용 안내

Google Cloud Vision API는 사용량 기반 과금입니다:

- **TEXT_DETECTION**: 처음 1,000건/월 무료, 이후 $1.50/1,000건
- 자세한 내용: [Vision API 가격 책정](https://cloud.google.com/vision/pricing)

## 문제 해결

### API 키 오류
```
Error: Google Cloud Vision API key not configured
```
→ Supabase Secrets에 `GOOGLE_CLOUD_VISION_API_KEY` 등록 확인

### 텍스트 인식 실패
```
Error: No text detected in image
```
→ 명함 사진 품질 확인 (밝기, 선명도, 해상도)

### 인식은 되지만 파싱 결과가 부정확한 경우
→ `parseBusinessCard` 함수의 키워드 및 정규식 조정

## 추가 개선 사항

1. **AI 파싱 강화**: OpenAI GPT를 활용한 지능형 파싱
2. **수동 편집**: 파싱 후 사용자가 결과를 수정할 수 있는 UI
3. **다국어 지원**: 영문 명함 인식 개선
4. **배치 처리**: 여러 장의 명함을 한 번에 업로드
5. **이미지 저장**: 원본 명함 이미지를 Supabase Storage에 저장

## 참고 자료

- [Google Cloud Vision API 문서](https://cloud.google.com/vision/docs)
- [Supabase Edge Functions 가이드](https://supabase.com/docs/guides/functions)
- [OCR 정확도 향상 팁](https://cloud.google.com/vision/docs/ocr)
