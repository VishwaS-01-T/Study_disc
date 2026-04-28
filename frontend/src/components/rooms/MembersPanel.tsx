'use client'

import { useEffect, useState } from 'react'
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
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (initialMembers.length > 0) {
      setMembers(initialMembers)
      setResources(initialResources)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      const roomId = window.location.pathname.split('/').pop()
      if (!roomId) {
        setLoading(false)
        return
      }

      try {
        const [membersRes, resourcesRes] = await Promise.all([
          fetch(`${backendUrl}/api/rooms/${roomId}/members`),
          fetch(`${backendUrl}/api/rooms/${roomId}/resources`),
        ])
        const membersData = await membersRes.json()
        const resourcesData = await resourcesRes.json()
        setMembers(membersData.members || [])
        setResources(resourcesData.resources || [])
      } catch {
        setMembers([])
        setResources([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [initialMembers, initialResources])

  const topMembers = [...members].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)

  const handleAddResource = () => {
    if (resourceUrl.trim() && resourceLabel.trim()) {
      if (onAddResource) {
        onAddResource(resourceUrl, resourceLabel)
      }
      const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
      const user = userStr ? JSON.parse(userStr) : null
      const roomId = window.location.pathname.split('/').pop()
      if (user?.id && roomId) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
        fetch(`${backendUrl}/api/rooms/${roomId}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: resourceUrl, label: resourceLabel, userId: user.id }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.resource) setResources(prev => [data.resource, ...prev])
          })
          .catch(() => {})
      }
      setResourceUrl('')
      setResourceLabel('')
      setShowAddResource(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm font-semibold text-text">MEMBERS ({members.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-text3">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-sm text-text3">No members yet</div>
          ) : members.map((member) => (
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
            {resources.map((resource) => (
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
