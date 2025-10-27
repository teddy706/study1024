# 스몰토크 생성 출처 배지 가이드

## 개요
스몰토크 아이템이 OpenAI로 생성되었는지, 폴백 템플릿으로 생성되었는지 시각적으로 구분할 수 있도록 배지를 추가했습니다.

## 적용 단계

### 1. DB 스키마 업데이트
**파일**: `sql/05_add_smalltalk_meta.sql`

Supabase SQL Editor에서 실행:
```sql
ALTER TABLE public.smalltalk_cache
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
```

### 2. Edge Function 재배포
**파일**: `supabase/functions/generate-contact-smalltalk/index.ts`

변경 사항:
- `traceId` 생성 (요청별 고유 ID)
- `usedFallback` 플래그로 OpenAI/폴백 구분
- 각 smalltalk 레코드에 `meta` 필드 추가:
  ```json
  {
    "function": "generate-contact-smalltalk",
    "function_version": "2025-10-27",
    "prompt_version": "v1",
    "model": "gpt-4o-mini",
    "source": "openai",
    "trace_id": "uuid"
  }
  ```
- 응답에 `source`와 `traceId` 포함

재배포 방법:
1. Supabase Dashboard → Edge Functions
2. `generate-contact-smalltalk` 선택
3. 업데이트된 코드 붙여넣기
4. Deploy 버튼 클릭
5. OPENAI_API_KEY 시크릿 확인

### 3. 프론트엔드 타입 및 UI 업데이트

**타입 정의** (`src/types/supabase.ts`):
```typescript
smalltalk_cache: {
  Row: {
    // ... 기존 필드
    meta?: Json
  }
}
```

**UI 컴포넌트** (`src/components/contact/SmalltalkPanel.tsx`):
- `getSourceLabel()` 함수 추가:
  - `meta.source === 'openai'` → 초록 배지 "AI"
  - `meta.source === 'fallback'` → 회색 배지 "Template"
- 각 스몰토크 카드에 출처 배지 표시

## 배지 스타일

| 출처 | 배지 텍스트 | 색상 |
|------|------------|------|
| OpenAI | AI | 초록 (bg-green-100 text-green-700) |
| 폴백 템플릿 | Template | 회색 (bg-gray-100 text-gray-600) |
| 미상 (기존 데이터) | (없음) | - |

## 검증 방법

### 네트워크 응답 확인
DevTools → Network → `generate-contact-smalltalk` 응답:
```json
{
  "success": true,
  "count": 3,
  "source": "openai",
  "traceId": "..."
}
```

### DB 직접 조회
```sql
SELECT
  id, topic, content,
  meta->>'source' AS source,
  meta->>'model' AS model,
  meta->>'trace_id' AS trace_id
FROM public.smalltalk_cache
WHERE contact_id = '<contact-id>'
ORDER BY created_at DESC;
```

### UI 확인
ContactDetail 페이지에서 각 스몰토크 항목에 배지가 표시되는지 확인:
- OpenAI 생성: 초록 "AI" 배지
- 폴백 생성: 회색 "Template" 배지
- 기존 데이터: 배지 없음

## 기존 데이터 처리

기존에 생성된 스몰토크는 `meta` 필드가 없으므로 배지가 표시되지 않습니다.

**구분 방법**:
1. 정확한 구분이 필요한 경우 → 재생성
2. 추정: topic/content 패턴으로 폴백 여부 짐작
   - "안부 인사", "업무 근황", "연말 인사" → 폴백 가능성 높음

**일괄 재생성** (선택):
```sql
-- 기존 smalltalk 삭제 (선택적)
DELETE FROM public.smalltalk_cache WHERE meta IS NULL;

-- 또는 특정 contact만
DELETE FROM public.smalltalk_cache 
WHERE contact_id = '<contact-id>' AND meta IS NULL;
```

그 후 앱에서 "AI 스몰토크 생성" 버튼 클릭하여 새로 생성.

## 트러블슈팅

### 배지가 표시되지 않음
- SQL 실행 확인 (`meta` 컬럼 존재 여부)
- Edge Function 재배포 확인
- 브라우저 캐시 클리어 및 새로고침
- 새로 생성한 스몰토크인지 확인 (기존 데이터는 meta 없음)

### "AI" 대신 "Template"으로 표시됨
- OpenAI API 호출 실패 (Key 확인, 요금/한도 확인)
- Edge Function 로그 확인 (Supabase Dashboard → Functions → Logs)

### 모든 항목에 배지 없음
- 모두 기존 데이터인 경우
- 재생성하거나 새 contact에서 테스트

---
**업데이트**: 2025-10-27  
**버전**: v1
