# 스몰토크 생성 프롬프트 수정 가이드

## 개요

스몰토크 생성에 사용되는 AI 프롬프트를 쉽게 수정할 수 있도록 별도 파일(`prompts.ts`)로 분리했습니다.

## 프롬프트 파일 위치

```
supabase/functions/generate-contact-smalltalk/prompts.ts
```

## 수정 가능한 항목

### 1. 시스템 프롬프트 (`SYSTEM_PROMPT`)

AI의 전반적인 역할과 톤앤매너를 정의합니다.

**수정 예시:**

```typescript
// 더 전문적인 톤으로 변경
export const SYSTEM_PROMPT = `You are a professional business consultant.
Suggest formal small talk topics suitable for executive-level relationships.
...`

// 더 친근한 톤으로 변경
export const SYSTEM_PROMPT = `You are a friendly sales representative.
Suggest casual and warm conversation starters that build rapport.
...`
```

### 2. 사용자 프롬프트 템플릿 (`USER_PROMPT_TEMPLATE`)

생성할 스몰토크의 구체적인 요구사항을 정의합니다.

**수정 예시:**

```typescript
// 더 많은 항목 생성
[
  ... (5-8 items)  // 기존: 3-5 items
]

// expire_days 범위 조정
- expire_days should be an integer between 7-30  // 기존: 5-14

// 특정 주제 제외
- Avoid topics about: politics, religion, personal health issues
```

### 3. 생성 설정 (`GENERATION_CONFIG`)

OpenAI 모델과 생성 파라미터를 조정합니다.

**수정 예시:**

```typescript
export const GENERATION_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.5,  // 더 일관적인 결과 (기존: 0.8)
  // 또는
  temperature: 1.0,  // 더 창의적인 결과
}
```

**Temperature 가이드:**
- `0.0 ~ 0.3`: 매우 일관적이고 예측 가능한 결과
- `0.4 ~ 0.7`: 균형잡힌 결과 (권장)
- `0.8 ~ 1.0`: 창의적이고 다양한 결과

### 4. 폴백 템플릿 (`FALLBACK_TEMPLATES`)

OpenAI 호출 실패 시 사용할 기본 템플릿입니다.

**수정 예시:**

```typescript
export const FALLBACK_TEMPLATES = (contactName: string, companyName: string) => [
  {
    topic: '새해 인사',
    content: `${contactName}님, 새해 복 많이 받으세요!`,
    expire_days: 7,
  },
  {
    topic: '분기 마무리',
    content: `${companyName}의 이번 분기 목표는 잘 달성되셨나요?`,
    expire_days: 10,
  },
  // 더 많은 템플릿 추가 가능
]
```

## 프롬프트 버전 관리

`PROMPT_VERSION`을 수정하면 어떤 프롬프트로 생성되었는지 추적할 수 있습니다.

```typescript
export const PROMPT_VERSION = 'v1.2'  // 수정 후 버전 업데이트
```

생성된 데이터의 `meta.prompt_version` 필드에서 확인 가능합니다.

## 수정 후 배포

1. **prompts.ts 수정**
   - 원하는 항목 수정

2. **로컬 테스트** (선택)
   - 수정 전 원본 백업 권장

3. **재배포**
   - Supabase Dashboard → Edge Functions
   - generate-contact-smalltalk 선택
   - **index.ts와 prompts.ts 모두 업로드 필요**
   - Deploy 클릭

4. **검증**
   - 새로 생성된 스몰토크 확인
   - DB에서 `meta.prompt_version` 확인

## 실전 예시

### 예시 1: 계절별 프롬프트

```typescript
// 현재 계절 감지
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

export const SYSTEM_PROMPT = `You are a sales relationship management expert.
${getCurrentSeason() === 'winter' 
  ? 'Focus on year-end greetings and holiday-related topics.' 
  : 'Focus on seasonal activities and current business trends.'
}
...`
```

### 예시 2: 산업별 맞춤 프롬프트

```typescript
export function buildUserPrompt(
  contact: any,
  recentCalls: any[],
  recentActions: any[]
): string {
  const industryHint = contact.company?.includes('IT') 
    ? '\nIndustry context: Focus on technology trends, digital transformation topics.'
    : ''
  
  return USER_PROMPT_TEMPLATE
    .replace('{contactInfo}', contactInfo + industryHint)
    // ...
}
```

### 예시 3: 특정 키워드 제외

```typescript
export const USER_PROMPT_TEMPLATE = `...

Requirements:
- Write in Korean language
- Avoid topics about: 정치, 종교, 건강 문제, 급여/연봉
- Focus on: 업무 협력, 업계 동향, 가벼운 일상
...`
```

## 트러블슈팅

### 프롬프트 변경이 반영되지 않음
- prompts.ts 파일도 함께 배포했는지 확인
- 브라우저 캐시 클리어
- 기존 캐시된 결과가 아닌 새로 생성된 것인지 확인

### OpenAI가 JSON 외 텍스트를 반환함
- SYSTEM_PROMPT에 "Return ONLY JSON" 강조
- temperature를 낮춤 (0.5 이하)
- USER_PROMPT에 "NO text other than JSON" 재강조

### 한국어 대신 영어로 생성됨
- 모든 프롬프트에 "Write in Korean" 명시
- 폴백 템플릿도 한국어로 작성

### 생성 품질이 낮음
- temperature 조정 (0.7 ~ 0.9 권장)
- 더 구체적인 예시 추가
- 고객 정보가 충분히 제공되는지 확인

## 모범 사례

1. **명확한 지시**: 모호한 표현보다 구체적인 요구사항
2. **예시 제공**: "다음과 같은 형식" 보다 실제 예시
3. **버전 관리**: 수정 시마다 PROMPT_VERSION 업데이트
4. **점진적 개선**: 한 번에 많이 바꾸지 말고 하나씩 테스트
5. **A/B 테스트**: 두 버전을 만들어 비교 (meta.prompt_version으로 추적)

---

**참고**: 프롬프트 엔지니어링은 반복적인 과정입니다. 여러 시도를 통해 최적의 결과를 찾으세요!
