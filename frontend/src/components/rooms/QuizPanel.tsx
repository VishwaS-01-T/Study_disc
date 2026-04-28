'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, FileText, Upload, Swords, Clock, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  topic?: string
  question_type?: string
}

interface Quiz {
  id: string
  title: string
  question_count: number
  type: string
  created_at: string
  questions?: Question[]
}

interface QuizPanelProps {
  quizzes?: Quiz[]
  onGenerate?: (sourceText: string, topic: string) => Promise<void>
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
  const [error, setError] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes)
  const [loading, setLoading] = useState(!initialQuizzes.length)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileLoaded, setFileLoaded] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete quiz')
      }
      setQuizzes(prev => prev.filter(q => q.id !== quizId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz')
    }
  }

  useEffect(() => {
    if (!roomId || initialQuizzes.length > 0) return
    
    const fetchQuizzes = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/quizzes?roomId=${roomId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.quizzes?.length > 0) {
            setQuizzes(data.quizzes)
          }
        }
      } catch (err) {
        console.error('Failed to fetch quizzes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [roomId, initialQuizzes.length, BACKEND_URL])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!roomId) {
      setError('No room selected')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('topic', topic || file.name.replace(/\.[^/.]+$/, ''))

      const res = await fetch(`${BACKEND_URL}/api/quizzes/generate-from-file`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process file')
      }

      const newQuiz: Quiz = {
        id: data.quiz?.id || crypto.randomUUID(),
        title: data.quiz?.title || file.name.replace(/\.[^/.]+$/, ''),
        question_count: data.questions?.length || 10,
        type: 'generated',
        created_at: data.quiz?.created_at || new Date().toISOString(),
        questions: data.questions
      }

      setQuizzes(prev => [newQuiz, ...prev])
      setShowGen(false)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('File processing timed out. Try a smaller file.')
      } else {
        setError(err.message || 'Failed to process file')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePasteClick = () => {
    navigator.clipboard.readText().then(text => {
      if (text.trim()) {
        setSourceText(text)
      }
    }).catch(() => {
      setShowGen(true)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length === 0) return
    
    const file = files[0]
    await processFile(file)
  }

  const processFile = async (file: File) => {
    if (!roomId) {
      setError('No room selected')
      return
    }

    const validTypes = ['.pdf', '.txt', '.md', '.ppt', '.pptx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(ext)) {
      setError('Please upload PDF, TXT, or MD files')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const res = await fetch(`${BACKEND_URL}/api/quizzes/generate-from-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          topic: topic || file.name.replace(/\.[^/.]+$/, ''),
          roomId: roomId,
          extractOnly: true
        }),
        signal: AbortSignal.timeout(60000)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract file content')
      }

      if (!data.text || data.text.trim().length < 50) {
        throw new Error('File content too short. Need at least 50 characters.')
      }

      setSourceText(data.text)
      setFileName(file.name)
      setFileLoaded(true)
      setShowGen(true)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('File processing timed out. Try a smaller file.')
      } else {
        setError(err.message || 'Failed to read file')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!sourceText.trim()) return
    if (!onGenerate) {
      setError('Quiz generation is unavailable in this view.')
      return
    }
    
    if (sourceText.trim().length < 50) {
      setError('Please provide at least 50 characters of notes')
      return
    }
    
    setError(null)
    setGenerating(true)
    
    try {
      if (onGenerate) {
        await onGenerate(sourceText, topic)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setGenerating(false)
      setSourceText('')
      setTopic('')
      setShowGen(false)
    }
  }

  const handleDirectGenerate = async () => {
    if (!sourceText.trim()) return
    
    if (sourceText.trim().length < 50) {
      setError('Please provide at least 50 characters of notes')
      return
    }
    
    if (!roomId) {
      setError('No room selected')
      return
    }

    console.log('=== FRONTEND SENDING ===')
    console.log('Notes length:', sourceText.length)
    console.log('Notes preview:', sourceText.slice(0, 300))
    console.log('Topic:', topic || 'Quiz')
    console.log('=========================')
    
    setError(null)
    setGenerating(true)
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceText: sourceText,
          roomId: roomId,
          topic: topic || 'Quiz'
        }),
        signal: AbortSignal.timeout(30000)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz')
      }

      const newQuiz: Quiz = {
        id: data.quiz?.id || crypto.randomUUID(),
        title: data.quiz?.title || topic || 'Generated Quiz',
        question_count: data.questions?.length || 10,
        type: 'generated',
        created_at: data.quiz?.created_at || new Date().toISOString(),
        questions: data.questions
      }

      setQuizzes(prev => [newQuiz, ...prev])
      setSourceText('')
      setTopic('')
      setShowGen(false)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(err.message || 'Failed to generate quiz')
      }
    } finally {
      setGenerating(false)
    }
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
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                ${dragOver 
                  ? 'border-accent bg-accent/10' 
                  : 'border-border hover:border-accent/50'
                }
                ${uploading ? 'opacity-50 pointer-events-none' : ''}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <span className="text-sm text-text2">Processing file...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-text3" />
                  <span className="text-sm text-text2">
                    Drag & drop PDF, PPTX, TXT, or MD files here
                  </span>
                  <span className="text-xs text-text3">
                    or click to browse
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) processFile(file)
                }}
                className="hidden"
              />
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
            
            {fileLoaded && sourceText && (
              <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                ✓ {fileName} loaded — {sourceText.length} characters. Click "Generate Quiz" to create questions.
              </div>
            )}
            
            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {sourceText.length > 0 && (
              <div className="rounded-lg border border-border bg-bg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text2">Content for quiz generation:</p>
                  <p className="text-xs text-text3">{sourceText.length} chars</p>
                </div>
                <p className="text-xs text-text3 font-mono line-clamp-2">
                  {sourceText.slice(0, 150)}...
                </p>
              </div>
            )}
            
            <button
              onClick={handleDirectGenerate}
              disabled={!sourceText.trim() || generating || sourceText.trim().length < 50}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                '✨ Generate Quiz'
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-bg rounded-xl" />
            <div className="h-24 bg-bg rounded-xl" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-sm text-text3 text-center py-6">
            No quizzes yet. Generate one to get started.
          </div>
        ) : quizzes.map((quiz) => (
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
              
              <div className="flex gap-2 items-center">
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
                <button
                  title="Delete quiz"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="ml-2 p-2 rounded-lg hover:bg-danger/10 text-danger border border-transparent hover:border-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
