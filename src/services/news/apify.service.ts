// NOTE: ApifyClient는 브라우저에서 사용할 수 없으므로 주석 처리
// import { ApifyClient } from 'apify-client'
import { supabase } from '../../config/supabase'
import type { Database } from '../../types/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type Report = Database['public']['Tables']['reports']['Row']

// ApifyClient는 서버 측(Edge Functions)에서만 사용 가능
// const apifyClient = new ApifyClient({
//   token: import.meta.env.VITE_APIFY_TOKEN,
// })

export const generateNewsReport = async (contact: Contact): Promise<Report> => {
  // NOTE: ApifyClient는 브라우저 환경에서 사용 불가
  // 실제 구현은 Edge Function 또는 서버 사이드에서 처리 필요
  throw new Error('generateNewsReport는 브라우저에서 직접 호출할 수 없습니다. Edge Function을 사용하세요.')
  
  /* 원본 코드 (서버 측에서만 사용 가능)
  try {
    const run = await apifyClient.actor('apify/web-scraper').call({
      startUrls: [
        { url: `https://search.naver.com/search.naver?where=news&query=${contact.company}` },
        { url: `https://www.google.com/search?q=${contact.company}&tbm=nws` }
      ],
      pageFunction: ($: any) => {
        const articles: any[] = []
        $('article').each((_: any, el: any) => {
          articles.push({
            title: $(el).find('h3').text(),
            summary: $(el).find('p').text(),
            url: $(el).find('a').attr('href')
          })
        })
        return articles
      }
    })

    const dataset: any = await apifyClient.dataset(run.defaultDatasetId).listItems()
    const summary = await analyzeNews(dataset)

    const report = {
      contact_id: contact.id,
      type: 'news',
      content: summary,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error generating news report:', error)
    throw error
  }
  */
}

// Edge Function으로 뉴스 분석 위임 (OpenAI 키 서버 측 보호)
const analyzeNews = async (articles: any[]): Promise<string> => {
  // Edge Function으로 뉴스 분석 위임 (OpenAI 키 서버 측 보호)
  const { data, error } = await supabase.functions.invoke('analyze-news', {
    body: { articles },
  })

  if (error) throw error
  return String(data?.summary ?? '')
}