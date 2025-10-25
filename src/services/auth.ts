import { supabase } from '../config/supabase'

export type AuthUser = {
  id: string
  email?: string | null
  phone?: string | null
}

export async function signUp(email: string, password: string) {
  const result = await supabase.auth.signUp({ email, password })
  return result
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password })
  return result
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return () => listener?.subscription.unsubscribe()
}

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
}
