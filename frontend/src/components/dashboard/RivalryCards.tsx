'use client'

import { Swords, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Rival {
  id: string
  username: string
  wins: number
  losses: number
}

interface RivalryCardsProps {
  rivals?: Rival[]
}

export default function RivalryCards({ rivals = [] }: RivalryCardsProps) {
  const defaultRivals: Rival[] = rivals.length > 0 ? rivals : [
    { id: '1', username: 'Raj', wins: 5, losses: 3 },
    { id: '2', username: 'Priya', wins: 3, losses: 5 },
    { id: '3', username: 'Dev', wins: 2, losses: 4 },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
        Rivals
      </h3>
      
      <div className="space-y-2">
        {defaultRivals.map((rival) => {
          const winsOver = rival.wins
          const lossesTo = rival.losses
          const leading = winsOver > lossesTo
          
          return (
            <div
              key={rival.id}
              className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl"
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                leading ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
              )}>
                {rival.username[0].toUpperCase()}
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-text font-medium">{rival.username}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-success flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {winsOver}W
                  </span>
                  <span className="text-text3">-</span>
                  <span className="text-danger flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    {lossesTo}L
                  </span>
                </div>
              </div>
              
              <button className="p-2 rounded-lg hover:bg-surface2 transition-colors">
                <Swords className="w-4 h-4 text-accent" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}