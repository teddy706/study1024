import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleAnalysisRequest {
  prompt: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt }: ScheduleAnalysisRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt는 필수 항목입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 비즈니스 미팅 분석 전문가입니다. 미팅 기록을 분석하여 실행 가능한 액션 아이템을 추출하는 것이 목표입니다.

중요한 지침:
1. 구체적이고 실행 가능한 액션만 추출하세요
2. 날짜는 현실적으로 설정하세요 (오늘 기준)
3. 우선순위를 정확히 판단하세요
4. JSON 형식을 정확히 지켜주세요
5. 모호한 내용은 포함하지 마세요`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API 오류:', error)
      return new Response(
        JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'AI 응답을 받을 수 없습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // JSON 파싱 시도
    try {
      const analysisResult = JSON.parse(content)
      
      // 기본 검증
      if (!analysisResult.actions || !Array.isArray(analysisResult.actions)) {
        throw new Error('잘못된 응답 형식')
      }

      // 각 액션의 필수 필드 검증 및 기본값 설정
      const validActions = analysisResult.actions
        .filter((action: any) => action.type && action.description && action.due_date)
        .map((action: any) => ({
          type: action.type,
          description: action.description,
          due_date: action.due_date,
          priority: action.priority || 'medium',
          estimated_duration: action.estimated_duration || null
        }))

      return new Response(
        JSON.stringify({
          actions: validActions,
          summary: analysisResult.summary || '일정 분석이 완료되었습니다.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
      console.error('AI 응답 내용:', content)
      
      // 파싱 실패 시 기본 응답 반환
      return new Response(
        JSON.stringify({
          actions: [],
          summary: 'AI 분석 결과를 파싱하는 중 오류가 발생했습니다. 수동으로 일정을 추가해주세요.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('일정 분석 오류:', error)
    return new Response(
      JSON.stringify({ 
        error: '일정 분석 중 오류가 발생했습니다.',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})