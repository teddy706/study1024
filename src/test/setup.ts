import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { supabase } from '../utils/supabase'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Global setup
beforeAll(() => {
  // Setup any test environment variables
  process.env.VITE_SUPABASE_URL = 'test-url'
  process.env.VITE_SUPABASE_KEY = 'test-key'
})

// Global teardown
afterAll(() => {
  // Close any connections
  supabase.removeAllSubscriptions()
})