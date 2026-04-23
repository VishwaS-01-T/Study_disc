import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  users: {
    id: string
    github_id: string
    username: string
    avatar_url: string | null
    score: number
    weekly_score: number
    streak: number
    xp: number
    level: number
    last_active: string | null
    status_text: string | null
    email_preferences: Record<string, unknown> | null
    created_at: string
  }
  rooms: {
    id: string
    name: string
    topic: string
    emoji: string
    description: string | null
    invite_code: string
    is_private: boolean
    created_by: string | null
    created_at: string
  }
  room_members: {
    room_id: string
    user_id: string
    joined_at: string
  }
  messages: {
    id: string
    room_id: string
    user_id: string | null
    content: string
    type: string
    created_at: string
  }
  quizzes: {
    id: string
    room_id: string
    created_by: string | null
    questions: Array<{
      id: string
      text: string
      options: string[]
      correct: number
      explanation: string
      topic: string
      question_type: string
      code_snippet?: string
    }>
    source_text: string | null
    type: string
    created_at: string
  }
  duels: {
    id: string
    room_id: string | null
    challenger_id: string | null
    opponent_id: string | null
    quiz_id: string | null
    winner_id: string | null
    score_challenger: number
    score_opponent: number
    mode: string
    deadline: string | null
    completed_at_challenger: string | null
    completed_at_opponent: string | null
    status: string
    created_at: string
  }
  duel_answers: {
    id: string
    duel_id: string
    user_id: string | null
    question_id: string
    answer_index: number | null
    buzz_time_ms: number | null
    correct: boolean | null
    created_at: string
  }
  practice_attempts: {
    id: string
    user_id: string | null
    quiz_id: string | null
    question_id: string
    answer_index: number | null
    correct: boolean | null
    time_ms: number | null
    created_at: string
  }
  friend_requests: {
    id: string
    sender_id: string | null
    receiver_id: string | null
    status: string
    created_at: string
  }
  friendships: {
    user_id: string
    friend_id: string
    created_at: string
  }
  user_badges: {
    id: string
    user_id: string | null
    badge_key: string
    earned_at: string
  }
  season_results: {
    id: string
    season_number: number
    user_id: string | null
    rank: number | null
    score: number | null
    week_ending: string | null
  }
  room_events: {
    id: string
    room_id: string
    type: string
    subject: string | null
    event_date: string | null
    created_by: string | null
    created_at: string
  }
  notifications: {
    id: string
    user_id: string | null
    type: string
    payload: Record<string, unknown> | null
    read: boolean
    created_at: string
  }
  mistake_book: {
    id: string
    user_id: string | null
    question_id: string
    source: string | null
    created_at: string
  }
  resources: {
    id: string
    room_id: string | null
    user_id: string | null
    url: string
    label: string | null
    upvotes: number
    created_at: string
  }
  study_plans: {
    id: string
    user_id: string | null
    room_id: string | null
    plan: Array<{
      date: string
      topics: string[]
      task: string
      estimated_minutes: number
    }>
    generated_at: string
  }
}