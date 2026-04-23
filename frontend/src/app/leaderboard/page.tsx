'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  username: string
  score: number
  level: number
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: '1', username: 'CodeMaster', score: 5420, level: 12 },
        { id: '2', username: 'AlgoQueen', score: 4890, level: 11 },
        { id: '3', username: 'ByteNinja', score: 3650, level: 9 },
        { id: '4', username: 'DevWiz', score: 2890, level: 8 },
        { id: '5', username: 'StackOverflow', score: 2450, level: 7 },
        { id: '6', username: 'GitGuru', score: 2100, level: 6 },
        { id: '7', username: 'PixelPusher', score: 1890, level: 6 },
        { id: '8', username: 'DemoUser', score: 1250, level: 5 },
      ])
      setLoading(false)
    }, 300)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="surface border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Leaderboard</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="surface rounded-xl p-6 border border-border mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <span className="text-xl font-bold text-white">Global Rankings</span>
          </div>
          <p className="text-gray-500 text-center">Top 20 by total score</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="surface rounded-xl p-4 border border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-border rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-border rounded w-24 mb-1"></div>
                    <div className="h-3 bg-border rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  'surface rounded-xl p-4 border transition-colors',
                  user.username === 'DemoUser'
                    ? 'border-accent bg-accent/10'
                    : index < 3
                    ? 'border-yellow-500/30'
                    : 'border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center">
                    {index === 0 ? (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-6 h-6 text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="w-6 h-6 text-amber-700" />
                    ) : (
                      <span className="text-gray-500 font-quiz">{index + 1}</span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user.username}</p>
                    <p className="text-gray-500 text-sm">Level {user.level}</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <Zap className="w-4 h-4" />
                    <span className="font-bold">{user.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}