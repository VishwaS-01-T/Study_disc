'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Target, Zap, Loader2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanDay {
  date: string
  topics: string[]
  task: string
  estimated_minutes: number
}

export default function StudyPlanPage() {
  const [topics, setTopics] = useState<string[]>(['Algorithms', 'Data Structures'])
  const [newTopic, setNewTopic] = useState('')
  const [examDate, setExamDate] = useState('')
  const [weakAreas, setWeakAreas] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<PlanDay[]>([])
  const [error, setError] = useState('')

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()])
      setNewTopic('')
    }
  }

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic))
  }

  const generatePlan = async () => {
    if (!examDate || topics.length === 0) {
      setError('Please add topics and exam date')
      return
    }

    setLoading(true)
    setError('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      const res = await fetch(`${backendUrl}/api/study-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          examDate,
          weakAreas,
          days: 14,
        }),
      })

      const data = await res.json()

      if (data.plan) {
        setPlan(data.plan)
      } else {
        setError(data.error || 'Failed to generate plan')
      }
    } catch (err) {
      setError('Failed to connect to server')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="surface border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Study Planner</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="surface rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-white mb-4">Create Study Plan</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Topics</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm"
                  >
                    {topic}
                    <button onClick={() => removeTopic(topic)} className="hover:text-danger">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add topic..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-white placeholder-gray-500"
                />
                <button
                  onClick={addTopic}
                  className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Weak Areas (optional)</label>
              <input
                type="text"
                placeholder="e.g., Recursion, Trees"
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <button
              onClick={generatePlan}
              disabled={loading || topics.length === 0 || !examDate}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/80 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Generate 14-Day Plan
                </>
              )}
            </button>

            {error && <p className="text-danger text-sm">{error}</p>}
          </div>
        </div>

        {plan.length > 0 && (
          <div className="surface rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-white mb-4">Your Study Plan</h2>
            <div className="space-y-3">
              {plan.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-background rounded-lg"
                >
                  <div className="text-2xl font-quiz text-gray-500">{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-accent text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      {day.date}
                    </div>
                    <p className="text-white font-medium">{day.task}</p>
                    <div className="flex gap-2 mt-1">
                      {day.topics.map((topic) => (
                        <span key={topic} className="text-gray-500 text-sm">{topic}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    {day.estimated_minutes}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}