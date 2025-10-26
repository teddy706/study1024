import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.VITE_SUPABASE_KEY!

if (!url || !key) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function testDailySmalltalk() {
  console.log('🧪 Testing daily smalltalk generation...\n')

  // Edge Function URL (로컬 또는 프로덕션)
  const isLocal = process.argv.includes('--local')
  const functionUrl = isLocal
    ? 'http://localhost:54321/functions/v1/generate-daily-smalltalk'
    : `${url}/functions/v1/generate-daily-smalltalk`

  console.log(`📍 Calling: ${functionUrl}`)
  console.log(`🔑 Using ${isLocal ? 'local' : 'production'} environment\n`)

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const result = await response.json()
    console.log('✅ Function executed successfully!\n')
    console.log('📊 Results:')
    console.log(JSON.stringify(result, null, 2))

    if (result.results && result.results.length > 0) {
      console.log('\n📝 Details:')
      result.results.forEach((r: any, i: number) => {
        if (r.error) {
          console.log(`  ${i + 1}. ❌ ${r.contact}: ${r.error}`)
        } else {
          console.log(`  ${i + 1}. ✅ ${r.contact}: ${r.count} smalltalks generated`)
        }
      })
    }

    // 생성된 스몰토크 확인
    console.log('\n🔍 Checking recent smalltalks...')
    const { data: recent, error } = await supabase
      .from('smalltalk_cache')
      .select(`
        topic,
        content,
        expires_at,
        created_at,
        contacts (
          name,
          company
        )
      `)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // 최근 1분
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Failed to fetch recent smalltalks:', error)
    } else if (recent && recent.length > 0) {
      console.log(`\n📋 ${recent.length} recent smalltalks:`)
      recent.forEach((st: any) => {
        console.log(`\n  👤 ${st.contacts?.name} (${st.contacts?.company})`)
        console.log(`  📌 ${st.topic}`)
        console.log(`  💬 ${st.content}`)
        console.log(`  ⏰ Expires: ${new Date(st.expires_at).toLocaleString('ko-KR')}`)
      })
    } else {
      console.log('ℹ️  No new smalltalks in the last minute.')
    }

  } catch (err: any) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

console.log('╔════════════════════════════════════════╗')
console.log('║  Daily Smalltalk Generation Tester    ║')
console.log('╚════════════════════════════════════════╝\n')

testDailySmalltalk()
  .then(() => {
    console.log('\n✅ Test completed!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Fatal error:', err)
    process.exit(1)
  })
