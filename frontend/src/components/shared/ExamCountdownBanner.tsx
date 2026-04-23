'use client'

import { Calendar, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamCountdownBannerProps {
  examName: string
  examDate: Date
  onDismiss?: () => void
}

export default function ExamCountdownBanner({ examName, examDate, onDismiss }: ExamCountdownBannerProps) {
  const now = new Date()
  const diffMs = examDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  const isUrgent = diffDays <= 3
  const isWarning = diffDays <= 7

  return (
    <div className={cn(
      'relative p-3 rounded-xl border',
      isUrgent ? 'bg-danger/10 border-danger/30' : 
      isWarning ? 'bg-warning/10 border-warning/30' : 
      'bg-accent/10 border-accent/30'
    )}>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-surface2"
        >
          <X className="w-3 h-3 text-text3" />
        </button>
      )}
      
      <div className="flex items-center gap-3">
        <Calendar className={cn(
          'w-4 h-4',
          isUrgent ? 'text-danger' : isWarning ? 'text-warning' : 'text-accent'
        )} />
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{examName}</p>
          <p className={cn(
            'text-xs',
            isUrgent ? 'text-danger' : isWarning ? 'text-warning' : 'text-text2'
          )}>
            {diffDays} day{diffDays !== 1 ? 's' : ''} until exam
          </p>
        </div>
      </div>
    </div>
  )
}