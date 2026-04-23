'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="p-6 bg-surface border border-border rounded-xl text-center max-w-md">
        <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-text mb-2">Something went wrong</h2>
        <p className="text-text2 text-sm mb-4">
          An error occurred while loading your dashboard.
        </p>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent2"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  )
}