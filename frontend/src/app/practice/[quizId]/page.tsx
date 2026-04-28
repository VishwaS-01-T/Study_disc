'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Clock, Check, X } from 'lucide-react'

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  topic: string
  question_type: string
  code_snippet?: string
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  type: string
  room_id: string
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`)
        if (!res.ok) {
          throw new Error('Quiz not found')
        }
        const data = await res.json()
        if (!data.quiz?.questions?.length) {
          throw new Error('This quiz has no questions yet.')
        }
        setQuiz(data.quiz)
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId, BACKEND_URL])

  useEffect(() => {
    if (!quiz || answered || finished || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, quiz, answered, finished])

  useEffect(() => {
    if (!quiz || answered || finished) return
    if (timeLeft === 0 && !answered) {
      handleAnswer(-1)
    }
  }, [timeLeft, quiz, answered, finished])

  useEffect(() => {
    if (!finished || !quiz) return
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    const user = userStr ? JSON.parse(userStr) : null
    if (!user?.id) return
    fetch(`${BACKEND_URL}/api/quizzes/${quiz.id}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        correct: score,
        total: quiz.questions.length,
        topic: quiz.questions[0]?.topic || 'General',
      }),
    }).catch(() => {})
  }, [finished, quiz, score, BACKEND_URL])

  const handleAnswer = (index: number) => {
    if (answered || !quiz) return
    if (index >= 0 && index >= quiz.questions[currentIndex].options.length) return
    setSelectedAnswer(index)
    setAnswered(true)
    if (index >= 0 && index === quiz.questions[currentIndex].correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (!quiz) return
    if (currentIndex + 1 >= quiz.questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setAnswered(false)
      setTimeLeft(30)
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setScore(0)
    setFinished(false)
    setAnswered(false)
    setSelectedAnswer(null)
    setTimeLeft(30)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <p className="text-danger text-lg mb-4">{error || 'Quiz not found'}</p>
        <Link href="/dashboard" className="text-accent hover:underline">
          Go to dashboard
        </Link>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentIndex]
  const progress = ((currentIndex) / quiz.questions.length) * 100

  if (finished) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{percentage >= 70 ? '🏆' : '📚'}</div>
          <h2 className="text-2xl font-bold text-text mb-2">
            {percentage >= 70 ? 'Great job!' : 'Keep practicing!'}
          </h2>
          <p className="text-text2 mb-4">
            You scored <span className="text-accent font-bold">{score}</span> out of{' '}
            <span className="text-accent font-bold">{quiz.questions.length}</span>
          </p>
          <div className="w-full bg-surface2 rounded-full h-2 mb-6">
            <div
              className="bg-success h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-2 border border-border text-text rounded-lg hover:bg-surface2"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent2"
            >
              Back to room
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-text2 hover:text-text flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-text2 text-sm">
            {currentIndex + 1} / {quiz.questions.length}
          </span>
        </div>

        <div className="w-full bg-surface2 rounded-full h-1.5">
          <div
            className="bg-accent h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={`text-center text-3xl font-bold ${timeLeft <= 10 ? 'text-danger' : 'text-text'}`}>
          ⏱ {timeLeft}s
        </div>

        <div className="surface border border-border rounded-xl p-6 space-y-4">
          <div className="text-xs text-accent font-medium uppercase">
            {currentQuestion.topic}
          </div>

          {currentQuestion.code_snippet && (
            <pre className="bg-bg border border-border rounded-lg p-4 text-sm text-text font-mono overflow-x-auto">
              {currentQuestion.code_snippet}
            </pre>
          )}

          <p className="text-text text-lg">{currentQuestion.text}</p>

          <div className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              let style = 'border-border text-text hover:border-accent'
              if (answered) {
                if (i === currentQuestion.correct) style = 'border-success bg-success/10 text-success'
                else if (i === selectedAnswer) style = 'border-danger bg-danger/10 text-danger'
                else style = 'border-border text-text3'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${style} disabled:cursor-default`}
                >
                  <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                  {option}
                </button>
              )
            })}
          </div>

          {answered && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-bg border border-border rounded-xl">
              <p className="text-xs text-text2 uppercase mb-1">Explanation</p>
              <p className="text-sm text-text">{currentQuestion.explanation}</p>
            </div>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-3 mt-2 rounded-xl bg-accent text-white hover:bg-accent2 transition-colors font-medium"
            >
              {currentIndex + 1 >= quiz.questions.length ? 'See results →' : 'Next question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
