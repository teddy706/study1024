import { supabase } from '../config/supabase'

export async function addMeeting(contactId: string, memo?: string) {
  const { data, error } = await supabase
    .from('meetings')
    .insert({ contact_id: contactId, memo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMeetings(contactId: string, page: number = 1, pageSize: number = 3) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('meetings')
    .select('*', { count: 'exact' })
    .eq('contact_id', contactId)
    .order('met_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return { data, count }
}
