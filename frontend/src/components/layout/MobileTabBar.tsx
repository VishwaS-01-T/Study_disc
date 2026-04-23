'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, User, Brain, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/rooms/create', label: 'Create', icon: Plus, always: true },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/study-plan', label: 'Plan', icon: Brain },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface/90 backdrop-blur-xl border-t border-border md:hidden">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]',
                isActive ? 'text-accent' : 'text-text3'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}