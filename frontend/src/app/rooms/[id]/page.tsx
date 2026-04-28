'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
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
  const [user, setUser] = useState<User | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  
  const questions: Question[] = []

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (!userStr) {
      window.location.href = '/login'
      return
    }
    const currentUser = JSON.parse(userStr)
    setUser(currentUser)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

    fetch(`${backendUrl}/api/rooms/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (data.room) {
          setRoom(data.room)
          if (currentUser?.id) {
            fetch(`${backendUrl}/api/rooms/${roomId}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id }),
            }).catch(() => {})
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`${backendUrl}/api/rooms/${roomId}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          // Sort messages by created_at ascending
          const sorted = data.messages.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          setMessages(sorted)
        }
      })
      .catch(() => setMessages([]))

    const newSocket = io(backendUrl, { transports: ['websocket'] })
    newSocket.emit('auth', currentUser.id)
    newSocket.emit('join:room', roomId)
    newSocket.on('chat:message', (msg: any) => {
      if (msg.roomId === roomId) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          user_id: msg.userId,
          content: msg.content,
          created_at: msg.created_at,
          username: msg.username,
        }])
      }
    })
    setSocket(newSocket)

    return () => {
      newSocket.emit('leave:room', roomId)
      newSocket.disconnect()
    }
  }, [roomId])

  const handleSendMessage = (content: string) => {
    if (!user) return
    socket?.emit('chat:message', { roomId, userId: user.id, content })
  }

  if (loading || !room || !user) {
    return (
      <AuthLayout user={user || null}>
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
