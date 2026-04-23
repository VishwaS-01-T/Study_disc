'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError('Authentication failed. Please try again.')
      return
    }

    const githubId = searchParams.get('githubId')
    const username = searchParams.get('username')
    const avatarUrl = searchParams.get('avatarUrl')
    const email = searchParams.get('email')

    if (!githubId) {
      setError('Invalid authentication data.')
      return
    }

    const signIn = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
        
        const res = await fetch(`${backendUrl}/api/users/ensure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            githubId,
            username: username || githubId,
            avatarUrl: avatarUrl || null,
          }),
        })

        const data = await res.json()
        
        if (!res.ok) {
          const errorStr = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error
          setError(errorStr || 'Failed to create user')
          return
        }

        const { user } = data
        
        sessionStorage.setItem('user', JSON.stringify(user))
        
        router.push('/dashboard')
      } catch (err) {
        console.error('Sign in error:', err)
        setError('Failed to sign in. Please try again.')
      }
    }

    signIn()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="text-danger text-lg mb-4">{error}</div>
        <a href="/login" className="text-accent hover:underline">
          Return to login
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="mt-4 text-text-secondary">Signing you in...</p>
    </div>
  )
}