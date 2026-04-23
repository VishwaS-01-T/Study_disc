'use client'

import Link from 'next/link'
import { Flame, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakBannerProps {
  streak: number
  onDismiss?: () => void
}

export default function StreakBanner({ streak, onDismiss }: StreakBannerProps) {
  return (
    <div className="relative p-4 rounded-xl bg-warning/10 border border-warning/30">
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded hover:bg-warning/20"
      >
        <X className="w-4 h-4 text-warning" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-warning">
            Your {streak}-day streak is at risk!
          </p>
          <p className="text-sm text-text2">
            Complete a quiz or duel today to keep it alive.
          </p>
        </div>
        <Link
          href="/rooms"
          className="px-4 py-2 bg-warning text-bg font-semibold rounded-lg hover:bg-warning/80 transition-colors"
        >
          Study now
        </Link>
      </div>
    </div>
  )
}