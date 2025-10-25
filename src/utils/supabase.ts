import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// 데이터베이스 타입 정의
export interface Contact {
  id: string
  name: string
  company: string
  position: string
  phone: string
  phone_link: string
  email: string
  address: string
  created_at: string
  last_contact: string
}

export interface Report {
  id: string
  contact_id: string
  type: string
  content: string
  created_at: string
}

export interface Call {
  id: string
  contact_id: string
  recording_url: string
  summary: string
  duration: number
  called_at: string
}

export interface Action {
  id: string
  contact_id: string
  type: string
  description: string
  due_date: string
  status: string
}

export interface SmalltalkCache {
  id: string
  contact_id: string
  topic: string
  content: string
  expires_at: string
}