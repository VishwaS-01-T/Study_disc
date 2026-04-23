'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  description?: string
  created_at: string
  read: boolean
  metadata?: Record<string, unknown>
}

export function useNotifications(socket?: ReturnType<typeof import('socket.io-client').io>) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!socket) return

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    socket.on('challenge_received', handleNotification)
    socket.on('friend_request_received', handleNotification)
    socket.on('friend_online', (data: { username: string }) => {
      handleNotification({
        id: crypto.randomUUID(),
        type: 'friend_online',
        title: `${data.username} came online`,
        created_at: new Date().toISOString(),
        read: false,
      })
    })
    socket.on('level_up', (data: { newLevel: number }) => {
      handleNotification({
        id: crypto.randomUUID(),
        type: 'level_up',
        title: `Level Up!`,
        description: `You are now Level ${data.newLevel}`,
        created_at: new Date().toISOString(),
        read: false,
      })
    })

    return () => {
      socket.off('challenge_received', handleNotification)
      socket.off('friend_request_received', handleNotification)
      socket.off('friend_online')
      socket.off('level_up')
    }
  }, [socket])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const remove = useCallback((notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter(n => n.id !== notificationId))
  }, [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
  }
}