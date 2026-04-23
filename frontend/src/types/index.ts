export interface User {
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

export interface Room {
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

export interface RoomMember {
  room_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string | null
  content: string
  type: string
  created_at: string
  username?: string
  avatar_url?: string
}

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  topic: string
  question_type: 'mcq' | 'code'
  code_snippet?: string
}

export interface Quiz {
  id: string
  room_id: string
  created_by: string | null
  questions: QuizQuestion[]
  source_text: string | null
  type: string
  created_at: string
}

export interface Duel {
  id: string
  room_id: string | null
  challenger_id: string | null
  opponent_id: string | null
  quiz_id: string | null
  winner_id: string | null
  score_challenger: number
  score_opponent: number
  mode: 'live' | 'async'
  deadline: string | null
  completed_at_challenger: string | null
  completed_at_opponent: string | null
  status: 'pending' | 'active' | 'completed'
  created_at: string
  challenger?: User
  opponent?: User
  quiz?: Quiz
}

export interface FriendRequest {
  id: string
  sender_id: string | null
  receiver_id: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: User
  receiver?: User
}

export interface Badge {
  id: string
  user_id: string | null
  badge_key: string
  earned_at: string
}

export interface StudyPlan {
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

export interface Resource {
  id: string
  room_id: string | null
  user_id: string | null
  url: string
  label: string | null
  upvotes: number
  created_at: string
  user?: User
}

export interface MistakeBookEntry {
  id: string
  user_id: string | null
  question_id: string
  source: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  type: string
  payload: Record<string, unknown> | null
  read: boolean
  created_at: string
}