'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardUser {
  id: string
  username: string
  score: number
}

interface LeaderboardPeekProps {
  topUsers?: LeaderboardUser[]
  currentUserRank?: number
}

export default function LeaderboardPeek({ topUsers = [], currentUserRank }: LeaderboardPeekProps) {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>(topUsers)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (topUsers.length > 0) {
      setLeaders(topUsers)
      setLoading(false)
      return
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    fetch(`${backendUrl}/api/leaderboard`)
      .then(res => res.json())
      .then(data => setLeaders((data.leaderboard || []).slice(0, 3)))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))
  }, [topUsers])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
          Leaderboard
        </h3>
        <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-accent hover:text-accent2">
          See all
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-text3">Loading leaderboard...</div>
        ) : leaders.length === 0 ? (
          <div className="text-sm text-text3">No rankings yet</div>
        ) : leaders.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              index === 0 && 'bg-yellow-500/10',
              index === 1 && 'bg-gray-400/10',
              index === 2 && 'bg-amber-700/10'
            )}
          >
            <span className={cn(
              'w-5 text-center text-sm font-display font-bold',
              index === 0 ? 'text-yellow-500' :
              index === 1 ? 'text-gray-400' :
              index === 2 ? 'text-amber-700' : 'text-text3'
            )}>
              {index + 1}
            </span>
            
            <div className="flex-1">
              <p className="text-sm text-text">{user.username}</p>
            </div>
            
            <span className="text-sm font-display font-semibold text-accent">
              {user.score.toLocaleString()}
            </span>
          </div>
        ))}
        
        {currentUserRank && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border-l-2 border-accent">
            <span className="w-5 text-center text-sm font-display font-bold text-accent">
              {currentUserRank}
            </span>
            <div className="flex-1">
              <p className="text-sm text-text">You</p>
            </div>
            <Trophy className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>
    </div>
  )
}
