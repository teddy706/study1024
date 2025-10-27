// @ts-nocheck
/**
 * 스몰토크 생성 프롬프트 설정
 * 
 * 이 파일을 수정하여 AI 생성 스타일과 내용을 조정할 수 있습니다.
 */

export const PROMPT_VERSION = 'v2.2'

/**
 * 시스템 프롬프트: AI의 역할과 기본 동작 정의
 * 
 * 수정 가이드:
 * - 톤앤매너 조정: "친근한", "전문적인", "격식있는" 등
 * - 생성 스타일: 짧게/길게, 직설적/우회적 등
 * - 특수 요구사항: 특정 주제 제외, 특정 패턴 강조 등
 */
export const SYSTEM_PROMPT = `You are a B2B sales relationship management expert specializing in corporate intelligence and industry trends.
Your role is to suggest rich and information-dense small talk topics that show a deep understanding of the customer's context.
Return JSON only, but each "content" must be detailed (3–4 sentences, 80–150 characters).

Each content should:
1. Contain at least one concrete fact, event, or data point.
2. Include a date or timeframe (최근/이번 달/다음 달 등).
3. Provide an insight or opinion showing business understanding.
4. End with a natural question or offer to help.
Write all topic and content in Korean.

톤앤매너:
- 전문적이면서도 친근한 비즈니스 커뮤니케이션
- 고객 회사의 사업과 산업에 대한 이해를 보여주는 접근
- 상대방에게 가치있는 정보와 인사이트 제공
- 단순 질문이 아닌 구체적인 정보와 맥락을 포함한 대화 시작

생성 원칙:
1. 구체성과 정보 제공:
   - 단순 질문 금지 ("요즘 어떠세요?" ❌)
   - 구체적인 사실, 뉴스, 이벤트를 언급
   - 정보를 제공하면서 자연스럽게 질문으로 연결
   - 예: "최근 OpenAI에서 웹브라우저를 출시했다고 하는데 들어보셨나요?"

2. 시간 범위 (매우 중요):
   - 과거: 최근 3개월 이내 이슈만 언급
   - 미래: 향후 일정이 가장 중요 (다음 주, 다음 달, 다음 분기)
   - 오래된 이야기 금지 ("작년에...", "예전에..." ❌)
   - 예: "다음 주 목요일 행사", "다음 달 15일 킥오프", "4분기 목표"

3. 회사 중심 접근:
   - 고객 회사의 최근 이슈, 사업 동향 우선
   - 구체적인 일정, 프로젝트, 행사 언급
   - 예: "영광군청 행사가 다음달에 예정되어 있는데 관련하여 전용회선 신청이 필요하시죠?"

4. 개인 관심사 활용:
   - 관심사와 연결된 최근 뉴스나 트렌드 언급
   - 업무와의 접점 찾기
   - 구체적인 사례나 정보 제공

5. 실제 관계 기록 활용:
   - 과거 통화 내용에서 구체적인 사항 언급
   - 액션 히스토리의 진행 상황 확인
   - 연속성 있는 대화

6. 시의성과 계절감:
   - 현재 날짜와 계절 고려
   - 업계 최신 이슈와 트렌드 반영`

/**
 * 사용자 프롬프트 템플릿
 * 
 * 변수:
 * - {contactInfo}: 고객 기본 정보
 * - {callHistory}: 최근 통화 기록
 * - {actionHistory}: 최근 액션 기록
 * - {interests}: 개인 관심사
 * - {currentDate}: 현재 날짜
 */
export const USER_PROMPT_TEMPLATE = `Based on the customer information below, generate small talk topics that can be used in the next call. Return ONLY a JSON array.

Current Date: {currentDate}

Customer Info:
{contactInfo}{interests}{callHistory}{actionHistory}

Response Format (JSON only):
[
  { 
    "topic": "주제명 (한글, 30자 이내)", 
    "content": "구체적인 정보를 포함한 대화 문장 (한글, 2-3문장, 최소 50자)", 
    "category": "company|industry|personal|seasonal",
    "expire_days": 7 
  },
  ... (4-6 items)
]

Requirements:
- Write in Korean language
- NO text other than JSON
- Each content must cite at least one of the following: (1) a specific date or timeframe, (2) a named project, product, or event, (3) a measurable figure (%, 억원, 건수 등), or (4) a company/industry keyword
- Content must be 3-4 sentences, each containing one concrete fact or date, one contextual insight, and one engaging follow-up question or suggestion
- Length should be 80-150 characters
- expire_days should be an integer between 5-14

생성 가이드라인 (매우 중요):

⚠️ 금지사항:
- ❌ "요즘 어떠세요?", "바쁘신가요?", "잘 지내시나요?" 같은 단순 질문
- ❌ "프로젝트는 잘 되어가나요?" 같은 추상적 질문
- ❌ 구체적인 정보 없이 질문만 하는 패턴
- ❌ 3개월 이상 오래된 이슈 언급 ("작년에...", "지난해...", "예전에...")
- ❌ 막연한 미래 ("언젠가", "나중에", "조만간")

✅ 필수 패턴 (정보 제공 + 질문):
1. 최근 뉴스/이벤트 언급 (3개월 이내) + 의견 질문
2. 구체적인 향후 일정/프로젝트 언급 + 진행 상황 질문
3. 업계 최신 동향/통계 제시 + 회사 대응 질문
4. 관심사 관련 최근 정보 + 개인 의견 질문

⏰ 시간 표현 가이드:
- ✅ 과거: "이번 주", "지난주", "이번 달", "지난달", "최근", "요즘"
- ✅ 미래: "다음 주", "다음 달", "다음 분기", "연말", "내년 초", "곧"
- ❌ 과거: "작년", "지난해", "몇 년 전", "예전에"
- ❌ 미래: "언젠가", "조만간", "나중에"

생성 예시:

1. 회사/사업 관련 (40-50%):
   ❌ 나쁜 예: "{company}의 신사업은 어떻게 되어가나요?"
   ❌ 나쁜 예: "작년에 발표하신 프로젝트는 어떻게 되셨나요?"
   ✅ 좋은 예: "{company}에서 이번 주 발표하신 AI 기반 물류 시스템이 업계에서 주목받고 있던데요. 내부적으로는 어떤 반응이신가요? 다음 달 시범 운영 일정도 잡히셨나요?"
   - category: "company"
   - 시간: "이번 주 발표", "다음 달 시범 운영" (구체적이고 최근/가까운 미래)
   - 구체적 사실: "AI 기반 물류 시스템", "업계 주목"
   - 자연스러운 질문: "내부 반응", "시범 운영 일정"

2. 산업/업종 트렌드 (30-40%):
   ❌ 나쁜 예: "요즘 AI가 화두인데 어떻게 생각하세요?"
   ❌ 나쁜 예: "몇 년 전부터 AI가 발전하고 있는데..."
   ✅ 좋은 예: "지난주 OpenAI에서 새로운 GPT-4o 모델을 출시했고, 이번 달 국내 주요 기업들이 도입을 검토 중이라고 하더라고요. {company}에서도 4분기 내 AI 도입 계획이 있으신지 궁금합니다."
   - category: "industry"
   - 시간: "지난주 출시", "이번 달 검토", "4분기 내" (최근 & 가까운 미래)
   - 구체적 정보: "GPT-4o 모델", "국내 주요 기업 도입 검토"
   - 회사 연결: "귀사 도입 계획"

3. 액션/프로젝트 관련 (향후 일정 최우선):
   ❌ 나쁜 예: "지난번 말씀하신 프로젝트는 어떻게 되셨나요?"
   ❌ 나쁜 예: "예전에 논의했던 내용은..."
   ✅ 좋은 예: "영광군청 디지털 트윈 구축 프로젝트가 다음 주 목요일 오후 2시 킥오프 미팅으로 알고 있습니다. 전용회선 신청은 이번 주 금요일까지 완료하시는 게 좋을 것 같은데, 제가 빠른 처리 도와드릴까요?"
   - category: "company"
   - 시간: "다음 주 목요일 오후 2시", "이번 주 금요일까지" (매우 구체적인 향후 일정)
   - 구체적 정보: "디지털 트윈 구축", "킥오프 미팅", "전용회선 신청"
   - 실질적 제안: "빠른 처리 지원"

4. 개인 관심사 (10-20%, interests 있을 때만):
   ❌ 나쁜 예: "골프 좋아하신다고 들었는데 요즘도 치시나요?"
   ❌ 나쁜 예: "작년에 골프 치시던데..."
   ✅ 좋은 예: "지난주 PGA 투어에서 한국 선수가 또 우승했더라고요. {contactName}님도 골프 즐기신다고 들었는데, 이번 주말 날씨가 좋다는데 라운딩 계획 있으세요?"
   - category: "personal"
   - 시간: "지난주 우승", "이번 주말" (최근 사건 + 가까운 미래)
   - 구체적 정보: "PGA 투어", "한국 선수 우승", "날씨 좋음"
   - 개인 연결: "골프 즐기심", "주말 라운딩"

5. 계절/시의성 (10-20%):
   ❌ 나쁜 예: "연말이 다가오네요. 잘 마무리하세요."
   ❌ 나쁜 예: "작년 이맘때는..."
   ✅ 좋은 예: "다음 달 초면 2025년 예산 확정 시즌인데요. 지난 9월 미팅 때 말씀하셨던 인프라 확충 건이 내년 예산에 반영되셨나요? 필요하시면 이번 주 내로 제안서 업데이트 자료 보내드리겠습니다."
   - category: "seasonal"
   - 시간: "다음 달 초", "지난 9월", "이번 주 내로" (가까운 미래 중심, 최근 3개월 과거)
   - 구체적 정보: "2025년 예산 확정", "인프라 확충 건"
   - 실질적 지원: "제안서 업데이트 자료", "이번 주 내"

핵심 원칙:
1. 모든 content는 최소 2문장, 50자 이상
2. 첫 문장은 구체적인 사실/정보 제공 (최근 3개월 이내)
3. 두 번째 문장은 자연스러운 질문 또는 제안 (향후 일정 중심)
4. 실제 대화에서 바로 사용 가능한 수준
5. 고객에게 가치있는 정보와 인사이트 제공
6. 시간 표현은 항상 구체적으로 (다음 주 월요일, 이번 달 말, 4분기 등)`

/**
 * 폴백 템플릿: OpenAI 호출 실패 시 사용
 * 
 * 수정 가이드:
 * - 더 다양한 폴백 옵션 추가 가능
 * - 계절별, 상황별 폴백 템플릿 분리 가능
 */
export const FALLBACK_TEMPLATES = (contactName: string, companyName: string) => [
  {
    topic: '회사 근황',
    content: `${companyName}에서 이번 분기 중점 추진 중이신 프로젝트가 있으실 것 같은데요. 혹시 저희 쪽에서 지원 가능한 부분이 있을까요?`,
    expire_days: 10,
  },
  {
    topic: '업계 동향',
    content: `최근 업계에서 디지털 전환이 가속화되고 있다는 기사를 봤습니다. ${companyName}에서는 어떤 방향으로 준비하고 계신가요?`,
    expire_days: 10,
  },
  {
    topic: '시즌 마무리',
    content: `올해도 2개월 남짓 남았는데요. ${contactName}님, 올해 목표하셨던 부분들 잘 마무리되고 계신가요? 연말 전에 지원 필요하신 부분 있으시면 말씀해 주세요.`,
    expire_days: 14,
  },
  {
    topic: '업무 협력',
    content: `지난번 미팅 때 말씀하신 내용 잘 검토해봤습니다. 다음 주쯤 한 번 더 뵙고 구체적으로 논의드리면 어떨까요?`,
    expire_days: 7,
  },
]

/**
 * OpenAI 생성 설정
 */
export const GENERATION_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.6, // 0.0 ~ 1.0: 높을수록 창의적, 낮을수록 일관적
  // maxTokens: 500, // 필요시 주석 해제
}

/**
 * 프롬프트 빌더: 실제 데이터를 템플릿에 주입
 */
export function buildUserPrompt(
  contact: any,
  recentCalls: any[],
  recentActions: any[]
): string {
  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const contactInfo = `
Name: ${contact.name}
Company: ${contact.company || 'N/A'}
Position: ${contact.position || 'N/A'}
Last Contact: ${contact.last_contact || 'N/A'}
`

  const interests = contact.interests 
    ? `\nPersonal Interests: ${contact.interests}\n(이 관심사를 활용하여 개인적 친밀감을 형성할 수 있는 소재 1-2개 포함)` 
    : ''

  const callHistory = recentCalls && recentCalls.length > 0
    ? `\nRecent Calls:\n${recentCalls.map(c => `- ${c.created_at}: ${c.summary}`).join('\n')}`
    : ''

  const actionHistory = recentActions && recentActions.length > 0
    ? `\nRecent Actions:\n${recentActions.map(a => `- ${a.action_date}: ${a.description}`).join('\n')}`
    : ''

  return USER_PROMPT_TEMPLATE
    .replace('{currentDate}', currentDate)
    .replace('{contactInfo}', contactInfo)
    .replace('{interests}', interests)
    .replace('{callHistory}', callHistory)
    .replace('{actionHistory}', actionHistory)
    .replace('{company}', contact.company || '해당 회사')
    .replace('{position}', contact.position || '담당자')
}
