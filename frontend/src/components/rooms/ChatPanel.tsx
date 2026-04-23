'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  username?: string
  avatar_url?: string
  isSystem?: boolean
}

interface ChatPanelProps {
  messages?: Message[]
  onSend?: (content: string) => void
  currentUserId?: string
  currentUsername?: string
}

export default function ChatPanel({ 
  messages: initialMessages = [], 
  onSend,
  currentUserId = 'me',
  currentUsername = 'You'
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !onSend) return
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      user_id: currentUserId,
      content: input,
      created_at: new Date().toISOString(),
      username: currentUsername,
    }
    
    setMessages([...messages, newMessage])
    onSend(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2',
              msg.isSystem && 'justify-center',
              msg.user_id === currentUserId && 'flex-row-reverse'
            )}
          >
            {msg.isSystem ? (
              <p className="text-text3 text-xs italic">{msg.content}</p>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                  {msg.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2',
                  msg.user_id === currentUserId
                    ? 'bg-accent text-white'
                    : 'bg-surface2 text-text'
                )}>
                  <p className="text-xs text-accent font-medium mb-1">{msg.username}</p>
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    msg.user_id === currentUserId ? 'text-white/60' : 'text-text3'
                  )}>
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-accent text-white rounded-lg hover:bg-accent2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}