import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { document_id } = await req.json()

    // 1. Get document content
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError) throw docError

    // 2. Get extracted content
    const { data: extractedContent, error: extractError } = await supabaseClient
      .from('extracted_contents')
      .select('*')
      .eq('document_id', document_id)
      .single()

    if (extractError) throw extractError

    // 3. Generate summary using Azure OpenAI
    const summary = await generateSummary(extractedContent.processed_content)

    // 4. Save summary
    const { error: insertError } = await supabaseClient
      .from('summaries')
      .insert({
        document_id,
        summary_text: summary,
        summary_type: 'auto',
        tokens_used: calculateTokens(summary)
      })

    if (insertError) throw insertError

    // 5. Update document status
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', document_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateSummary(content: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '입력된 텍스트의 주요 내용을 3-5문장으로 요약해주세요.'
        },
        {
          role: 'user',
          content
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    }),
  })

  const result = await response.json()
  return result.choices[0].message.content
}

function calculateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for Korean text
  return Math.ceil(text.length / 4)
}