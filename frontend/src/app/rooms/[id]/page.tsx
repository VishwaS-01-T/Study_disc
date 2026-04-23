'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AuthLayout from '@/components/layout/AuthLayout'
import RoomHeader from '@/components/rooms/RoomHeader'
import ChatPanel from '@/components/rooms/ChatPanel'
import QuizPanel from '@/components/rooms/QuizPanel'
import MembersPanel from '@/components/rooms/MembersPanel'
import DuelArena from '@/components/duel/DuelArena'

interface Room {
  id: string
  name: string
  emoji: string
  topic?: string
  member_count?: number
  online_count?: number
}

interface User {
  id: string
  username: string
  avatar_url: string | null
  level: number
}

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  username?: string
}

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  topic?: string
}

export default function RoomPage() {
  const params = useParams()
  const roomId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showDuel, setShowDuel] = useState(false)
  
  const user: User = {
    id: '1',
    username: 'DemoUser',
    avatar_url: null,
    level: 5,
  }
  
  const questions: Question[] = [
    { id: '1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correct: 1, explanation: 'Binary search divides the search space in half each iteration, resulting in O(log n) time complexity.', topic: 'Algorithms' },
    { id: '2', text: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct: 1, explanation: 'Stack follows Last In First Out (LIFO) principle.', topic: 'Data Structures' },
    { id: '3', text: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Only Memory', 'Run Anywhere Memory', 'Rapid Access Module'], correct: 0, explanation: 'RAM stands for Random Access Memory.', topic: 'Computer Architecture' },
    { id: '4', text: 'Which sorting algorithm is fastest on average?', options: ['Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort'], correct: 1, explanation: 'Quick Sort has O(n log n) average time complexity.', topic: 'Algorithms' },
    { id: '5', text: 'What is the base case in recursion?', options: ['The first call', 'The smallest problem', 'The recursive call', 'The return value'], correct: 1, explanation: 'Base case is the smallest problem that can be solved directly without further recursion.', topic: 'Recursion' },
  ]

  useEffect(() => {
    setTimeout(() => {
      setRoom({
        id: roomId,
        name: 'DSA Practice',
        emoji: '📚',
        topic: 'Data Structures & Algorithms',
        member_count: 5,
        online_count: 3,
      })
      setMessages([
        { id: '1', user_id: 'other', content: 'Hey everyone! Ready to study?', created_at: new Date(Date.now() - 3600000).toISOString(), username: 'Raj' },
        { id: '2', user_id: 'me', content: 'Yeah lets go!', created_at: new Date(Date.now() - 3000000).toISOString(), username: 'You' },
        { id: '3', user_id: 'other', content: 'Should we do some quiz practice?', created_at: new Date(Date.now() - 1800000).toISOString(), username: 'Priya' },
      ])
      setLoading(false)
    }, 300)
  }, [roomId])

  const handleSendMessage = (content: string) => {
    setMessages([...messages, {
      id: crypto.randomUUID(),
      user_id: 'me',
      content,
      created_at: new Date().toISOString(),
      username: user.username,
    }])
  }

  if (loading || !room) {
    return (
      <AuthLayout user={user}>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-surface rounded-xl"></div>
          <div className="h-96 bg-surface rounded-xl"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout user={user}>
      <div className="flex flex-col h-[calc(100vh-56px)] -m-4">
        <RoomHeader room={room} />
        
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="flex-1 p-4">
            <QuizPanel roomId={roomId} />
          </div>
          <div className="w-full md:w-[300px] p-4">
            <ChatPanel 
              messages={messages}
              onSend={handleSendMessage}
              currentUserId={user.id}
              currentUsername={user.username}
            />
          </div>
          <div className="w-full md:w-[240px] p-4">
            <MembersPanel />
          </div>
        </div>
      </div>
      
      <DuelArena
        show={showDuel}
        opponent={{ id: '2', username: 'Raj', score: 0 }}
        questions={questions}
        onComplete={(results) => {
          console.log('Duel complete:', results)
          setShowDuel(false)
        }}
      />
    </AuthLayout>
  )
}