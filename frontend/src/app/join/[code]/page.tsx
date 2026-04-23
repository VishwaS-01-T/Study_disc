'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.code as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [room] = useState({
    name: 'Algorithms Study Group',
    topic: 'DSA & Algorithms',
    emoji: '🧮'
  })

  const joinRoom = () => {
    setLoading(true)
    setTimeout(() => {
      router.push(`/rooms/${inviteCode}`)
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="surface rounded-xl p-8 border border-border text-center">
          <span className="text-6xl mb-4 block">{room.emoji}</span>
          <h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
          <p className="text-gray-400 mb-6">{room.topic}</p>

          <div className="flex items-center justify-center gap-2 text-gray-500 mb-8">
            <Users className="w-4 h-4" />
            <span>Invite-only room</span>
          </div>

          <button
            onClick={joinRoom}
            className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/80 transition-colors"
          >
            Join Room
          </button>

          {error && (
            <p className="text-danger text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}