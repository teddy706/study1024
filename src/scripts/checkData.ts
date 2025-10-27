import { createClient } from '@supabase/supabase-js'
// dotenv는 Node.js 전용이므로 제거. Vite는 .env 파일을 자동으로 로드함
// import * as dotenv from 'dotenv'
// dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking Supabase data...\n')

  // Check contacts
  console.log('1️⃣ Contacts table:')
  try {
    const { data, error, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Total: ${count} rows`)
      console.log('Sample data:', JSON.stringify(data, null, 2))
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
  }
  console.log('')

  // Check reports
  console.log('2️⃣ Reports table:')
  try {
    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Total: ${count} rows`)
      console.log('Sample data:', JSON.stringify(data, null, 2))
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
  }
  console.log('')

  // Check actions
  console.log('3️⃣ Actions table:')
  try {
    const { data, error, count } = await supabase
      .from('actions')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Total: ${count} rows`)
      console.log('Sample data:', JSON.stringify(data, null, 2))
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
  }
  console.log('')

  // Check RLS policies
  console.log('4️⃣ Testing RLS (Row Level Security):')
  console.log('⚠️  If tables have RLS enabled without policies, data might not be accessible.')
  console.log('   Solution: Disable RLS or add policies in Supabase Dashboard')
}

checkData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
