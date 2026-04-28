'use client'

import { useState } from 'react'
import { Calendar, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyQuestionProps {
  question?: {
    id: string
    text: string
    topic: string
  }
}

export default function DailyQuestion({ question }: DailyQuestionProps) {
  const [answered, setAnswered] = useState(false)
  const [locked, setLocked] = useState(false)

  const sampleQuestion = question || {
    id: '1',
    text: 'What is the worst-case time complexity of QuickSort when the pivot is always the first element?',
    topic: 'Algorithms',
  }

  return (
    <div className="p-4 bg-surface border border-border rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-accent uppercase">Today's Question</span>
      </div>
      
      <div className="mb-3">
        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
          {sampleQuestion.topic}
        </span>
      </div>
      
      <p className="text-text text-sm mb-4">
        {sampleQuestion.text}
      </p>
      
      {locked ? (
        <div className="flex items-center gap-2 text-text3 text-sm">
          <Lock className="w-4 h-4" />
          <span>Locked after answering</span>
        </div>
      ) : answered ? (
        <div className="text-success text-sm">
          Answered! Check back tomorrow.
        </div>
      ) : (
        <button
          onClick={() => {
            setAnswered(true)
            setLocked(true)
          }}
          className="flex items-center gap-2 text-accent text-sm font-medium hover:text-accent2"
        >
          <span>Answer now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
