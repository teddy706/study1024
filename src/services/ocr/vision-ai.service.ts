import { ImageAnnotatorClient } from '@google-cloud/vision'
import { supabase } from '../utils/supabase'
import type { Contact } from '../utils/supabase'

const visionClient = new ImageAnnotatorClient()

export const processBusinessCard = async (imageData: string): Promise<Contact> => {
  try {
    // Google Vision AI로 OCR 처리
    const [result] = await visionClient.textDetection({
      image: { content: imageData }
    })

    const detections = result.textAnnotations || []
    if (detections.length === 0) {
      throw new Error('No text detected in image')
    }

    // 텍스트 추출 및 분석
    const extractedText = detections[0].description || ''
    const contact = parseBusinessCardText(extractedText)

    // Supabase에 저장
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()

    if (error) throw error
    return data

  } catch (error) {
    console.error('Error processing business card:', error)
    throw error
  }
}

const parseBusinessCardText = (text: string): Omit<Contact, 'id' | 'created_at' | 'last_contact'> => {
  // 실제 구현에서는 AI/ML을 활용하여 더 정교한 파싱 로직 구현
  const lines = text.split('\n')
  
  return {
    name: lines[0] || '',
    company: lines[1] || '',
    position: lines[2] || '',
    phone: extractPhone(text),
    phone_link: '',
    email: extractEmail(text),
    address: extractAddress(lines)
  }
}

const extractPhone = (text: string): string => {
  const phoneRegex = /(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})/
  const match = text.match(phoneRegex)
  return match ? match[1] : ''
}

const extractEmail = (text: string): string => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const match = text.match(emailRegex)
  return match ? match[0] : ''
}

const extractAddress = (lines: string[]): string => {
  // 주소는 보통 마지막 줄에 있다고 가정
  return lines.slice(-1)[0] || ''
}