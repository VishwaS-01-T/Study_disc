'use client'

import { ReactNode, useEffect, useState } from 'react'
import TopNav from './TopNav'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'

interface User {
  id: string
  username: string
  avatar_url: string | null
  level: number
}

interface Room {
  id: string
  name: string
  emoji: string
  member_count?: number
  online_count?: number
}

interface AuthLayoutProps {
  children: ReactNode
  user?: User | null
  rooms?: Room[]
  unreadNotifications?: number
}

export default function AuthLayout({ 
  children, 
  user, 
  rooms = [], 
  unreadNotifications = 0 
}: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopNav user={user} unreadCount={unreadNotifications} />
      <Sidebar rooms={rooms} currentUserId={user?.id} />
      <MobileTabBar />
      
      <main className="md:pl-[220px] pt-14 pb-16 md:pb-0 min-h-screen">
        <div className="p-4 md:p-6 fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}