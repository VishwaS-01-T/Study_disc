'use client'

import { cn } from '@/lib/utils'

interface OnlineDotProps {
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
}

export default function OnlineDot({ online = true, size = 'md', showPulse = true }: OnlineDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <span className={cn('relative inline-flex', sizeClasses[size])}>
      <span 
        className={cn(
          'absolute inset-0 rounded-full',
          online ? 'bg-online' : 'bg-offline'
        )} 
      />
      {online && showPulse && (
        <span className={cn(
          'absolute inset-0 rounded-full bg-online animate-ping opacity-75'
        )} />
      )}
    </span>
  )
}