import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { db } from './db.js'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

interface AuthenticatedSocket {
  userId?: string
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = db.users.findById(id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = db.rooms.findAll().slice(0, 20)
    res.json({ rooms })
  } catch (error) {
    console.error('Get rooms error:', error)
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

app.post('/api/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' })
  }
  
  const scope = 'read:user user:email'
  const state = uuidv4()
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(FRONTEND_URL + '/api/auth/callback/github')}&scope=${encodeURIComponent(scope)}&state=${state}`
  res.json({ url: authUrl })
})

app.get('/api/auth/github/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!code || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.redirect(FRONTEND_URL + '/login?error=oauth_failed')
  }
  
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      return res.redirect(FRONTEND_URL + '/login?error=oauth_failed')
    }
    
    const accessToken = tokenData.access_token
    
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    
    const userData = await userResponse.json()
    
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    
    const emails = await emailResponse.json()
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email
    
    const user = {
      githubId: userData.login,
      username: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      email: primaryEmail,
    }
    
    return res.redirect(`${FRONTEND_URL}/auth?githubId=${user.githubId}&username=${encodeURIComponent(user.username)}&avatarUrl=${encodeURIComponent(user.avatarUrl || '')}&email=${encodeURIComponent(user.email || '')}`)
  } catch (err) {
    return res.redirect(FRONTEND_URL + '/login?error=oauth_failed')
  }
})

app.post('/api/users/ensure', async (req, res) => {
  try {
    const { githubId, username, avatarUrl } = req.body

    if (!githubId) {
      return res.status(400).json({ error: 'githubId is required' })
    }

    let user = db.users.findByGithubId(githubId)

    if (user) {
      user = db.users.update(user.id, { last_active: new Date().toISOString().split('T')[0] })
      return res.json({ user })
    }

    user = db.users.create({
      id: uuidv4(),
      github_id: githubId,
      username: username || githubId.split('@')[0],
      avatar_url: avatarUrl || null,
      score: 0,
      weekly_score: 0,
      streak: 0,
      xp: 0,
      level: 1,
      last_active: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    })

    res.json({ user })
  } catch (error: any) {
    console.error('Ensure user error:', error)
    res.status(500).json({ error: error.message || 'Failed to ensure user' })
  }
})

app.post('/api/quizzes/generate', async (req, res) => {
  try {
    const { sourceText, roomId } = req.body

    if (!sourceText) {
      return res.status(400).json({ error: 'sourceText is required' })
    }

    const prompt = `
You are a quiz generator for computer science university students.
Given study notes or lecture content, generate exactly 10 multiple choice questions.
Return ONLY a valid JSON array. No markdown, no explanation, no wrapping text.
Each object must have:
  id (uuid v4)
  text (question string)
  options (array of exactly 4 strings)
  correct (integer 0-3 for correct option index)
  explanation (1-2 sentence explanation of correct answer)
  topic (short topic label e.g. "Binary Trees")
  question_type ("mcq" or "code")
  code_snippet (optional — include for code-based questions)
Make questions challenging but fair for a third-year CS student.
Focus on conceptual understanding and edge cases, not memorisation.

Study content:
${sourceText}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = completion.choices[0]?.message?.content
    let questions = []

    if (result) {
      try {
        const parsed = JSON.parse(result)
        questions = parsed.questions || parsed
      } catch {
        const match = result.match(/\[[\s\S]*\]/)
        if (match) {
          questions = JSON.parse(match[0])
        }
      }
    }

    if (!Array.isArray(questions)) {
      questions = []
    }

    questions = questions.map((q: any) => ({
      ...q,
      id: q.id || uuidv4(),
      question_type: q.question_type || 'mcq',
    }))

    res.json({ questions })
  } catch (error) {
    console.error('Quiz generation error:', error)
    res.status(500).json({ error: 'Failed to generate quiz' })
  }
})

app.post('/api/hints/generate', async (req, res) => {
  try {
    const { question, options } = req.body

    if (!question) {
      return res.status(400).json({ error: 'question is required' })
    }

    const prompt = `
Give a one-sentence hint for this multiple choice question.
Do NOT reveal the answer or name the correct option.
The hint should nudge the student toward the right reasoning approach.

Question: ${question}
Options: ${options?.join(', ') || 'N/A'}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const hint = completion.choices[0]?.message?.content || ''
    res.json({ hint })
  } catch (error) {
    console.error('Hint generation error:', error)
    res.status(500).json({ error: 'Failed to generate hint' })
  }
})

app.post('/api/study-plan/generate', async (req, res) => {
  try {
    const { topics, examDate, weakAreas, days = 14 } = req.body

    if (!topics || !examDate) {
      return res.status(400).json({ error: 'topics and examDate are required' })
    }

    // Try Python bridge first
    try {
      const bridgeUrl = 'http://localhost:5000/api/study-plan/generate'
      const bridgeRes = await fetch(bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, exam_date: examDate, weak_areas: weakAreas || '', days }),
      })
      
      if (bridgeRes.ok) {
        const data = await bridgeRes.json()
        if (data.plan) {
          return res.json({ plan: data.plan, source: 'bridge' })
        }
      }
    } catch (e) {
      console.log('Bridge unavailable, using OpenAI fallback')
    }

    // Fallback to OpenAI
    const prompt = `
Given these topics: ${topics.join(', ')}, this exam date: ${examDate}, and these weak areas: ${weakAreas || 'none'},
generate a day-by-day study plan for the next ${days} days.
Return ONLY a JSON array of objects: { date, topics[], task, estimated_minutes }.
No markdown, no explanation, just the JSON array.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = completion.choices[0]?.message?.content
    let plan = []

    if (result) {
      try {
        const parsed = JSON.parse(result)
        plan = parsed.plan || parsed
      } catch {
        const match = result.match(/\[[\s\S]*\]/)
        if (match) {
          plan = JSON.parse(match[0])
        }
      }
    }

    res.json({ plan, source: 'openai' })
  } catch (error) {
    console.error('Study plan generation error:', error)
    res.status(500).json({ error: 'Failed to generate study plan' })
  }
})

app.post('/api/weak-areas/analyze', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    return res.json({ weakAreas: [], message: 'No practice data yet - practice more quizzes!' })
  }
})

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = db.users.findAll().slice(0, 20)
    res.json({ leaderboard: users })
  } catch (error) {
    console.error('Leaderboard error:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, topic, description, emoji, createdBy } = req.body

    if (!name || !topic) {
      return res.status(400).json({ error: 'name and topic are required' })
    }

    function generateInviteCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    const room = db.rooms.create({
      id: uuidv4(),
      name,
      topic,
      description: description || null,
      emoji: emoji || '📚',
      invite_code: generateInviteCode(),
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
    })

    res.json({ room })
  } catch (error) {
    console.error('Create room error:', error)
    res.status(500).json({ error: 'Failed to create room' })
  }
})

app.get('/api/rooms/:id/messages', async (req, res) => {
  try {
    const { id: roomId } = req.params
    const messages = db.messages.findByRoomId(roomId, 50).reverse()
    const formatted = messages.map((m: any) => {
      const user = m.user_id ? db.users.findById(m.user_id) : null
      return {
        ...m,
        username: user?.username,
        avatar_url: user?.avatar_url,
      }
    })
    res.json({ messages: formatted })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

app.get('/api/rooms/:id/members', async (req, res) => {
  try {
    const { id: roomId } = req.params
    const room = db.rooms.findById(roomId)
    res.json({ members: room ? [{ room_id: roomId, user: room.created_by }] : [] })
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// Bridge proxy endpoints
app.post('/api/bridge/study-plan', async (req, res) => {
  try {
    const bridgeUrl = 'http://localhost:5000/api/study-plan/generate'
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Bridge study-plan error:', error)
    res.status(500).json({ error: 'Failed to call bridge' })
  }
})

app.post('/api/bridge/weak-areas', async (req, res) => {
  try {
    const bridgeUrl = 'http://localhost:5000/api/weak-areas/analyze'
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Bridge weak-areas error:', error)
    res.status(500).json({ error: 'Failed to call bridge' })
  }
})

app.post('/api/bridge/setup', async (req, res) => {
  try {
    const bridgeUrl = 'http://localhost:5000/api/student/setup'
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Bridge setup error:', error)
    res.status(500).json({ error: 'Failed to call bridge' })
  }
})

app.post('/api/duels/create', async (req, res) => {
  try {
    const { roomId, challengerId, opponentId, quizId, mode = 'live' } = req.body

    const deadline = mode === 'async' 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null

    const duel = db.duels.create({
      id: uuidv4(),
      room_id: roomId,
      challenger_id: challengerId,
      opponent_id: opponentId,
      quiz_id: quizId,
      mode,
      deadline,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

    res.json({ duel })
  } catch (error) {
    console.error('Create duel error:', error)
    res.status(500).json({ error: 'Failed to create duel' })
  }
})

app.post('/api/duels/:id/accept', async (req, res) => {
  try {
    const { id: duelId } = req.params

    const duel = db.duels.update(duelId, { status: 'active' })

    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' })
    }

    res.json({ duel })
  } catch (error) {
    console.error('Accept duel error:', error)
    res.status(500).json({ error: 'Failed to accept duel' })
  }
})

app.post('/api/duels/:id/submit', async (req, res) => {
  try {
    const { id: duelId } = req.params
    const { userId, answers } = req.body
    return res.json({ success: true })
  } catch (error) {
    console.error('Submit duel error:', error)
    res.status(500).json({ error: 'Failed to submit duel' })
  }
})

app.get('/api/duels/:id', async (req, res) => {
  try {
    const { id } = req.params
    const duel = db.duels.findById(id)
    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' })
    }
    res.json({ duel })
  } catch (error) {
console.error('Get duel error:', error)
    res.status(500).json({ error: 'Failed to fetch duel' })
  }
})

app.get('/api/users/:id/friends', async (req, res) => {
  try {
    const { id: userId } = req.params
    res.json({ friends: [] })
  } catch (error) {
    console.error('Get friends error:', error)
    res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

app.post('/api/users/:id/xp', async (req, res) => {
  try {
    const { id: userId } = req.params
    const { xp } = req.body
    const user = db.users.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const newXp = (user.xp || 0) + (xp || 10)
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1
    db.users.update(userId, { xp: newXp, level: newLevel })
    res.json({ xp: newXp, level: newLevel, leveledUp: newLevel > user.level })
  } catch (error) {
    console.error('XP error:', error)
    res.status(500).json({ error: 'Failed to update XP' })
  }
})

app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { id: userId } = req.params
    const user = db.users.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({
      stats: {
        ...user,
        wins: 0,
        losses: 0,
        winRate: 0,
        badges: [],
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('auth', async (userId: string) => {
    const authenticatedSocket = socket as AuthenticatedSocket
    authenticatedSocket.userId = userId
    socket.join(`user:${userId}`)
    console.log('User authenticated:', userId)
  })

  socket.on('join:room', (roomId: string) => {
    socket.join(`room:${roomId}`)
    socket.to(`room:${roomId}`).emit('user:joined', {
      userId: (socket as AuthenticatedSocket).userId,
      socketId: socket.id,
    })
  })

  socket.on('leave:room', (roomId: string) => {
    socket.leave(`room:${roomId}`)
  })

  socket.on('join:duel', (duelId: string) => {
    socket.join(`duel:${duelId}`)
  })

  socket.on('leave:duel', (duelId: string) => {
    socket.leave(`duel:${duelId}`)
  })

  socket.on('chat:message', async (data: {
    roomId: string
    userId: string
    content: string
  }) => {
    const { roomId, userId, content } = data

    const message = db.messages.create({
      id: uuidv4(),
      room_id: roomId,
      user_id: userId,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
    })

    io.to(`room:${roomId}`).emit('chat:message', {
      roomId,
      userId,
      content,
      created_at: new Date().toISOString(),
    })
  })

  socket.on('duel:buzz', (data: { duelId: string; userId: string }) => {
    const { duelId, userId } = data
    io.to(`duel:${duelId}`).emit('duel:buzz', {
      userId,
      time: Date.now(),
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`StudyOS Backend running on port ${PORT}`)
})

export default app