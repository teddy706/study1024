import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || 'demo-key'

// 데모 모드: 환경변수가 없어도 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)