'use client'

import Link from 'next/link'
import { Trophy, TrendingUp, Flame, Swords, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Result {
  correct: boolean
  time: number
}

interface DuelEndScreenProps {
  myScore: number
  opponentScore: number
  opponentName: string
  results: Result[]
}

export default function DuelEndScreen({
  myScore,
  opponentScore,
  opponentName,
  results,
}: DuelEndScreenProps) {
  const iWon = myScore > opponentScore
  const isTie = myScore === opponentScore
  const totalQuestions = results.length
  const correctCount = results.filter(r => r.correct).length
  const avgTime = results.reduce((a, b) => a + b.time, 0) / results.length

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className={cn(
        'w-full max-w-md text-center',
        iWon && 'animate-[count-up_300ms_ease-out]'
      )}>
        <div className={cn(
          'inline-flex items-center justify-center w-24 h-24 rounded-full mb-6',
          iWon ? 'bg-success/20' : 'bg-surface2'
        )}>
          <Trophy className={cn('w-12 h-12', iWon ? 'text-success' : 'text-text3')} />
        </div>
        
        <h2 className={cn(
          'font-display text-4xl font-bold mb-2',
          iWon ? 'text-success' : isTie ? 'text-text' : 'text-text2'
        )}>
          {iWon ? 'YOU WIN!' : isTie ? "IT'S A TIE!" : 'BETTER LUCK NEXT TIME'}
        </h2>
        
        <div className="flex items-center justify-center gap-8 mb-8">
          <div>
            <p className="font-display text-5xl font-bold text-text">{myScore}</p>
            <p className="text-text2 text-sm">You</p>
          </div>
          <span className="text-text3 text-2xl">—</span>
          <div>
            <p className="font-display text-5xl font-bold text-accent">{opponentScore}</p>
            <p className="text-text2 text-sm">{opponentName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-surface rounded-xl">
            <p className="font-display text-2xl font-bold text-accent">+{iWon ? 25 : 10}</p>
            <p className="text-text2 text-xs">XP</p>
          </div>
          <div className="p-4 bg-surface rounded-xl">
            <p className="font-display text-2xl font-bold text-success">+{iWon ? 1 : 0}</p>
            <p className="text-text2 text-xs">Win</p>
          </div>
          <div className="p-4 bg-surface rounded-xl">
            <p className="font-display text-2xl font-bold text-warning flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />13
            </p>
            <p className="text-text2 text-xs">Streak</p>
          </div>
        </div>
        
        <div className="p-4 bg-surface border border-border rounded-xl mb-8 text-left">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text2">Fastest answer</span>
            <span className="text-success">Q{results.reduce((min, r, i, arr) => r.time < arr[min].time ? i : min, 0) + 1} ({Math.min(...results.map(r => r.time)).toFixed(1)}s)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text2">Accuracy</span>
            <span className={cn(
              correctCount >= totalQuestions * 0.7 ? 'text-success' : 'text-danger'
            )}>
              {correctCount}/{totalQuestions} ({Math.round((correctCount / totalQuestions) * 100)}%)
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/rooms"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface2 text-text rounded-xl hover:bg-border transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to room
          </Link>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-xl hover:bg-accent2 transition-colors">
            <Swords className="w-4 h-4" />
            Rematch
          </button>
        </div>
      </div>
    </div>
  )
}