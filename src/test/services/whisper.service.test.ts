import { describe, it, expect, vi } from 'vitest'
import { WhisperService } from '../../services/stt/whisper.service'

describe('WhisperService', () => {
  let whisperService: WhisperService

  beforeEach(() => {
    whisperService = new WhisperService()
  })

  it('should transcribe audio file successfully', async () => {
    // Mock File object
    const audioFile = new File([''], 'test.wav', { type: 'audio/wav' })
    
    // Mock fetch response
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ text: '테스트 통화 내용입니다.' })
    })

    const result = await whisperService.transcribeAudio(audioFile)
    expect(result).toBe('테스트 통화 내용입니다.')
  })

  it('should summarize transcription successfully', async () => {
    const transcription = '고객과 제품 A에 대해 논의했습니다. 다음 주 화요일에 후속 미팅 예정입니다.'
    const summary = await whisperService.summarizeTranscription(transcription)
    
    expect(summary).toBeTruthy()
    expect(summary).toContain('제품 A')
    expect(summary).toContain('후속 미팅')
  })
})