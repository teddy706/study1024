// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiKey })

    const { summary, contactId } = await req.json()
    if (!summary || !contactId) {
      return new Response(
        JSON.stringify({ error: 'summary and contactId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const prompt = `아래 통화 요약을 바탕으로, 다음 JSON 배열 형식만 반환하세요.
[
  { "topic": "주제(짧게)", "content": "가볍게 던질 수 있는 한두 문장", "expire_days": 7 },
  ... (2~4개 항목)
]
제약:
- 한국어로 답하세요.
- JSON 외 다른 텍스트는 포함하지 마세요.
- content는 예의 바르고 자연스러운 일상 대화 톤으로.
- expire_days는 5~14 사이의 정수로 임의 분포.

통화 요약:
${summary}`

    let items: any[] = []
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 영업 지원 비서야. JSON만 반환해.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      })
      const content = completion.choices?.[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(content)
      items = Array.isArray(parsed) ? parsed : []
    } catch (e) {
      // 파싱 실패 시 안전한 기본값
      items = [
        {
          topic: '최근 통화 요약',
          content: String(summary).slice(0, 180) + (String(summary).length > 180 ? '…' : ''),
          expire_days: 7,
        },
      ]
    }

    const now = Date.now()
    const rows = items
      .filter((x) => x && x.topic && x.content)
      .map((x) => ({
        contact_id: contactId,
        topic: String(x.topic).slice(0, 60),
        content: String(x.content).slice(0, 1000),
        expires_at: new Date(
          now + Math.max(5, Math.min(14, Number(x.expire_days ?? 7))) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
      }))

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    const { error, count } = await supabase.from('smalltalk_cache').insert(rows, { count: 'exact' })
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, count: count ?? rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('generate-smalltalk error:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
