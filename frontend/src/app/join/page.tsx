'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, Link2 } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
  const user = userStr ? JSON.parse(userStr) : null

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code')
      return
    }

    setLoading(true)
    setError('')

    router.push(`/join/${code.trim().toUpperCase()}`)
  }

  return (
    <AuthLayout user={user}>
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/dashboard" className="inline-flex items-center text-text2 hover:text-text mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Link>

          <div className="surface rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-6">
              <Link2 className="w-6 h-6 text-accent" />
              <span className="text-xl font-display font-bold text-text">Join a Room</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent font-mono text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <p className="text-danger text-sm">{error}</p>
              )}

              <button
                onClick={handleJoin}
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Room
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}