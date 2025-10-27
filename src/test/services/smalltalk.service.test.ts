import { describe, it, expect, vi, beforeEach } from 'vitest'
import SmalltalkService from '../services/smalltalk.service'

// Supabase 모킹
vi.mock('../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

describe('SmalltalkService', () => {
  let service: SmalltalkService

  beforeEach(() => {
    service = new SmalltalkService()
    vi.clearAllMocks()
  })

  describe('generateFromContactInfo', () => {
    it('should successfully generate smalltalk items', async () => {
      const { supabase } = await import('../config/supabase')
      const mockInvoke = supabase.functions.invoke as any
      
      // Mock 성공 응답
      mockInvoke.mockResolvedValue({
        data: { success: true, count: 3 },
        error: null
      })

      const contactId = 'test-contact-id'
      const result = await service.generateFromContactInfo(contactId)

      expect(mockInvoke).toHaveBeenCalledWith('generate-contact-smalltalk', {
        body: { contactId }
      })
      expect(result).toBe(3)
    })

    it('should throw error when generation fails', async () => {
      const { supabase } = await import('../config/supabase')
      const mockInvoke = supabase.functions.invoke as any
      
      // Mock 에러 응답
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Generation failed' }
      })

      const contactId = 'test-contact-id'
      
      await expect(service.generateFromContactInfo(contactId))
        .rejects.toThrow()
    })

    it('should handle zero items generated', async () => {
      const { supabase } = await import('../config/supabase')
      const mockInvoke = supabase.functions.invoke as any
      
      mockInvoke.mockResolvedValue({
        data: { success: true, count: 0 },
        error: null
      })

      const contactId = 'test-contact-id'
      const result = await service.generateFromContactInfo(contactId)

      expect(result).toBe(0)
    })
  })

  describe('generateFromSummary', () => {
    it('should generate smalltalk from call summary', async () => {
      const { supabase } = await import('../config/supabase')
      const mockInvoke = supabase.functions.invoke as any
      
      mockInvoke.mockResolvedValue({
        data: { success: true, count: 2 },
        error: null
      })

      const summary = '고객과 신제품에 대해 논의했습니다.'
      const contactId = 'test-contact-id'
      const result = await service.generateFromSummary(summary, contactId)

      expect(mockInvoke).toHaveBeenCalledWith('generate-smalltalk', {
        body: { summary, contactId }
      })
      expect(result).toBe(2)
    })
  })
})
