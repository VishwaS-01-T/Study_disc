'use client'

import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuzzButtonProps {
  active?: boolean
  onClick?: () => void
  disabled?: boolean
}

export default function BuzzButton({ active = true, onClick, disabled }: BuzzButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative min-w-[140px] min-h-[64px] px-6 py-3 bg-danger text-white font-display font-bold text-lg rounded-xl',
        'transition-all active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed',
        active && 'buzz-active'
      )}
      style={{
        background: active 
          ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
          : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      }}
    >
      {active && (
        <span 
          className="absolute inset-0 rounded-xl animate-ping opacity-75"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #f43f5e, transparent)',
          }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <Zap className="w-5 h-5" />
        BUZZ!
      </span>
    </button>
  )
}