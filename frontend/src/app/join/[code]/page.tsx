'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  name: string
  topic: string
  emoji: string
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.code as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
        const res = await fetch(`${backendUrl}/api/rooms/code/${inviteCode}`)
        
        if (!res.ok) {
          setError('Room not found')
          return
        }
        
        const data = await res.json()
        setRoom(data.room)
      } catch (err) {
        setError('Failed to find room')
      } finally {
        setLoading(false)
      }
    }

    if (inviteCode) {
      fetchRoom()
    }
  }, [inviteCode])

  const handleJoin = () => {
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    setLoading(true)
    fetch(`${backendUrl}/api/rooms/${room?.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(() => router.push(`/rooms/${room?.id}`))
      .catch(() => router.push(`/rooms/${room?.id}`))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="surface rounded-xl p-8 border border-border text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Room Not Found</h1>
            <p className="text-gray-400 mb-6">This invite code doesn&apos;t exist or has expired.</p>
            <Link href="/dashboard" className="text-accent hover:underline">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
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
            onClick={handleJoin}
            className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/80 transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  )
}
