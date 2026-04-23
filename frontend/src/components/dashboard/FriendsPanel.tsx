'use client'

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
  const defaultFriends: Friend[] = friends.length > 0 ? friends : [
    { id: '1', username: 'Raj Kumar', online: true, status: 'studying DSA Practice', study_time_today: 45 },
    { id: '2', username: 'Priya', online: true, status: 'studying OS', study_time_today: 30 },
    { id: '3', username: 'Dev', online: false, status: 'offline', study_time_today: 0 },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
        Friends Online
      </h3>
      
      {defaultFriends.length === 0 ? (
        <p className="text-sm text-text3">No friends online</p>
      ) : (
        <div className="space-y-2">
          {defaultFriends.map((friend) => (
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