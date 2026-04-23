'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, Check, X, Clock, Trophy, Swords, Loader2, Target, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  topic: string
}

export default function DuelPage() {
  const params = useParams()
  const router = useRouter()
  const duelId = params.id as string
  const [state, setState] = useState<'lobby' | 'playing' | 'completed'>('lobby')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered')
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [buzzActive, setBuzzActive] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<{ correct: boolean }[]>([])

  const questions: Question[] = [
    { id: '1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correct: 1, topic: 'Algorithms' },
    { id: '2', text: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct: 1, topic: 'Data Structures' },
    { id: '3', text: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Only Memory', 'Run Anywhere Memory', 'Rapid Access Module'], correct: 0, topic: 'Computer Architecture' },
    { id: '4', text: 'Which sorting algorithm is fastest on average?', options: ['Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort'], correct: 1, topic: 'Algorithms' },
    { id: '5', text: 'What is the base case in recursion?', options: ['The first call', 'The smallest problem', 'The recursive call', 'The return value'], correct: 1, topic: 'Recursion' },
  ]

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    setTimeLeft(30)
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleTimeout = () => {
    if (selectedAnswer === null) {
      setAnswerState('incorrect')
      setShowFeedback(true)
      setResults([...results, { correct: false }])
      setTimeout(() => nextQuestion(), 1500)
    }
  }

  const handleAnswer = (index: number) => {
    if (answerState !== 'unanswered') return
    
    setSelectedAnswer(index)
    const isCorrect = index === questions[currentIndex].correct
    setAnswerState(isCorrect ? 'correct' : 'incorrect')
    setShowFeedback(true)
    
    if (isCorrect) setScore(score + 1)
    setResults([...results, { correct: isCorrect }])
    
    setTimeout(() => {
      nextQuestion()
    }, 1500)
  }

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      setState('completed')
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    
    setCurrentIndex(currentIndex + 1)
    setSelectedAnswer(null)
    setAnswerState('unanswered')
    setShowFeedback(false)
    startTimer()
  }

  const startQuiz = () => {
    setState('playing')
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    startTimer()
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-background">
      <header className="surface border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Practice Quiz</h1>
              <p className="text-gray-400 text-sm">
                {state === 'playing' && `Question ${currentIndex + 1} of ${questions.length}`}
                {state === 'completed' && 'Completed!'}
              </p>
            </div>
          </div>
          {state === 'playing' && (
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex items-center gap-2 text-xl font-bold font-quiz',
                timeLeft <= 10 ? 'text-danger' : 'text-white'
              )}>
                <Clock className="w-5 h-5" />
                {timeLeft}s
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Target className="w-5 h-5" />
                <span className="text-xl font-bold">{score}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {state === 'lobby' && (
          <div className="surface rounded-xl p-8 border border-border text-center">
            <Swords className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Practice?</h2>
            <p className="text-gray-400 mb-6">
              {questions.length} questions • 30 seconds each
            </p>
            <button
              onClick={startQuiz}
              className="bg-accent text-white font-semibold py-3 px-8 rounded-lg hover:bg-accent/80 transition-colors"
            >
              Start Quiz
            </button>
          </div>
        )}

        {state === 'playing' && currentQuestion && (
          <div className="space-y-6">
            <div className="surface rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-accent/20 text-accent rounded text-sm">
                  {currentQuestion.topic}
                </span>
              </div>
              
              <p className="text-lg text-white mb-4">{currentQuestion.text}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={answerState !== 'unanswered'}
                  className={cn(
                    'p-4 rounded-xl text-left transition-all border border-border hover:border-accent/50',
                    answerState !== 'unanswered' && index === currentQuestion.correct && 'bg-correct/20 border-correct',
                    answerState !== 'unanswered' && index === selectedAnswer && index !== currentQuestion.correct && 'bg-danger/20 border-danger'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-quiz',
                      answerState !== 'unanswered' && index === currentQuestion.correct && 'bg-correct text-white',
                      answerState !== 'unanswered' && index === selectedAnswer && index !== currentQuestion.correct && 'bg-danger text-white',
                      answerState === 'unanswered' && 'bg-background text-gray-400'
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-white">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setBuzzActive(!buzzActive)}
              className={cn(
                'BuzzButton flex items-center justify-center gap-2 w-full',
                buzzActive && 'active'
              )}
            >
              <Zap className="w-5 h-5" />
              BUZZ!
            </button>
          </div>
        )}

        {state === 'completed' && (
          <div className="surface rounded-xl p-8 border border-border text-center">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-4xl font-bold text-white mb-2">
              {score} / {questions.length}
            </p>
            <p className="text-gray-400 mb-6">
              {Math.round((score / questions.length) * 100)}% correct
            </p>
            
            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 py-3 border border-border rounded-lg text-gray-400 hover:text-white"
              >
                Back to Home
              </Link>
              <button
                onClick={startQuiz}
                className="flex-1 bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/80"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}