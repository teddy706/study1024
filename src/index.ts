import express from 'express'
import { processBusinessCard } from './lib/ocr'
import { processCallRecording } from './lib/stt'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

// OCR API 엔드포인트
app.post('/api/ocr', async (req, res) => {
  try {
    const { imagePath } = req.body
    if (!imagePath) {
      return res.status(400).json({ error: '이미지 경로가 필요합니다.' })
    }

    const result = await processBusinessCard(imagePath)
    res.json(result)
  } catch (error) {
    console.error('OCR 처리 중 오류:', error)
    res.status(500).json({ error: '명함 처리 중 오류가 발생했습니다.' })
  }
})

// STT API 엔드포인트
app.post('/api/transcribe', async (req, res) => {
  try {
    const { recordingPath, contactId } = req.body
    if (!recordingPath || !contactId) {
      return res.status(400).json({ error: '녹음 파일 경로와 연락처 ID가 필요합니다.' })
    }

    const result = await processCallRecording(recordingPath, contactId)
    res.json(result)
  } catch (error) {
    console.error('STT 처리 중 오류:', error)
    res.status(500).json({ error: '통화 녹음 처리 중 오류가 발생했습니다.' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`)
})