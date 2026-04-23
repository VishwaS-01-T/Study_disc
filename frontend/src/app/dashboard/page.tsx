'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Link2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import AuthLayout from '@/components/layout/AuthLayout'
import RoomCard from '@/components/dashboard/RoomCard'
import FriendsPanel from '@/components/dashboard/FriendsPanel'
import PendingDuels from '@/components/dashboard/PendingDuels'
import DailyQuestion from '@/components/dashboard/DailyQuestion'
import LeaderboardPeek from '@/components/dashboard/LeaderboardPeek'
import RivalryCards from '@/components/dashboard/RivalryCards'
import StreakBanner from '@/components/shared/StreakBanner'
import ExamCountdownBanner from '@/components/shared/ExamCountdownBanner'
import SkeletonCard from '@/components/shared/SkeletonCard'

interface User {
  id: string
  username: string
  avatar_url: string | null
  level: number
  streak?: number
}

interface Room {
  id: string
  name: string
  emoji: string
  topic?: string
  member_count?: number
  online_count?: number
  last_active?: string
}

interface DashboardData {
  user: User
  rooms: Room[]
  currentRank?: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const userStr = sessionStorage.getItem('user')
    if (!userStr) {
      window.location.href = '/login'
      return
    }

    const user = JSON.parse(userStr)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

    Promise.all([
      fetch(`${backendUrl}/api/users/${user.id}`).then(r => r.json()),
      fetch(`${backendUrl}/api/rooms`).then(r => r.json()),
      fetch(`${backendUrl}/api/leaderboard`).then(r => r.json()),
    ])
      .then(([userData, roomsData, leaderboardData]) => {
        setData({
          user: userData.user || user,
          rooms: roomsData.rooms || [],
          currentRank: leaderboardData.leaderboard?.findIndex((u: any) => u.id === user.id) + 1 || undefined,
        })
      })
      .catch(() => {
        setData({
          user: user,
          rooms: [],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const streakAtRisk = data && data.user.streak && data.user.streak > 2

  return (
    <AuthLayout user={data?.user || null} rooms={data?.rooms || []}>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
        <div className="space-y-4">
          {streakAtRisk && (
            <StreakBanner streak={data.user.streak || 0} />
          )}
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text3 uppercase tracking-wider">
              Your Rooms
            </h2>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
            </div>
          ) : data?.rooms.length === 0 ? (
            <div className="p-6 bg-surface border border-border rounded-xl text-center">
              <Users className="w-8 h-8 text-text3 mx-auto mb-2" />
              <p className="text-text2 text-sm mb-4">No rooms yet</p>
              <div className="space-y-2">
                <Link
                  href="/rooms/create"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent2"
                >
                  <Plus className="w-4 h-4" />
                  Create room
                </Link>
                <Link
                  href="/join"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-surface2 text-text text-sm font-medium rounded-lg hover:bg-border"
                >
                  <Link2 className="w-4 h-4" />
                  Join via code
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
              <Link
                href="/rooms/create"
                className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-border text-text2 text-sm rounded-xl hover:border-accent hover:text-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create room
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ExamCountdownBanner 
            examName="DSA Final" 
            examDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)} 
          />
          
          <PendingDuels />
          
          <DailyQuestion />
          
          <div className="p-4 bg-surface border border-border rounded-xl">
            <h3 className="text-sm font-semibold text-text mb-3">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-text2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                <span>2h ago — You completed a quiz</span>
              </div>
              <div className="flex items-center gap-3 text-text2">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span>5h ago — Streak increased to 13 days</span>
              </div>
              <div className="flex items-center gap-3 text-text2">
                <span className="w-2 h-2 bg-warning rounded-full" />
                <span>1d ago — Raj beat you in a duel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <FriendsPanel />
          <RivalryCards />
          <LeaderboardPeek currentUserRank={data?.currentRank} />
        </div>
      </div>
    </AuthLayout>
  )
}