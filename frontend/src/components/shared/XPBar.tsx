'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface XPBarProps {
  currentXP: number
  maxXP: number
  level: number
  animate?: boolean
}

export default function XPBar({ currentXP, maxXP, level, animate = true }: XPBarProps) {
  const [displayXP, setDisplayXP] = useState(animate ? 0 : currentXP)
  const percentage = Math.min((displayXP / maxXP) * 100, 100)

  useEffect(() => {
    if (!animate) return
    
    const duration = 500
    const steps = 20
    const increment = currentXP / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= currentXP) {
        setDisplayXP(currentXP)
        clearInterval(timer)
      } else {
        setDisplayXP(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [currentXP, animate])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text2">XP to Lv.{level + 1}</span>
        <span className="text-text font-mono">{displayXP}/{maxXP}</span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}