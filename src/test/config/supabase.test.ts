import { describe, it, expect, beforeAll } from 'vitest'
import { supabase } from '../../config/supabase'

describe('Supabase Connection', () => {
  beforeAll(() => {
    // 환경 변수 확인
    expect(process.env.VITE_SUPABASE_URL).toBeDefined()
    expect(process.env.VITE_SUPABASE_KEY).toBeDefined()
  })

  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('contacts').select('*').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})