'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import OnlineDot from '@/components/shared/OnlineDot'

interface Friend {
  id: string
  username: string
  avatar_url?: string
  online?: boolean
  status?: string
  study_time_today?: number | null
}

interface FriendsPanelProps {
  friends?: Friend[]
}

export default function FriendsPanel({ friends = [] }: FriendsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendList, setFriendList] = useState<Friend[]>(friends)

  useEffect(() => {
    if (friends.length > 0) return
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (!userStr) return
    const user = JSON.parse(userStr)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    setLoading(true)
    fetch(`${backendUrl}/api/users/${user.id}/friends`)
      .then(res => res.json())
      .then(data => setFriendList((data.friends || []).map((f: any) => ({
        id: f.id,
        username: f.username,
        avatar_url: f.avatar_url,
        online: false,
        status: 'offline',
        study_time_today: 0,
      }))))
      .catch(() => setError('Failed to load friends'))
      .finally(() => setLoading(false))
  }, [friends.length])

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
        Friends Online
      </h3>
      
      {loading ? (
        <p className="text-sm text-text3">Loading friends...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : friendList.length === 0 ? (
        <p className="text-sm text-text3">No friends yet</p>
      ) : (
        <div className="space-y-2">
          {friendList.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface2 transition-colors"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                  {friend.username[0].toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineDot online={friend.online} size="sm" />
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{friend.username}</p>
                <p className="text-xs text-text3 truncate">
                  {friend.online ? friend.status : 'offline'}
                </p>
              </div>
              
              {friend.online && (friend.study_time_today ?? 0) > 0 && (
                <span className="text-xs text-text3">
                  {friend.study_time_today}min
                </span>
              )}
              
              {friend.online && (
                <Link
                  href={`/duel/challenge/${friend.id}`}
                  className="p-1.5 rounded-lg hover:bg-surface2 transition-colors"
                >
                  <Swords className="w-4 h-4 text-accent" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
