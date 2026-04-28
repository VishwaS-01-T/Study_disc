'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, Users, Copy, Check } from 'lucide-react'
import OnlineDot from '@/components/shared/OnlineDot'

interface Room {
  id: string
  name: string
  emoji: string
  topic?: string
  member_count?: number
  online_count?: number
}

interface RoomHeaderProps {
  room: Room
  onSettings?: () => void
}

export default function RoomHeader({ room, onSettings }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const code = (room as any).invite_code
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-text3 hover:text-text">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-text">
            {room.emoji} {room.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-text3">
            <Users className="w-3 h-3" />
            <span>{room.member_count || 0} members</span>
            {room.online_count !== undefined && room.online_count > 0 && (
              <>
                <span>·</span>
                <OnlineDot online={true} size="sm" />
                <span>{room.online_count} online</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {(room as any).invite_code && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-surface2 text-text text-xs rounded-lg hover:bg-border"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : `Invite: ${(room as any).invite_code}`}
          </button>
        )}
        {onSettings && (
          <button 
            onClick={onSettings}
            className="p-2 rounded-lg hover:bg-surface2 transition-colors"
          >
            <Settings className="w-5 h-5 text-text3" />
          </button>
        )}
      </div>
    </div>
  )
}
