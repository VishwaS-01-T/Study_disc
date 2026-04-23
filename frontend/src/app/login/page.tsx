'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Loader2, ArrowRight, Github } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      
      const res = await fetch(`${backendUrl}/api/auth/github`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const { url } = await res.json()
        router.push(url)
      } else {
        setError('GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET')
      }
    } catch (err) {
      setError('Failed to initiate login. Please try again.')
    }
    
    setLoading(false)
  }

  const handleJoin = () => {
    if (joinCode.trim()) {
      router.push(`/join/${joinCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-8">
          <span className="font-display text-4xl font-bold text-accent">StudyOS</span>
        </Link>
        
        <div className="surface rounded-2xl p-8 border border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-xl font-display font-bold text-text">Study Headquarters</span>
          </div>
          
          <p className="text-text2 text-center mb-8">
            Your squad's AI-powered study platform
          </p>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent2 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Github className="w-5 h-5" />
                Sign in with GitHub
              </>
            )}
          </button>
          
          {error && (
            <p className="text-danger text-sm mt-4 text-center">{error}</p>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-surface border border-border rounded-xl">
          <p className="text-text2 text-sm text-center mb-3">
            Have an invite code?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-text placeholder-text3 font-mono"
            />
            <Link
              href={`/join/${joinCode}`}
              onClick={handleJoin}
              className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent2 transition-colors"
            >
              Join room
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}