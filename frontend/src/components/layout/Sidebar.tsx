'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Trophy, 
  User, 
  Brain, 
  Plus, 
  Link2, 
  Users,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  name: string
  emoji: string
  member_count?: number
  online_count?: number
}

interface SidebarProps {
  rooms?: Room[]
  currentUserId?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/study-plan', label: 'Study Plan', icon: Brain },
]

export default function Sidebar({ rooms = [], currentUserId }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-[220px] bg-surface border-r border-border z-40 hidden md:flex flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        {rooms.length > 0 && (
          <div className="px-3 mb-6">
            <h3 className="px-3 text-xs font-semibold text-text3 uppercase tracking-wider mb-2">
              Your Rooms
            </h3>
            <div className="space-y-1">
              {rooms.map((room) => {
                const isActive = pathname === `/rooms/${room.id}`
                return (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
                      isActive 
                        ? 'bg-accent/10 text-accent border-l-2 border-accent' 
                        : 'text-text2 hover:text-text hover:bg-surface2'
                    )}
                  >
                    <span className="text-lg">{room.emoji}</span>
                    <span className="flex-1 text-sm font-medium truncate">{room.name}</span>
                    {room.online_count !== undefined && room.online_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-online pulse-dot" />
                    )}
                  </Link>
                )
              })}
              <Link
                href="/rooms/create"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-text2 hover:text-text hover:bg-surface2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Create room</span>
              </Link>
              <Link
                href="/join"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-text2 hover:text-text hover:bg-surface2 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                <span className="text-sm">Join via code</span>
              </Link>
            </div>
          </div>
        )}

        <div className="px-3 mb-4">
          <h3 className="px-3 text-xs font-semibold text-text3 uppercase tracking-wider mb-2">
            Navigate
          </h3>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-text2 hover:text-text hover:bg-surface2'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 rounded-lg bg-surface2">
          <div className="flex items-center gap-2 text-warning">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold">13 days</span>
          </div>
          <div className="mt-1 h-1.5 bg-bg rounded-full overflow-hidden">
            <div className="h-full bg-warning" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-text3 mt-1">to next milestone</p>
        </div>
      </div>
    </aside>
  )
}