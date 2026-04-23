'use client'

import { Swords, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Duel {
  id: string
  challenger: string
  quiz_title: string
  direction: 'incoming' | 'outgoing'
}

interface PendingDuelsProps {
  duels?: Duel[]
}

export default function PendingDuels({ duels = [] }: PendingDuelsProps) {
  const defaultDuels: Duel[] = duels.length > 0 ? duels : [
    { id: '1', challenger: 'Raj', quiz_title: 'DSA Quiz', direction: 'incoming' },
  ]

  if (defaultDuels.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
        Pending Duels
      </h3>
      
      <div className="space-y-2">
        {defaultDuels.map((duel) => (
          <div
            key={duel.id}
            className="p-3 bg-surface border border-border rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
                <Swords className="w-5 h-5 text-danger" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-text">
                  {duel.direction === 'incoming' ? (
                    <span><span className="font-semibold text-accent">{duel.challenger}</span> challenged you</span>
                  ) : (
                    <span>You challenged <span className="font-semibold">{duel.challenger}</span></span>
                  )}
                </p>
                <p className="text-xs text-text3">{duel.quiz_title}</p>
              </div>
            </div>
            
            {duel.direction === 'incoming' && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/80">
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface2 text-text text-sm font-medium rounded-lg hover:bg-border">
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}