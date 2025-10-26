import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Contact {
  id: string
  name: string
  company: string
}

interface Call {
  contact_id: string
  summary: string
  called_at: string
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

    // 최근 7일간 통화가 있었던 고객 조회
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentCalls, error: callsError } = await supabase
      .from('calls')
      .select(`
        contact_id,
        summary,
        called_at,
        contacts (
          id,
          name,
          company
        )
      `)
      .gte('called_at', sevenDaysAgo.toISOString())
      .not('summary', 'is', null)
      .order('called_at', { ascending: false })

    if (callsError) throw callsError

    const results: any[] = []

    // 고객별로 그룹화
    const contactCallsMap = new Map<string, { contact: Contact; calls: Call[] }>()
    
    for (const call of recentCalls || []) {
      const contactId = call.contact_id
      if (!contactCallsMap.has(contactId)) {
        contactCallsMap.set(contactId, {
          contact: call.contacts as Contact,
          calls: []
        })
      }
      contactCallsMap.get(contactId)!.calls.push({
        contact_id: call.contact_id,
        summary: call.summary,
        called_at: call.called_at
      })
    }

    // 각 고객별로 스몰토크 생성
    for (const [contactId, { contact, calls }] of contactCallsMap.entries()) {
      try {
        // 최근 통화 요약들을 결합
        const summaries = calls.slice(0, 3).map(c => c.summary).join('\n\n')
        
        const prompt = `다음은 고객 "${contact.name}" (${contact.company})과의 최근 통화 요약입니다.

${summaries}

위 내용을 바탕으로 다음 통화 시 자연스럽게 꺼낼 수 있는 스몰토크 소재를 JSON 배열로만 생성하세요:
[
  { "topic": "주제(짧게)", "content": "가볍게 던질 대화 한두 문장", "expire_days": 7 },
  ... (2~3개)
]

제약:
- JSON 외 다른 텍스트는 포함하지 마세요
- content는 예의 바르고 자연스러운 톤
- expire_days는 5~14 사이 정수`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '너는 영업 지원 비서야. JSON만 반환해.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        })

        const content = completion.choices?.[0]?.message?.content ?? '[]'
        let items = JSON.parse(content)
        if (!Array.isArray(items)) items = []

        // DB에 삽입
        const now = Date.now()
        const rows = items
          .filter((x: any) => x && x.topic && x.content)
          .map((x: any) => ({
            contact_id: contactId,
            topic: String(x.topic).slice(0, 60),
            content: String(x.content).slice(0, 1000),
            expires_at: new Date(now + (Math.max(5, Math.min(14, x.expire_days ?? 7)) * 24 * 60 * 60 * 1000)).toISOString(),
            created_at: new Date().toISOString(),
          }))

        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from('smalltalk_cache')
            .insert(rows)

          if (insertError) {
            console.error(`Failed to insert smalltalk for ${contact.name}:`, insertError)
          } else {
            results.push({ contact: contact.name, count: rows.length })
          }
        }
      } catch (err) {
        console.error(`Error generating smalltalk for ${contact.name}:`, err)
        results.push({ contact: contact.name, error: String(err) })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: contactCallsMap.size,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
