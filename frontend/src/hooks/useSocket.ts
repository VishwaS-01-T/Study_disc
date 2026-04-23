'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

let socketInstance: Socket | null = null

export function useSocket(token?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token || socketInstance?.connected) {
      if (socketInstance?.connected) {
        setSocket(socketInstance)
        setConnected(true)
      }
      return
    }

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
    })

    socketInstance.on('connect_error', () => {
      setConnected(false)
    })

    setSocket(socketInstance)

    return () => {
    }
  }, [token])

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data)
    }
  }, [])

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    if (socketInstance) {
      socketInstance.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (data: unknown) => void) => {
    if (socketInstance) {
      socketInstance.off(event, callback)
    }
  }, [])

  return { socket, connected, emit, on, off }
}