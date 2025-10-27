# 명함 OCR 배포 검증 체크리스트

## ✅ 검증 결과

### 1. Edge Function 배포 상태
- ✅ **CORS Preflight 응답**: 200 OK
- ✅ **Function Endpoint**: `https://jvadwfxkkhcmndluxyzk.supabase.co/functions/v1/process-business-card`
- ✅ **배포 완료**: Edge Function이 정상적으로 배포되었습니다.

### 2. 다음 확인 사항

#### A. Supabase Dashboard 확인
1. **Edge Functions 페이지 접속**
   - URL: https://supabase.com/dashboard/project/jvadwfxkkhcmndluxyzk/functions
   - `process-business-card` 함수가 목록에 표시되는지 확인

2. **Secrets 설정 확인**
   - Settings > Edge Functions > Secrets
   - `GOOGLE_CLOUD_VISION_API_KEY`가 등록되어 있는지 확인
   - ⚠️ 만약 없다면:
     ```bash
     # Supabase CLI 설치 필요
     supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=your_actual_api_key_here
     ```

3. **Function Logs 확인**
   - Edge Functions > process-business-card > Logs
   - 실시간 로그를 통해 실행 상태 모니터링 가능

#### B. Google Cloud Console 확인
1. **Vision API 활성화 확인**
   - https://console.cloud.google.com/apis/library/vision.googleapis.com
   - "API가 사용 설정됨" 상태 확인

2. **API 키 권한 확인**
   - https://console.cloud.google.com/apis/credentials
   - 생성한 API 키의 제한사항 확인:
     - API 제한: Cloud Vision API 포함되어 있어야 함
     - 애플리케이션 제한: 없음 또는 적절한 제한 설정

#### C. 브라우저 테스트 (최종 검증)

**테스트 절차:**

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **애플리케이션 접속**
   - http://localhost:5173/study1024/
   - 로그인

3. **전체 고객 페이지 이동**
   - 좌측 메뉴 또는 대시보드에서 "전체 고객" 클릭

4. **명함 업로드**
   - "📇 명함 스캔으로 연락처 추가" 카드 확인
   - 명함 사진 선택 (PNG, JPG, JPEG)
   - 처리 중... 로딩 표시 확인

5. **결과 확인**
   - ✅ 성공 시: "명함이 성공적으로 등록되었습니다!" 알림
   - ✅ 연락처 목록에 새로운 연락처 추가됨
   - ❌ 실패 시: 에러 메시지 표시

6. **개발자 도구 확인 (F12)**
   - Console 탭: 에러 메시지 확인
   - Network 탭: 
     - `process-business-card` 요청 상태 확인
     - Response 내용 확인

**예상되는 응답 (성공):**
```json
{
  "success": true,
  "contact": {
    "id": "...",
    "name": "홍길동",
    "company": "주식회사 테크컴퍼니",
    "position": "대표이사",
    "phone": "010-1234-5678",
    "email": "hong@techcompany.com",
    "address": "서울시 강남구..."
  },
  "extractedText": "원본 추출 텍스트..."
}
```

**예상되는 에러 (실패 케이스):**

```json
// API 키 미설정
{
  "success": false,
  "error": "Google Cloud Vision API key not configured"
}

// 텍스트 인식 실패
{
  "success": false,
  "error": "No text detected in image"
}

// 인증 실패
{
  "success": false,
  "error": "Missing authorization header"
}
```

## 🔍 트러블슈팅 가이드

### 문제 1: "Google Cloud Vision API key not configured"
**원인**: Supabase Secrets에 API 키가 등록되지 않음

**해결 방법**:
1. Google Cloud Console에서 API 키 복사
2. Supabase Dashboard > Settings > Edge Functions > Secrets
3. Name: `GOOGLE_CLOUD_VISION_API_KEY`
4. Value: 복사한 API 키 붙여넣기
5. Save

### 문제 2: "Vision API error: 403" 또는 "PERMISSION_DENIED"
**원인**: 
- Google Cloud Vision API가 활성화되지 않음
- API 키에 Vision API 권한이 없음
- 결제 정보가 등록되지 않음

**해결 방법**:
1. Google Cloud Console > APIs & Services > Library
2. "Cloud Vision API" 검색
3. "사용 설정" 클릭
4. 프로젝트 결제 정보 확인

### 문제 3: "No text detected in image"
**원인**: 이미지에서 텍스트를 인식하지 못함

**해결 방법**:
- 밝은 조명에서 명함 재촬영
- 명함 전체가 화면에 들어오도록 촬영
- 초점이 맞고 선명한 이미지 사용
- 이미지 해상도 확인 (최소 800x600 권장)

### 문제 4: 파싱 결과가 부정확함
**원인**: 명함 레이아웃이 일반적이지 않거나 특수한 형식

**해결 방법**:
- `supabase/functions/process-business-card/index.ts`의 `parseBusinessCard` 함수 커스터마이징
- 회사명/직책 키워드 추가
- 정규식 패턴 조정

## 📊 모니터링

### Supabase Dashboard에서 확인할 지표:

1. **Function Invocations**: Edge Function 호출 횟수
2. **Execution Time**: 평균 실행 시간 (Vision API 호출 포함)
3. **Error Rate**: 에러 발생률
4. **Logs**: 실시간 실행 로그 및 에러 메시지

### 예상 성능:
- **평균 처리 시간**: 2-5초 (이미지 크기 및 네트워크 상태에 따라)
- **성공률**: 90%+ (선명한 명함 이미지 기준)
- **비용**: Vision API - 월 1,000건 무료, 이후 $1.50/1,000건

## ✨ 다음 단계

배포가 완료되면:

1. ✅ 실제 명함으로 테스트
2. ✅ 파싱 정확도 확인 및 개선
3. ✅ 에러 처리 강화
4. 🔄 수동 편집 UI 추가 (선택)
5. 🔄 배치 업로드 기능 (선택)
6. 🔄 이미지 저장 기능 (선택)

---

**현재 상태**: ✅ Edge Function 배포 완료
**다음 액션**: Supabase Dashboard에서 GOOGLE_CLOUD_VISION_API_KEY 등록 확인
