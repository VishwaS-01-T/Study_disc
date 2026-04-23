'use client'

import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import OnlineDot from '@/components/shared/OnlineDot'

interface Room {
  id: string
  name: string
  emoji: string
  topic?: string
  member_count?: number
  online_count?: number
  last_active?: string
}

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="group p-4 bg-surface border border-border rounded-xl hover:border-border2 hover:-translate-y-0.5 transition-all">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{room.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate group-hover:text-accent transition-colors">
              {room.name}
            </h3>
            {room.topic && (
              <p className="text-sm text-text2 truncate">{room.topic}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-text3">
              {room.member_count !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {room.member_count} members
                </span>
              )}
              {room.online_count !== undefined && room.online_count > 0 && (
                <span className="flex items-center gap-1">
                  <OnlineDot online={true} size="sm" />
                  {room.online_count} online
                </span>
              )}
              {room.last_active && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(room.last_active)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}