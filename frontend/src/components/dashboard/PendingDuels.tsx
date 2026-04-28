'use client'

import { useEffect, useState } from 'react'
import { Swords, Check, X } from 'lucide-react'

interface Duel {
  id: string
  challenger: string
  quiz_title: string
  direction: 'incoming' | 'outgoing'
}

interface PendingDuelsProps {
  duels?: Duel[]
  onAccept?: (duelId: string) => void
  onDecline?: (duelId: string) => void
}

export default function PendingDuels({ duels = [], onAccept, onDecline }: PendingDuelsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Duel[]>(duels)

  const [processedDuels, setProcessedDuels] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (duels.length > 0) return
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (!userStr) return
    const user = JSON.parse(userStr)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    setLoading(true)
    fetch(`${backendUrl}/api/duels/pending/${user.id}`)
      .then(res => res.json())
      .then(data => setPending(data.duels || []))
      .catch(() => setError('Failed to load duels'))
      .finally(() => setLoading(false))
  }, [duels.length])

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">Pending Duels</h3>
        <p className="text-sm text-text3">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">Pending Duels</h3>
        <p className="text-sm text-danger">{error}</p>
      </div>
    )
  }

  if (pending.length === 0) return null

  const handleAccept = async (duelId: string) => {
    setProcessedDuels(prev => new Set(prev).add(duelId))
    if (onAccept) {
      onAccept(duelId)
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    fetch(`${backendUrl}/api/duels/${duelId}/accept`, { method: 'POST' }).catch(() => {})
  }

  const handleDecline = async (duelId: string) => {
    setProcessedDuels(prev => new Set(prev).add(duelId))
    if (onDecline) {
      onDecline(duelId)
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    fetch(`${backendUrl}/api/duels/${duelId}/decline`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text3 uppercase tracking-wider">
        Pending Duels
      </h3>
      
      <div className="space-y-2">
        {pending.map((duel) => (
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
            
            {duel.direction === 'incoming' && !processedDuels.has(duel.id) && (
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleAccept(duel.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/80"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button 
                  onClick={() => handleDecline(duel.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface2 text-text text-sm font-medium rounded-lg hover:bg-border"
                >
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
