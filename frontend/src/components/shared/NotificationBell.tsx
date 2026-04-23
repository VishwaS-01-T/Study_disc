'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
}

export default function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-surface2 transition-colors"
    >
      <Bell className="w-5 h-5 text-text2" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}