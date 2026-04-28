'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import NotificationPanel from '@/components/shared/NotificationPanel'

interface User {
  id: string
  username: string
  avatar_url: string | null
  level: number
}

interface TopNavProps {
  user?: User | null
  unreadCount?: number
}

export default function TopNav({ user, unreadCount = 0 }: TopNavProps) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAcceptDuel = async (duelId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      await fetch(`${backendUrl}/api/duels/${duelId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error('Failed to accept duel:', err)
    }
  }

  const handleDeclineDuel = async (duelId: string) => {
    console.log('Decline duel:', duelId)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-accent">StudyOS</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-surface2 transition-colors"
              >
                <Bell className="w-5 h-5 text-text2" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel 
                  onClose={() => setShowNotifications(false)}
                  onAccept={handleAcceptDuel}
                  onDecline={handleDeclineDuel}
                />
              )}
            </div>

            {user && (
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-surface2 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                <span className="text-text text-sm font-medium hidden sm:inline">{user.username}</span>
                <span className="text-accent text-xs font-display font-bold">Lv.{user.level}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}