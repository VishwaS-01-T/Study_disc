'use client'

import SkeletonCard from '@/components/shared/SkeletonCard'

export default function Loading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
      <div className="space-y-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      
      <div className="space-y-4">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </div>
      
      <div className="space-y-4">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-56" />
        <SkeletonCard className="h-40" />
      </div>
    </div>
  )
}