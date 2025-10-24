import { vision, supabase, openai, type BusinessCard } from './clients'

export async function processBusinessCard(imagePath: string): Promise<BusinessCard> {
  try {
    // 1. OCR로 명함 이미지 처리
    const [result] = await vision.textDetection(imagePath)
    const fullText = result.fullTextAnnotation?.text || ''

    // 2. GPT로 텍스트 파싱 및 구조화
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '명함의 텍스트에서 이름, 직함, 회사명, 이메일, 전화번호, 주소를 추출해주세요.'
        },
        {
          role: 'user',
          content: fullText
        }
      ]
    })

    const extractedInfo = JSON.parse(completion.choices[0].message.content || '{}')

    // 3. 감성 분석
    const sentimentAnalysis = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '제공된 텍스트에 대한 감성 점수를 -1(매우 부정적)부터 1(매우 긍정적) 사이의 숫자로 반환해주세요.'
        },
        {
          role: 'user',
          content: fullText
        }
      ]
    })

    const sentimentScore = parseFloat(sentimentAnalysis.choices[0].message.content || '0')

    // 4. 요약 생성
    const summarization = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '명함의 정보를 바탕으로 간단한 프로필 요약을 생성해주세요.'
        },
        {
          role: 'user',
          content: JSON.stringify(extractedInfo)
        }
      ]
    })

    // 5. Supabase에 저장
    const { data: businessCard, error } = await supabase
      .from('business_cards')
      .insert({
        image_path: imagePath,
        extracted_info: extractedInfo,
        summary: summarization.choices[0].message.content,
        sentiment_score: sentimentScore
      })
      .select()
      .single()

    if (error) throw error

    return businessCard
  } catch (error) {
    console.error('명함 처리 중 오류 발생:', error)
    throw error
  }
}