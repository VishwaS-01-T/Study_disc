'use client'

import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('skeleton rounded-xl', className)} />
  )
}