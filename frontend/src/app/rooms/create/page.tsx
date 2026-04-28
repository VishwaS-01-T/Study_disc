'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Users, BookOpen, MessageSquare } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'

const EMOJI_OPTIONS = ['📚', '💻', '🧮', '🔬', '🌐', '🎯', '🚀', '💡', '📝', '🎓']
const TOPIC_SUGGESTIONS = [
  'Data Structures & Algorithms',
  'Web Development',
  'Database Systems',
  'Operating Systems',
  'Computer Networks',
  'Machine Learning',
  'System Design',
  'Competitive Programming',
]

export default function CreateRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('📚')

  const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
  const user = userStr ? JSON.parse(userStr) : null

  const handleCreate = async () => {
    if (!name.trim() || !topic.trim()) {
      setError('Name and topic are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      
      const res = await fetch(`${backendUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          topic: topic.trim(),
          description: description.trim() || undefined,
          emoji,
          createdBy: user?.id,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create room')
      }

      const { room } = await res.json()
      router.push(`/rooms/${room.id}`)
    } catch (err) {
      setError('Failed to create room. Please try again.')
      setLoading(false)
    }
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
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-xl font-display font-bold text-text">Create a Study Room</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., DSA Cramers"
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Data Structures & Algorithms"
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOPIC_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="px-3 py-1 text-xs bg-surface2 text-text2 rounded-full hover:bg-border transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will this room focus on?"
                  rows={3}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Room Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 text-xl rounded-lg transition-all ${
                        emoji === e
                          ? 'bg-accent scale-110'
                          : 'bg-surface2 hover:bg-border'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-danger text-sm">{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={loading || !name.trim() || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Room
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