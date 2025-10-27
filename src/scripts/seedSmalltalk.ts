import { createClient } from '@supabase/supabase-js'
// NOTE: Node.js 스크립트에서는 dotenv 대신 --env-file 플래그 사용
// 실행 예: node --env-file=.env src/scripts/seedSmalltalk.ts

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔧 Seeding smalltalk_cache samples...')

  const { data: contacts, error: cErr } = await supabase
    .from('contacts')
    .select('id,name,company')
    .limit(10)

  if (cErr) throw cErr
  if (!contacts || contacts.length === 0) {
    console.log('ℹ️ No contacts found. Please run sql/insert_test_data.sql first.')
    return
  }

  const topics = [
    {
      topic: '최근 골프 라운딩',
      content: '주말 라운딩 어떠셨어요? 지난 번에 말씀하신 드라이버 교체는 해보셨나요?'
    },
    {
      topic: '아이 학부모 상담',
      content: '자녀 학교 상담 다녀오셨다고 했는데, 어떤 점이 가장 도움이 되셨나요?'
    },
    {
      topic: '커피 취향',
      content: '라떼 좋아하신다고 하셔서 다음 미팅 때 라떼로 준비드릴게요.'
    },
    {
      topic: '최근 산업 뉴스',
      content: '어제 업계 뉴스 보셨나요? 신제품 기사에 대한 의견이 궁금합니다.'
    },
  ]

  const now = Date.now()
  const payload: any[] = []
  for (const ct of contacts) {
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i]
      const expireMs = now + (5 + i * 3) * 24 * 60 * 60 * 1000 // 5,8,11,14 days later
      payload.push({
        contact_id: ct.id,
        topic: t.topic,
        content: t.content,
        expires_at: new Date(expireMs).toISOString(),
        created_at: new Date().toISOString(),
      })
    }
  }

  const { error: iErr, count } = await supabase.from('smalltalk_cache').insert(payload, { count: 'exact' })
  if (iErr) {
    console.error('❌ Insert failed (RLS or permissions may block writes):', iErr.message)
    console.log('➡️ If blocked, run SQL in Supabase SQL Editor: sql/insert_test_data.sql')
    return
  }
  console.log(`✅ Inserted ${count ?? payload.length} smalltalk rows.`)
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
