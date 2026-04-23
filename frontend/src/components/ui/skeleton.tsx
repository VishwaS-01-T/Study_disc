import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-border rounded-md', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="surface rounded-xl p-6 border border-border">
      <Skeleton className="h-6 w-1/3 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-16 w-3/4 rounded-xl" />
      </div>
    </div>
  )
}

export function QuizCardSkeleton() {
  return (
    <div className="surface rounded-xl p-6 border border-border">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      ))}
    </div>
  )
}