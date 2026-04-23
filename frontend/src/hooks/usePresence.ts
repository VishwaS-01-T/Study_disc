'use client'

import { useState, useEffect, useCallback } from 'react'

interface PresenceData {
  userId: string
  online: boolean
  statusText?: string
  lastSeen?: string
}

export function usePresence(userIds: string[], socket?: ReturnType<typeof import('socket.io-client').io>) {
  const [presence, setPresence] = useState<Map<string, PresenceData>>(new Map())

  useEffect(() => {
    if (!socket) return

    const handlePresence = (data: { userId: string; online: boolean; statusText?: string }) => {
      setPresence((prev) => {
        const next = new Map(prev)
        next.set(data.userId, {
          userId: data.userId,
          online: data.online,
          statusText: data.statusText,
        })
        return next
      })
    }

    socket.on('room_presence', handlePresence)
    socket.on('friend_online', (data: { userId: string }) => {
      handlePresence({ ...data, online: true })
    })
    socket.on('friend_offline', (data: { userId: string }) => {
      handlePresence({ ...data, online: false })
    })

    return () => {
      socket.off('room_presence', handlePresence)
      socket.off('friend_online')
      socket.off('friend_offline')
    }
  }, [socket])

  const isOnline = useCallback((userId: string) => {
    return presence.get(userId)?.online ?? false
  }, [presence])

  const getStatus = useCallback((userId: string) => {
    return presence.get(userId)?.statusText ?? 'offline'
  }, [presence])

  return { presence, isOnline, getStatus }
}