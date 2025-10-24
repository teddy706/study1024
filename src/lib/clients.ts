import { createClient } from '@supabase/supabase-js'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// Initialize clients
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

export const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT
})

// Type definitions
export interface BusinessCard {
  id: string
  image_path: string
  extracted_info: {
    name: string
    title: string
    company: string
    email: string
    phone: string
    address: string
  }
  summary?: string
  sentiment_score?: number
  created_at?: string
  updated_at?: string
}

export interface Call {
  id: string
  contact_id: string
  recording_path: string
  transcript?: string
  summary?: string
  duration?: string
  call_date: string
  call_time: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarEvent {
  id: string
  contact_id: string
  title: string
  description?: string
  date: string
  time: string
  duration?: string
  location?: string
  created_at?: string
  updated_at?: string
}

export interface NewsAlert {
  id: string
  contact_id: string
  company_name: string
  article_url: string
  title: string
  summary?: string
  sentiment_score?: number
  published_at: string
  created_at?: string
}