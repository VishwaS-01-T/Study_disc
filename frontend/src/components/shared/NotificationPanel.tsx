'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Check, Swords, UserPlus, Award, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface Notification {
  id: string
  type: 'challenge' | 'friend_request' | 'friend_online' | 'badge' | 'streak'
  title: string
  description?: string
  created_at: string
  read: boolean
  metadata?: Record<string, unknown>
}

interface NotificationPanelProps {
  onClose: () => void
  notifications?: Notification[]
}

export default function NotificationPanel({ onClose, notifications = [] }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications.length > 0 ? notifications : [
    { id: '1', type: 'challenge', title: 'Raj challenged you', description: 'DSA Quiz · 2min ago', created_at: new Date(Date.now() - 120000).toISOString(), read: false },
    { id: '2', type: 'friend_online', title: 'Priya came online', description: 'studying OS · just now', created_at: new Date().toISOString(), read: false },
    { id: '3', type: 'badge', title: 'Badge unlocked!', description: '"The Compiler" — 10 quizzes', created_at: new Date(Date.now() - 3600000).toISOString(), read: true },
    { id: '4', type: 'friend_request', title: 'Dev sent you a friend req', created_at: new Date(Date.now() - 86400000).toISOString(), read: true },
  ])

  const unreadCount = localNotifications.filter(n => !n.read).length

  const markAllRead = () => {
    setLocalNotifications(localNotifications.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'challenge': return <Swords className="w-4 h-4 text-danger" />
      case 'friend_online': return <UserPlus className="w-4 h-4 text-success" />
      case 'badge': return <Award className="w-4 h-4 text-warning" />
      case 'friend_request': return <UserPlus className="w-4 h-4 text-accent" />
      default: return <Bell className="w-4 h-4 text-text2" />
    }
  }

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-60 fade-in-up"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-text">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs text-accent hover:text-accent2"
          >
            Mark all read
          </button>
        )}
        <button onClick={onClose} className="p-1 hover:bg-surface2 rounded">
          <X className="w-4 h-4 text-text3" />
        </button>
      </div>
      
      <div className="divide-y divide-border">
        {localNotifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'p-3 hover:bg-surface2 transition-colors cursor-pointer',
              !notification.read && 'bg-accent/5'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', notification.read ? 'text-text2' : 'text-text')}>
                  {notification.title}
                </p>
                {notification.description && (
                  <p className="text-xs text-text3 mt-0.5">{notification.description}</p>
                )}
                <p className="text-xs text-text3 mt-1">
                  {formatRelativeTime(notification.created_at)}
                </p>
              </div>
              {!notification.read && (
                <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
            
            {notification.type === 'challenge' && !notification.read && (
              <div className="flex gap-2 mt-2 ml-7">
                <button className="flex-1 py-1.5 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/80">
                  Accept
                </button>
                <button className="flex-1 py-1.5 bg-surface2 text-text text-xs font-medium rounded-lg hover:bg-border">
                  Decline
                </button>
              </div>
            )}
            
            {notification.type === 'friend_request' && !notification.read && (
              <div className="flex gap-2 mt-2 ml-7">
                <button className="flex-1 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/80">
                  Accept
                </button>
                <button className="flex-1 py-1.5 bg-surface2 text-text text-xs font-medium rounded-lg hover:bg-border">
                  Ignore
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}