'use client'

import Link from 'next/link'
import { Sparkles, Zap, Swords, Flame, Brain, ArrowRight, Github } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Zap,
    title: 'AI Quiz Gen',
    description: 'Paste notes, get 10 MCQs instantly',
    color: 'text-accent',
  },
  {
    icon: Swords,
    title: 'Live 1v1 Duels',
    description: 'Challenge your squad in real time',
    color: 'text-danger',
  },
  {
    icon: Flame,
    title: 'Study Streaks',
    description: 'Stay accountable to your squad',
    color: 'text-warning',
  },
  {
    icon: Brain,
    title: 'Weak Area AI',
    description: 'Gemini finds your blindspots',
    color: 'text-success',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]" />
        
        <header className="relative z-10 flex items-center justify-between p-6">
          <span className="font-display text-2xl font-bold text-accent">StudyOS</span>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text hover:bg-surface2 transition-colors"
          >
            Sign in
          </Link>
        </header>

        <main className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center mb-16">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-text mb-6 tracking-tight">
              Study with your <span className="text-accent">squad.</span>
            </h1>
            <p className="text-xl text-text2 mb-8 max-w-xl mx-auto">
              AI quizzes. Live duels. Real accountability.
            </p>
            
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-semibold text-lg rounded-xl hover:bg-accent2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started with GitHub
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <p className="text-sm text-text3 mt-4">
              Invite-only. No strangers. No algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group p-6 bg-surface border border-border rounded-xl hover:border-border2 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className={cn('mb-4', feature.color)}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text2">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}