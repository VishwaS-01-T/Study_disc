'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Clock, Eye, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import BuzzButton from './BuzzButton'
import DuelEndScreen from './DuelEndScreen'

type DuelState = 'waiting' | 'countdown' | 'question_active' | 'buzzed' | 'answer_revealed' | 'duel_ended'

interface Player {
  id: string
  username: string
  avatar_url?: string
  score: number
  buzzed?: boolean
}

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  topic?: string
  code_snippet?: string
  hint?: string
}

interface DuelArenaProps {
  opponent: Player
  questions: Question[]
  onComplete?: (results: { correct: number; wrong: number; avgTime: number }) => void
  show: boolean
}

export default function DuelArena({ 
  opponent, 
  questions, 
  onComplete,
  show 
}: DuelArenaProps) {
  const [state, setState] = useState<DuelState>('waiting')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [buzzLocked, setBuzzLocked] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [results, setResults] = useState<{ correct: boolean; time: number }[]>([])
  const [countdownValue, setCountdownValue] = useState(3)
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null)
  const [spectators] = useState(2)

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    if (!show) return
    
    setState('waiting')
    
    const connectTimer = setTimeout(() => {
      setState('countdown')
      startCountdown()
    }, 1500)

    return () => clearTimeout(connectTimer)
  }, [show])
  
  const startCountdown = useCallback(() => {
    let count = 3
    setCountdownValue(count)
    
    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdownValue(count)
      } else {
        clearInterval(interval)
        setState('question_active')
        startQuestionTimer()
      }
    }, 1000)
  }, [])
  
  const startQuestionTimer = useCallback(() => {
    setTimeLeft(30)
    setAnswerStartTime(Date.now())
  }, [])
  
  const handleBuzz = useCallback(() => {
    if (state !== 'question_active') return
    setBuzzLocked(true)
    setState('buzzed')
  }, [state])
  
  const handleAnswer = useCallback((index: number) => {
    if (state !== 'buzzed') return
    
    const isCorrect = index === currentQuestion.correct
    const timeMs = answerStartTime ? Date.now() - answerStartTime : 0
    const timeSec = timeMs / 1000
    
    setSelectedAnswer(index)
    setState('answer_revealed')
    
    if (isCorrect) {
      setMyScore((prev) => prev + 1)
    }
    
    setResults((prev) => [...prev, { correct: isCorrect, time: timeSec }])
    
    setTimeout(() => {
      nextQuestion()
    }, 2500)
  }, [state, currentQuestion, answerStartTime])
  
  const handleTimeout = useCallback(() => {
    setState('answer_revealed')
    setSelectedAnswer(-1)
    setResults((prev) => [...prev, { correct: false, time: 30 }])
  }, [])
  
  const nextQuestion = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      setState('duel_ended')
      if (onComplete) {
        const correct = results.filter(r => r.correct).length
        const avgTime = results.reduce((a, b) => a + b.time, 0) / results.length
        onComplete({ correct, wrong: results.length - correct, avgTime })
      }
      return
    }
    
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setBuzzLocked(false)
    setShowHint(false)
    setState('question_active')
    startQuestionTimer()
  }, [currentIndex, questions.length, results, onComplete, startQuestionTimer])

  if (!show) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      {state === 'waiting' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-accent" />
          </div>
          <p className="text-xl text-text">Waiting for {opponent.username} to connect...</p>
        </div>
      )}
      
      {state === 'countdown' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-display text-9xl font-bold text-accent animate-[count-up_300ms_ease-out]">
            {countdownValue === 0 ? 'GO!' : countdownValue}
          </p>
        </div>
      )}
      
      {['question_active', 'buzzed', 'answer_revealed'].includes(state) && currentQuestion && (
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                You
              </div>
              <div className="space-y-1">
                <div className="font-display text-xl font-bold text-text">
                  {myScore} <span className="text-text3">/ {questions.length}</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(questions.length)].map((_, i) => (
                    <span key={i} className={cn(
                      'w-2 h-2 rounded-full',
                      i < results.length ? (results[i].correct ? 'bg-success' : 'bg-danger') : 'bg-surface2'
                    )} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="font-display text-xl text-text2">Q{currentIndex + 1}/{questions.length}</div>
            
            <div className="flex items-center gap-4">
              <div className="font-display text-xl font-bold text-accent">
                {opponentScore} <span className="text-text3">/ {questions.length}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {opponent.username[0].toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-text3 text-sm mb-4">
            <Eye className="w-4 h-4" />
            {spectators} watching
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="mb-6">
                {currentQuestion.topic && (
                  <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                    {currentQuestion.topic}
                  </span>
                )}
              </div>
              
              <p className="text-xl text-text font-mono text-center mb-8">
                {currentQuestion.text}
              </p>
              
              {currentQuestion.code_snippet && (
                <pre className="p-4 bg-surface rounded-xl text-sm font-mono text-text overflow-x-auto mb-6">
                  {currentQuestion.code_snippet}
                </pre>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={state !== 'buzzed'}
                    className={cn(
                      'p-4 rounded-xl text-left border transition-all',
                      state === 'answer_revealed' && index === currentQuestion.correct && 'bg-success/20 border-success',
                      state === 'answer_revealed' && index === selectedAnswer && index !== currentQuestion.correct && 'bg-danger/20 border-danger',
                      state === 'buzzed' && 'hover:border-accent cursor-pointer',
                      state !== 'buzzed' && 'cursor-default'
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-mono',
                      state === 'answer_revealed' && index === currentQuestion.correct && 'bg-success text-white',
                      state === 'answer_revealed' && index === selectedAnswer && index !== currentQuestion.correct && 'bg-danger text-white',
                      state !== 'answer_revealed' && 'bg-surface text-text'
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-text ml-3">{option}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <BuzzButton 
                  active={state === 'question_active'} 
                  onClick={handleBuzz}
                  disabled={state !== 'question_active'}
                />
                
                {state === 'buzzed' && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-surface2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-danger transition-all"
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      />
                    </div>
                    <span className="text-danger font-mono text-sm">{timeLeft}s</span>
                  </div>
                )}
                
                {state === 'question_active' && (
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-text3 hover:text-warning transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Hint (-5s)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
         
          {state === 'answer_revealed' && (
            <div className="p-4 bg-surface border border-border rounded-xl">
              <p className="text-text text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      )}
      
      {state === 'duel_ended' && (
        <DuelEndScreen
          myScore={myScore}
          opponentScore={opponentScore}
          opponentName={opponent.username}
          results={results}
        />
      )}
    </div>
  )
}