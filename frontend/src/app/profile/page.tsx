'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Flame, Zap, Swords, Settings, Calendar, Award, AlertTriangle, Loader2 } from 'lucide-react'
import { cn, xpForLevel } from '@/lib/utils'

interface WeakArea {
  topic: string
  accuracy: number
  attempts: number
}

export default function ProfilePage() {
  const [profile] = useState({
    username: 'DemoUser',
    score: 1250,
    xp: 450,
    level: 5,
    streak: 7,
  })
  const [stats] = useState({
    wins: 23,
    losses: 12,
    winRate: 66,
  })
  const [badges] = useState([
    { id: '1', badge_key: 'First Duel', earned_at: '2024-01-15' },
    { id: '2', badge_key: '7 Day Streak', earned_at: '2024-02-01' },
  ])
  const [streakDays] = useState(() => {
    const days: boolean[] = []
    for (let i = 27; i >= 0; i--) {
      days.push(Math.random() > 0.3)
    }
    return days
  })
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  const currentLevel = profile.level
  const xpToNextLevel = xpForLevel(currentLevel + 1)
  const xpProgress = ((profile.xp - xpForLevel(currentLevel)) / (xpToNextLevel - xpForLevel(currentLevel))) * 100

  const analyzeWeakAreas = async () => {
    setAnalyzing(true)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      const res = await fetch(`${backendUrl}/api/weak-areas/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user' }),
      })
      
      const data = await res.json()
      if (data.weakAreas) {
        setWeakAreas(data.weakAreas)
      }
    } catch (e) {
      // Demo data
      setWeakAreas([
        { topic: 'Recursion', accuracy: 45, attempts: 12 },
        { topic: 'Binary Trees', accuracy: 58, attempts: 8 },
        { topic: 'Dynamic Programming', accuracy: 62, attempts: 15 },
      ])
    }
    
    setAnalyzing(false)
  }

  useEffect(() => {
    analyzeWeakAreas()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="surface border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <button className="text-gray-400 hover:text-white">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="surface rounded-xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
              <p className="text-gray-400">Level {currentLevel}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-accent">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-bold">{profile.score}</span>
              </div>
              <p className="text-gray-500 text-sm">points</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>XP</span>
              <span>{profile.xp} / {xpToNextLevel}</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-danger">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{profile.streak}</span>
              <span className="text-gray-500">day streak</span>
            </div>
            <div className="flex items-center gap-2 text-correct">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">{stats.wins}</span>
              <span className="text-gray-500">wins</span>
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">28-Day Activity</h3>
          <div className="streak-grid">
            {streakDays.map((active, i) => (
              <div key={i} className={cn('streak-cell', active && 'active')} />
            ))}
          </div>
        </div>

        <div className="surface rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Weak Areas</h3>
            <button
              onClick={analyzeWeakAreas}
              disabled={analyzing}
              className="text-accent hover:text-accent/80 text-sm flex items-center gap-1"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          
          <div className="space-y-3">
            {weakAreas.length === 0 ? (
              <p className="text-gray-500">Complete more quizzes to see weak areas</p>
            ) : (
              weakAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{area.topic}</p>
                    <p className="text-gray-500 text-sm">{area.attempts} attempts</p>
                  </div>
                  <div className={cn(
                    'font-bold',
                    area.accuracy < 50 ? 'text-danger' : area.accuracy < 70 ? 'text-yellow-500' : 'text-correct'
                  )}>
                    {area.accuracy}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
          <div className="space-y-3">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <Award className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-white font-semibold">{badge.badge_key}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/study-plan" className="flex items-center gap-2 text-accent hover:text-accent/80">
            <Calendar className="w-5 h-5" />
            Generate Study Plan
          </Link>
        </div>
      </main>
    </div>
  )
}