import { createClient } from '@supabase/supabase-js'
// NOTE: Node.js 스크립트에서는 dotenv 대신 --env-file 플래그 사용
// 실행 예: node --env-file=.env src/scripts/testSupabaseFunctions.ts

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseFunctions() {
  console.log('🔍 Testing Supabase RPC functions...\n')

  // Test 1: get_companies
  console.log('1️⃣ Testing get_companies()...')
  try {
    const { data, error } = await supabase.rpc('get_companies')
    if (error) {
      console.error('❌ Error:', error.message)
      console.log('⚠️  Function may not exist. Please run sql/supabase_functions.sql in Supabase SQL Editor.\n')
    } else {
      console.log('✅ Success! Companies:', data)
      console.log('')
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
    console.log('⚠️  Function may not exist. Please run sql/supabase_functions.sql in Supabase SQL Editor.\n')
  }

  // Test 2: get_dashboard_counts
  console.log('2️⃣ Testing get_dashboard_counts()...')
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const { data, error } = await supabase.rpc('get_dashboard_counts', {
      start_ts: sevenDaysAgo.toISOString(),
      end_ts: now.toISOString()
    })
    
    if (error) {
      console.error('❌ Error:', error.message)
      console.log('⚠️  Function may not exist. Please run sql/supabase_functions.sql in Supabase SQL Editor.\n')
    } else {
      console.log('✅ Success! Counts:', data)
      console.log('')
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
    console.log('⚠️  Function may not exist. Please run sql/supabase_functions.sql in Supabase SQL Editor.\n')
  }

  // Test 3: Check tables exist
  console.log('3️⃣ Checking if tables exist...')
  try {
    const [contacts, reports, actions] = await Promise.all([
      supabase.from('contacts').select('count', { count: 'exact', head: true }),
      supabase.from('reports').select('count', { count: 'exact', head: true }),
      supabase.from('actions').select('count', { count: 'exact', head: true })
    ])
    
    console.log('✅ Contacts table:', contacts.count ?? 0, 'rows')
    console.log('✅ Reports table:', reports.count ?? 0, 'rows')
    console.log('✅ Actions table:', actions.count ?? 0, 'rows')
  } catch (err: any) {
    console.error('❌ Error checking tables:', err.message)
  }
}

testSupabaseFunctions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
