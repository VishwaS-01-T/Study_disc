'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import XPBar from './XPBar'

interface LevelUpOverlayProps {
  show: boolean
  newLevel: number
  currentXP: number
  maxXP: number
  onDismiss?: () => void
}

export default function LevelUpOverlay({ 
  show, 
  newLevel, 
  currentXP, 
  maxXP,
  onDismiss 
}: LevelUpOverlayProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        if (onDismiss) onDismiss()
        else setVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onDismiss])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm fade-in-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-6">
          <ArrowUp className="w-10 h-10 text-accent" />
        </div>
        
        <h2 className="font-display text-4xl font-bold text-accent mb-2">
          LEVEL UP!
        </h2>
        <p className="text-2xl font-display text-text mb-6">
          You are now <span className="text-accent">Level {newLevel}</span>
        </p>
        
        <div className="w-64 mx-auto mb-6">
          <XPBar currentXP={currentXP} maxXP={maxXP} level={newLevel} animate={true} />
        </div>
        
        <button
          onClick={onDismiss || (() => setVisible(false))}
          className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent/80 transition-colors"
        >
          Continue
        </button>
      </div>
      
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}