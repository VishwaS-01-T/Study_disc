import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json()
    
    if (!user?.email) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', user.email)
      .single()

    if (existingUser) {
      await supabase
        .from('users')
        .update({
          last_active: new Date().toISOString().split('T')[0],
        })
        .eq('id', existingUser.id)

      return NextResponse.json({ user: existingUser })
    }

    const username = user.name || user.email.split('@')[0]
    const avatarUrl = user.image || null

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        github_id: user.email,
        username,
        avatar_url: avatarUrl,
        score: 0,
        weekly_score: 0,
        streak: 0,
        xp: 0,
        level: 1,
        last_active: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
  }
}