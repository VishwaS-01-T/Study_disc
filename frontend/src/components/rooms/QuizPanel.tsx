'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Upload, Swords, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface Quiz {
  id: string
  title: string
  question_count: number
  type: string
  created_at: string
}

interface QuizPanelProps {
  quizzes?: Quiz[]
  onGenerate?: (sourceText: string, topic: string) => void
  roomId?: string
}

export default function QuizPanel({ 
  quizzes: initialQuizzes = [], 
  onGenerate,
  roomId 
}: QuizPanelProps) {
  const [sourceText, setSourceText] = useState('')
  const [topic, setTopic] = useState('')
  const [showGen, setShowGen] = useState(false)
  const [generating, setGenerating] = useState(false)

  const defaultQuizzes: Quiz[] = initialQuizzes.length > 0 ? initialQuizzes : [
    { id: '1', title: 'Binary Trees Quiz', question_count: 10, type: 'generated', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '2', title: 'Sorting Algorithms', question_count: 8, type: 'generated', created_at: new Date(Date.now() - 86400000).toISOString() },
  ]

  const handleGenerate = async () => {
    if (!sourceText.trim() || !onGenerate) return
    
    setGenerating(true)
    await onGenerate(sourceText, topic)
    setGenerating(false)
    setSourceText('')
    setTopic('')
    setShowGen(false)
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold text-text">Quizzes</h3>
          <button
            onClick={() => setShowGen(!showGen)}
            className="p-1.5 rounded-lg hover:bg-surface2 transition-colors"
          >
            <Plus className="w-4 h-4 text-accent" />
          </button>
        </div>
        
        {showGen && (
          <div className="space-y-3 p-3 bg-bg rounded-lg">
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-surface2 text-text2 text-sm rounded-lg hover:bg-border">
                <FileText className="w-4 h-4" />
                Paste notes
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-surface2 text-text2 text-sm rounded-lg hover:bg-border">
                <Upload className="w-4 h-4" />
                Upload PDF
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Topic (optional)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3"
            />
            
            <textarea
              placeholder="Paste your lecture notes or textbook content here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full h-32 bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3 resize-none"
            />
            
            <button
              onClick={handleGenerate}
              disabled={!sourceText.trim() || generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent2 disabled:opacity-50"
            >
              {generating ? 'Generating...' : '✨ Generate Quiz'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {defaultQuizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="p-4 bg-bg border border-border rounded-xl hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-text">{quiz.title}</h4>
                <p className="text-xs text-text3 mt-1">
                  {quiz.question_count} questions · {formatRelativeTime(quiz.created_at)}
                </p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                  {quiz.type === 'past_paper' ? 'Past Paper' : 'Generated'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/practice/${quiz.id}`}
                  className="px-3 py-1.5 bg-surface2 text-text text-sm rounded-lg hover:bg-border"
                >
                  Practice solo
                </Link>
                <Link
                  href={`/duel/${quiz.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent2"
                >
                  <Swords className="w-3 h-3" />
                  Challenge
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}