import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      dbId?: string
      username?: string
      avatar_url?: string | null
      score?: number
      level?: number
      xp?: number
      streak?: number
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dbId?: string
  }
}