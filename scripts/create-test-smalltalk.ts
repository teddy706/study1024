// 테스트용 스몰톸 데이터 생성 스크립트
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

const testSmalltalks = [
  {
    topic: '최신 AI 트렌드',
    content: 'ChatGPT와 같은 생성형 AI가 비즈니스 환경을 어떻게 변화시키고 있는지에 대해 이야기해보세요. 특히 고객님의 업계에서는 어떤 활용 방안을 고려하고 계신지 궁금합니다.',
    meta: { source: 'openai', type: 'business_trend' }
  },
  {
    topic: '업계 동향 분석',
    content: '최근 귀하의 업계에서 주목받고 있는 트렌드나 변화가 있나요? 특히 디지털 전환 측면에서 어떤 준비를 하고 계신지 공유해주시면 좋겠습니다.',
    meta: { source: 'openai', type: 'industry_insight' }
  },
  {
    topic: '효율성 개선 방안',
    content: '업무 효율성을 높이기 위해 어떤 도구나 방법론을 사용하고 계신가요? 저희도 항상 더 나은 프로세스를 찾고 있어서 경험을 공유해주시면 감사하겠습니다.',
    meta: { source: 'openai', type: 'productivity' }
  },
  {
    topic: '시장 전망 토론',
    content: '내년도 시장 전망에 대해 어떻게 보고 계신가요? 특히 경기 불확실성 속에서도 기회를 찾을 수 있는 분야가 있을까요?',
    meta: { source: 'openai', type: 'market_outlook' }
  },
  {
    topic: '혁신 사례 공유',
    content: '최근에 보신 인상적인 혁신 사례가 있나요? 스타트업이든 대기업이든, 창의적인 접근 방식에 대한 이야기를 나누고 싶습니다.',
    meta: { source: 'openai', type: 'innovation' }
  },
  {
    topic: '고객 경험 개선',
    content: '고객 만족도 향상을 위해 어떤 노력을 기울이고 계신가요? 고객의 피드백을 수집하고 반영하는 특별한 방법이 있으시다면 궁금합니다.',
    meta: { source: 'openai', type: 'customer_experience' }
  },
  {
    topic: '지속가능성 이니셔티브',
    content: 'ESG 경영이나 지속가능성에 대한 관심이 높아지고 있는데, 귀사에서는 어떤 친환경적인 활동이나 사회적 책임 프로그램을 운영하고 계신가요?',
    meta: { source: 'openai', type: 'sustainability' }
  },
  {
    topic: '원격근무 경험',
    content: '코로나19 이후 원격근무나 하이브리드 근무 환경에서의 경험은 어떠셨나요? 팀 협업이나 소통에서 효과적이었던 방법들을 공유해주세요.',
    meta: { source: 'openai', type: 'remote_work' }
  },
  {
    topic: '데이터 활용 전략',
    content: '빅데이터나 분석을 통해 비즈니스 인사이트를 얻는 방법에 대해 관심이 있으신가요? 데이터 기반 의사결정에서 중요하게 생각하시는 부분이 있다면 들어보고 싶습니다.',
    meta: { source: 'openai', type: 'data_strategy' }
  },
  {
    topic: '네트워킹의 가치',
    content: '비즈니스 네트워킹에서 가장 중요하다고 생각하시는 요소는 무엇인가요? 좋은 파트너십을 구축하고 유지하는 노하우가 있으시다면 공유해주세요.',
    meta: { source: 'openai', type: 'networking' }
  },
  {
    topic: '인재 채용 및 육성',
    content: '우수한 인재를 찾고 육성하는 것이 모든 기업의 과제인데, 귀사만의 특별한 인재 관리 철학이나 방법이 있으신가요?',
    meta: { source: 'openai', type: 'talent_management' }
  },
  {
    topic: '글로벌 시장 진출',
    content: '해외 시장 진출이나 글로벌 비즈니스에 대한 계획이나 경험이 있으신가요? 문화적 차이를 극복하는 방법에 대해서도 궁금합니다.',
    meta: { source: 'openai', type: 'global_business' }
  }
]

async function createTestSmalltalks() {
  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('인증이 필요합니다:', authError)
      return
    }

    // 첫 번째 연락처 가져오기
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)

    if (contactError || !contacts || contacts.length === 0) {
      console.error('연락처를 찾을 수 없습니다:', contactError)
      return
    }

    const contact = contacts[0]
    console.log(`연락처 "${contact.name}"에 테스트 스몰톸 생성 중...`)

    // 기존 스몰톸 삭제 (테스트용)
    await supabase
      .from('smalltalk_cache')
      .delete()
      .eq('contact_id', contact.id)

    // 새 스몰톸 데이터 생성
    const smalltalksToInsert = testSmalltalks.map((smalltalk, index) => ({
      user_id: user.id,
      contact_id: contact.id,
      topic: smalltalk.topic,
      content: smalltalk.content,
      expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30일 후 만료
      meta: smalltalk.meta
    }))

    const { data, error } = await supabase
      .from('smalltalk_cache')
      .insert(smalltalksToInsert)

    if (error) {
      console.error('스몰톸 생성 실패:', error)
      return
    }

    console.log(`✅ ${testSmalltalks.length}개의 테스트 스몰톸이 생성되었습니다!`)
    console.log(`연락처 ID: ${contact.id}`)
    console.log(`연락처 이름: ${contact.name}`)
    
  } catch (error) {
    console.error('오류 발생:', error)
  }
}

// 스크립트 실행
createTestSmalltalks()