import { ApifyClient } from 'apify-client'
import { supabase } from '../utils/supabase'
import type { Contact, Report } from '../utils/supabase'

const apifyClient = new ApifyClient({
  token: import.meta.env.VITE_APIFY_TOKEN,
})

export const generateNewsReport = async (contact: Contact): Promise<Report> => {
  try {
    // 뉴스 수집
    const run = await apifyClient.actor('apify/web-scraper').call({
      startUrls: [
        { url: `https://search.naver.com/search.naver?where=news&query=${contact.company}` },
        { url: `https://www.google.com/search?q=${contact.company}&tbm=nws` }
      ],
      pageFunction: ($) => {
        const articles = []
        $('article').each((_, el) => {
          articles.push({
            title: $(el).find('h3').text(),
            summary: $(el).find('p').text(),
            url: $(el).find('a').attr('href')
          })
        })
        return articles
      }
    })

    const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems()

    // GPT를 사용하여 뉴스 분석 및 요약
    const summary = await analyzeNews(dataset)

    // 리포트 생성 및 저장
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
}

const analyzeNews = async (articles: any[]): Promise<string> => {
  // OpenAI GPT를 사용하여 뉴스 분석
  const openai = new OpenAI(import.meta.env.VITE_OPENAI_API_KEY)
  
  const prompt = `
    다음 뉴스 기사들을 분석하고 비즈니스 관점에서 중요한 내용을 요약해주세요:
    ${articles.map(a => `${a.title}\n${a.summary}`).join('\n\n')}
  `

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-mini'
  })

  return completion.choices[0].message.content || ''
}