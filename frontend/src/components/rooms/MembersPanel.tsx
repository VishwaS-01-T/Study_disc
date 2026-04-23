'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, Link as LinkIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import OnlineDot from '@/components/shared/OnlineDot'

interface Member {
  id: string
  username: string
  avatar_url?: string
  online?: boolean
  status?: string
  score?: number
}

interface Resource {
  id: string
  url: string
  label: string
  upvotes: number
}

interface MembersPanelProps {
  members?: Member[]
  resources?: Resource[]
  onAddResource?: (url: string, label: string) => void
}

export default function MembersPanel({ 
  members: initialMembers = [], 
  resources: initialResources = [],
  onAddResource
}: MembersPanelProps) {
  const [showAddResource, setShowAddResource] = useState(false)
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceLabel, setResourceLabel] = useState('')

  const defaultMembers: Member[] = initialMembers.length > 0 ? initialMembers : [
    { id: '1', username: 'Raj', online: true, status: 'studying', score: 450 },
    { id: '2', username: 'Priya', online: true, status: 'active', score: 380 },
    { id: '3', username: 'Dev', online: false, status: 'offline', score: 290 },
    { id: '4', username: 'You', online: true, status: 'active', score: 1250 },
  ]

  const defaultResources: Resource[] = initialResources.length > 0 ? initialResources : [
    { id: '1', url: 'https://leetcode.com', label: 'LeetCode', upvotes: 5 },
    { id: '2', url: 'https://geeksforgeeks.org', label: 'GFG', upvotes: 3 },
  ]

  const topMembers = [...defaultMembers].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)

  const handleAddResource = () => {
    if (resourceUrl.trim() && onAddResource) {
      onAddResource(resourceUrl, resourceLabel)
      setResourceUrl('')
      setResourceLabel('')
      setShowAddResource(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm font-semibold text-text">MEMBERS ({defaultMembers.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-2">
          {defaultMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 transition-colors"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                  {member.username[0].toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineDot online={member.online} size="sm" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{member.username}</p>
                <p className="text-xs text-text3 truncate">{member.status}</p>
              </div>
              {member.score !== undefined && (
                <span className="text-xs text-accent font-mono">{member.score}</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-semibold text-text3 uppercase mb-2">Room Score</h4>
          <div className="space-y-2">
            {topMembers.map((member, index) => (
              <div key={member.id} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-text3">#{index + 1}</span>
                <span className="flex-1 text-text truncate">{member.username}</span>
                <span className="text-accent font-mono">{member.score || 0}</span>
              </div>
            ))}
          </div>
          <Link href="/leaderboard" className="text-xs text-accent mt-2 inline-block">
            See all →
          </Link>
        </div>
        
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text3 uppercase">Resources</h4>
            <button 
              onClick={() => setShowAddResource(!showAddResource)}
              className="p-1 hover:bg-surface2 rounded"
            >
              <Plus className="w-3 h-3 text-accent" />
            </button>
          </div>
          
          {showAddResource && (
            <div className="space-y-2 mb-3 p-2 bg-bg rounded-lg">
              <input
                type="text"
                placeholder="URL"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                className="w-full bg-surface2 border border-border rounded px-2 py-1 text-text text-xs"
              />
              <input
                type="text"
                placeholder="Label"
                value={resourceLabel}
                onChange={(e) => setResourceLabel(e.target.value)}
                className="w-full bg-surface2 border border-border rounded px-2 py-1 text-text text-xs"
              />
              <button
                onClick={handleAddResource}
                className="w-full py-1 bg-accent text-white text-xs rounded"
              >
                Add
              </button>
            </div>
          )}
          
          <div className="space-y-2">
            {defaultResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-bg rounded-lg hover:bg-surface2"
              >
                <LinkIcon className="w-3 h-3 text-accent" />
                <span className="flex-1 text-xs text-text truncate">{resource.label}</span>
                <span className="text-xs text-text3">↑{resource.upvotes}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}