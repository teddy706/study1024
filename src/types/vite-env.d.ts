/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GOOGLE_VISION_API_KEY: string
  readonly VITE_APIFY_TOKEN: string
  readonly VITE_SLACK_WEBHOOK_URL: string
  readonly VITE_API_RATE_LIMIT: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_ORIGINS: string
  readonly VITE_ENABLE_VOICE_RECORDING: string
  readonly VITE_ENABLE_NEWS_AUTOMATION: string
  readonly VITE_ENABLE_SLACK_NOTIFICATIONS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}