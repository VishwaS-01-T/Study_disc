'use client'

import { useState, useEffect, useCallback } from 'react'

type DuelState = 'idle' | 'waiting' | 'countdown' | 'question_active' | 'buzzed' | 'answer_revealed' | 'duel_ended'

interface Duel {
  id: string
  challenger_id: string
  opponent_id: string
  quiz_id: string
  status: 'pending' | 'active' | 'completed'
  score_challenger: number
  score_opponent: number
}

export function useDuel(socket?: ReturnType<typeof import('socket.io-client').io>) {
  const [duelState, setDuelState] = useState<DuelState>('idle')
  const [duel, setDuel] = useState<Duel | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [buzzed, setBuzzed] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleDuelStarted = (data: { duel: Duel }) => {
      setDuel(data.duel)
      setDuelState('waiting')
    }

    const handleCountdown = () => {
      setDuelState('countdown')
    }

    const handleQuestion = (data: { questionIndex: number }) => {
      setCurrentQuestion(data.questionIndex)
      setBuzzed(false)
      if (duelState === 'countdown') {
        setDuelState('question_active')
      }
    }

    const handleBuzzLocked = (data: { userId: string }) => {
      setBuzzed(true)
      setDuelState('buzzed')
    }

    const handleAnswerResult = (data: { challengerScore: number; opponentScore: number }) => {
      setMyScore(data.challengerScore)
      setOpponentScore(data.opponentScore)
      setDuelState('answer_revealed')
    }

    const handleDuelEnded = (data: { duel: Duel }) => {
      setDuel(data.duel)
      setMyScore(data.duel.score_challenger)
      setOpponentScore(data.duel.score_opponent)
      setDuelState('duel_ended')
    }

    socket.on('duel_started', handleDuelStarted)
    socket.on('duel_countdown', handleCountdown)
    socket.on('duel_question', handleQuestion)
    socket.on('buzz_locked', handleBuzzLocked)
    socket.on('answer_result', handleAnswerResult)
    socket.on('duel_ended', handleDuelEnded)

    return () => {
      socket.off('duel_started', handleDuelStarted)
      socket.off('duel_countdown', handleCountdown)
      socket.off('duel_question', handleQuestion)
      socket.off('buzz_locked', handleBuzzLocked)
      socket.off('answer_result', handleAnswerResult)
      socket.off('duel_ended', handleDuelEnded)
    }
  }, [socket, duelState])

  const respondChallenge = useCallback((duelId: string, accept: boolean) => {
    if (socket?.connected) {
      socket.emit('respond_challenge', { duel_id: duelId, accept })
    }
  }, [socket])

  const buzz = useCallback(() => {
    if (socket?.connected && duelState === 'question_active') {
      socket.emit('player_buzz')
    }
  }, [socket, duelState])

  const submitAnswer = useCallback((answerIndex: number) => {
    if (socket?.connected && duelState === 'buzzed') {
      socket.emit('submit_answer', { answer: answerIndex })
    }
  }, [socket, duelState])

  const reset = useCallback(() => {
    setDuelState('idle')
    setDuel(null)
    setMyScore(0)
    setOpponentScore(0)
    setCurrentQuestion(0)
    setBuzzed(false)
  }, [])

  return {
    duelState,
    duel,
    myScore,
    opponentScore,
    currentQuestion,
    buzzed,
    respondChallenge,
    buzz,
    submitAnswer,
    reset,
  }
}