export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          name: string
          company: string
          position: string | null
          phone: string | null
          phone_link: string | null
          email: string | null
          address: string | null
          created_at: string
          last_contact: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          position?: string | null
          phone?: string | null
          phone_link?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          last_contact?: string | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          position?: string | null
          phone?: string | null
          phone_link?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          last_contact?: string | null
          user_id?: string
        }
      }
      reports: {
        Row: {
          id: string
          contact_id: string
          type: string
          content: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          type: string
          content: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          type?: string
          content?: string
          created_at?: string
          user_id?: string
        }
      }
      calls: {
        Row: {
          id: string
          contact_id: string
          recording_url: string | null
          summary: string | null
          duration: number | null
          called_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          recording_url?: string | null
          summary?: string | null
          duration?: number | null
          called_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          recording_url?: string | null
          summary?: string | null
          duration?: number | null
          called_at?: string
          user_id?: string
        }
      }
      actions: {
        Row: {
          id: string
          contact_id: string
          type: string
          description: string
          due_date: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          type: string
          description: string
          due_date: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          type?: string
          description?: string
          due_date?: string
          status?: string
          user_id?: string
        }
      }
      smalltalk_cache: {
        Row: {
          id: string
          contact_id: string
          topic: string
          content: string
          expires_at: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          topic: string
          content: string
          expires_at: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          topic?: string
          content?: string
          expires_at?: string
          created_at?: string
          user_id?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: 'report' | 'schedule' | 'news'
          title: string
          message: string
          userId: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: 'report' | 'schedule' | 'news'
          title: string
          message: string
          userId: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'report' | 'schedule' | 'news'
          title?: string
          message?: string
          userId?: string
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}