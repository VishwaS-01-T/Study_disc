'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Swords, Loader2, Users, Search } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'

interface User {
  id: string
  username: string
  avatar_url: string | null
  score: number
}

export default function ChallengeFriendPage() {
  const params = useParams()
  const router = useRouter()
  const friendId = params.friendId as string
  
  const [user, setUser] = useState<User | null>(null)
  const [friend, setFriend] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableFriends, setAvailableFriends] = useState<User[]>([])
  const [creating, setCreating] = useState(false)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (!userStr) {
      router.push('/login')
      return
    }
    const currentUser = JSON.parse(userStr)
    setUser(currentUser)

    const fetchData = async () => {
      try {
        const [userRes, friendsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/users/${currentUser.id}/friends`),
          fetch(`${BACKEND_URL}/api/users`),
        ])
        
        const friendsData = await friendsRes.json()
        const friends = (friendsData.users || []).filter((u: User) => u.id !== currentUser.id)
        setAvailableFriends(friends)

        if (friendId && friendId !== 'new') {
          const friendRes = await fetch(`${BACKEND_URL}/api/users/${friendId}`)
          if (friendRes.ok) {
            const friendData = await friendRes.json()
            setFriend(friendData.user)
          }
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [friendId, BACKEND_URL, router])

  const createDuel = async (opponentId: string) => {
    if (!user || !opponentId) return
    
    setCreating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/duels/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: null,
          challengerId: user.id,
          opponentId: opponentId,
          quizId: null,
          mode: 'live',
        }),
      })

      const data = await res.json()
      if (data.duel) {
        router.push(`/duel/${data.duel.id}`)
      } else {
        setError(data.error || 'Failed to create duel')
      }
    } catch (err) {
      setError('Failed to create duel')
    } finally {
      setCreating(false)
    }
  }

  const filteredFriends = availableFriends.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <p className="text-danger text-lg mb-4">{error}</p>
        <Link href="/dashboard" className="text-accent hover:underline">Go to dashboard</Link>
      </div>
    )
  }

  return (
    <AuthLayout user={user}>
      <div className="max-w-2xl mx-auto p-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-text2 hover:text-text mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Swords className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold text-text">Challenge a Friend</h1>
          </div>

          {friend ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-bg rounded-xl">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  {friend.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text">{friend.username}</p>
                  <p className="text-sm text-text3">Score: {friend.score || 0}</p>
                </div>
              </div>
              
              <button
                onClick={() => createDuel(friend.id)}
                disabled={creating}
                className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent2 disabled:opacity-50"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Start Duel'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2 text-text placeholder-text3"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFriends.length === 0 ? (
                  <p className="text-center text-text3 py-4">No users found</p>
                ) : (
                  filteredFriends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => createDuel(f.id)}
                      disabled={creating}
                      className="w-full flex items-center gap-3 p-3 bg-bg rounded-lg hover:bg-surface2 transition-colors disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                        {f.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-text font-medium">{f.username}</p>
                        <p className="text-xs text-text3">Score: {f.score || 0}</p>
                      </div>
                      <Swords className="w-4 h-4 text-accent" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}