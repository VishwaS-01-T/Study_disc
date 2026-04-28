import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import multer from 'multer'
import pdf from 'pdf-parse'
import { db } from './db.js'
import OpenAI from 'openai'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const openai = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta'
})

let lastApiCall = 0
const MIN_REQUEST_INTERVAL = 15000

async function rateLimitedGenerate(prompt: string): Promise<string> {
  const now = Date.now()
  const elapsed = now - lastApiCall
  if (elapsed < MIN_REQUEST_INTERVAL) {
    console.log(`Rate limiting... waiting ${(MIN_REQUEST_INTERVAL - elapsed)/1000}s`)
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed))
  }
  lastApiCall = Date.now()
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    })
    return completion.choices[0]?.message?.content || ''
  } catch (e: any) {
    if (e.status === 429) {
      lastApiCall = 0
      throw new Error('Rate limited - please wait 15 seconds')
    }
    throw e
  }
}

function extractJSON(text: string): any[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (match) try { return JSON.parse(match[0]) } catch {}
  try { return JSON.parse(text) } catch {}
  return []
}

function extractKeyPhrases(text: string): string[] {
  const patterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g,
    /\b\w+(?:tion|ing|ed|ment|ness|ity|ly|er|est)\b/g,
    /\b(?:important|key|critical|main|primary|basic|fundamental|essential|define|explain|describe)\b/gi,
  ]
  let phrases: string[] = []
  for (const pat of patterns) {
    const matches = text.match(pat)
    if (matches) phrases.push(...matches)
  }
  phrases = [...new Set(phrases.map(p => p.toLowerCase()))]
  return phrases.slice(0, 20)
}

function generateLocalQuiz(text: string, topic: string): any[] {
  const keyPhrases = extractKeyPhrases(text)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 200)
  
  if (sentences.length < 3 || keyPhrases.length < 3) {
    return [
      { id: uuidv4(), text: `Based on the uploaded material about ${topic}, what is the main concept discussed?`, options: ['The first main concept', 'A secondary concept', 'An unrelated topic', 'None of the above'], correct: 0, explanation: `This is identified from the text about ${topic}.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `Which idea is emphasized in the ${topic} notes?`, options: ['Key idea from text', 'Contrasting idea', 'Unmentioned idea', 'Negative example'], correct: 0, explanation: `This is based on the material provided.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `What can be inferred about ${topic} from the notes?`, options: ['Primary understanding', 'Opposite meaning', 'No clear meaning', 'Irrelevant data'], correct: 0, explanation: `The text supports this interpretation.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `Which statement is supported by the ${topic} content?`, options: ['First statement', 'Second statement', 'Third statement', 'None'], correct: 0, explanation: `The content supports this.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `The notes primarily discuss:`, options: ['Core topic details', 'Unrelated subjects', 'Historical events', 'Random topics'], correct: 0, explanation: `This is the main focus.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `A key point in the material is:`, options: ['Important point', 'Minor detail', 'Conflicting view', 'Irrelevant note'], correct: 0, explanation: `This is mentioned in the text.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `The document suggests that ${topic} involves:`, options: ['Essential elements', 'Optional components', 'Unnecessary parts', 'External factors'], correct: 0, explanation: `These are in the source text.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `According to the notes, ${keyPhrases[0] || 'the topic'} is:`, options: ['Definite concept from text', 'Contradictory to text', 'Unmentioned', 'Fictional'], correct: 0, explanation: `This matches the text.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `The main focus of the ${topic} material is:`, options: ['Primary focus', 'Secondary focus', 'No focus', 'Hidden focus'], correct: 0, explanation: `The material centers on this.`, topic: topic, question_type: 'mcq' },
      { id: uuidv4(), text: `To understand ${topic}, one should know:`, options: ['Fundamental concepts', 'Only examples', 'Nothing specific', 'Advanced theories'], correct: 0, explanation: `This is foundational.`, topic: topic, question_type: 'mcq' },
    ]
  }

  const selectedSentences = sentences.slice(0, 8)
  const phraseUsed = keyPhrases[0] || 'the topic'
  
  return [
    { id: uuidv4(), text: `In the notes about ${topic}, what is discussed regarding "${phraseUsed}"?`, options: [selectedSentences[0]?.trim() || 'First concept', selectedSentences[1]?.trim() || 'Second concept', selectedSentences[2]?.trim() || 'Third concept', 'Not mentioned'], correct: 0, explanation: `This is mentioned in the provided text.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `Which idea is presented in the ${topic} material?`, options: [selectedSentences[1]?.trim() || 'Main idea', selectedSentences[0]?.trim() || 'Alternative', selectedSentences[2]?.trim() || 'Contrasting view', 'No clear idea'], correct: 0, explanation: `The text presents this.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `Based on the uploaded content, ${keyPhrases[1] || 'the concept'} refers to:`, options: [selectedSentences[2]?.trim() || 'Primary meaning', selectedSentences[3]?.trim() || 'Different meaning', selectedSentences[4]?.trim() || 'Opposite meaning', 'No meaning'], correct: 0, explanation: `This matches the content.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `The notes indicate that ${topic} is:`, options: [selectedSentences[3]?.trim() || 'Important', selectedSentences[4]?.trim() || 'Optional', selectedSentences[5]?.trim() || 'Unimportant', 'Irrelevant'], correct: 0, explanation: `The material indicates this.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `What does the ${topic} content explain?`, options: [selectedSentences[4]?.trim() || 'Core explanation', selectedSentences[5]?.trim() || 'Partial explanation', selectedSentences[6]?.trim() || 'Different explanation', 'No explanation'], correct: 0, explanation: `This is explained in the text.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `A key point from the ${topic} notes is:`, options: [selectedSentences[5]?.trim() || 'Key point', selectedSentences[6]?.trim() || 'Minor point', selectedSentences[0]?.trim() || 'Unrelated point', 'No point'], correct: 0, explanation: `This is highlighted.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `The ${topic} material covers:`, options: [selectedSentences[6]?.trim() || 'Main coverage', selectedSentences[7]?.trim() || 'Partial coverage', selectedSentences[1]?.trim() || 'Alternative coverage', 'No coverage'], correct: 0, explanation: `The material covers this.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `According to the text, ${keyPhrases[2] || topic} involves:`, options: [selectedSentences[7]?.trim() || 'Essential components', selectedSentences[0]?.trim() || 'Optional parts', selectedSentences[2]?.trim() || 'Irrelevant parts', 'Nothing specific'], correct: 0, explanation: `This is in the source.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `The primary purpose of the ${topic} content is:`, options: [selectedSentences[0]?.trim() || 'Primary purpose', selectedSentences[1]?.trim() || 'Secondary purpose', selectedSentences[3]?.trim() || 'No purpose', 'Hidden purpose'], correct: 0, explanation: `This is the main purpose.`, topic: topic, question_type: 'mcq' },
    { id: uuidv4(), text: `To summarize the ${topic} notes:`, options: [selectedSentences[1]?.trim() || 'Main summary', selectedSentences[2]?.trim() || 'Partial summary', selectedSentences[4]?.trim() || 'Different summary', 'No summary'], correct: 0, explanation: `This summarizes the content.`, topic: topic, question_type: 'mcq' },
  ]
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
})

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
app.use(express.urlencoded({ extended: true }))

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

app.get('/api/users', async (req, res) => {
  try {
    const users = db.users.findAll().slice(0, 50)
    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

app.post('/api/quizzes/:id/attempts', async (req, res) => {
  try {
    const { id: quizId } = req.params
    const { userId, correct, total, topic } = req.body
    if (!userId || typeof correct !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ error: 'userId, correct, total are required' })
    }

    const attempt = db.quiz_attempts.create({
      id: uuidv4(),
      quiz_id: quizId,
      user_id: userId,
      correct,
      total,
      topic: topic || 'General',
      created_at: new Date().toISOString(),
    })

    const user = db.users.findById(userId)
    if (user) {
      const scoreGain = correct * 10
      const xpGain = Math.max(10, correct * 5)
      const newScore = (user.score || 0) + scoreGain
      const newXp = (user.xp || 0) + xpGain
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1
      
      const today = new Date().toISOString().split('T')[0]
      const lastActive = user.last_active
      let newStreak = user.streak || 0
      
      if (lastActive === today) {
        // Already studied today, keep streak
      } else if (lastActive) {
        const lastDate = new Date(lastActive)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          newStreak += 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      } else {
        newStreak = 1
      }
      
      db.users.update(userId, { score: newScore, xp: newXp, level: newLevel, streak: newStreak, last_active: today })
      
      const percentage = (correct / total) * 100
      const existingBadges = db.badges.findByUserId(userId).map(b => b.badge_key)
      
      if (percentage >= 90 && !existingBadges.includes('Perfect Score')) {
        db.badges.create({ id: uuidv4(), user_id: userId, badge_key: 'Perfect Score', earned_at: new Date().toISOString() })
      }
      if (newStreak >= 7 && !existingBadges.includes('7 Day Streak')) {
        db.badges.create({ id: uuidv4(), user_id: userId, badge_key: '7 Day Streak', earned_at: new Date().toISOString() })
      }
      if (newStreak >= 30 && !existingBadges.includes('30 Day Streak')) {
        db.badges.create({ id: uuidv4(), user_id: userId, badge_key: '30 Day Streak', earned_at: new Date().toISOString() })
      }
      if (newLevel >= 5 && !existingBadges.includes('Level 5')) {
        db.badges.create({ id: uuidv4(), user_id: userId, badge_key: 'Level 5', earned_at: new Date().toISOString() })
      }
    }

    res.json({ attempt })
  } catch (error) {
    console.error('Create attempt error:', error)
    res.status(500).json({ error: 'Failed to save attempt' })
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

app.get('/api/rooms/code/:code', async (req, res) => {
  try {
    const { code } = req.params
    const room = db.rooms.findByInviteCode(code)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    res.json({ room })
  } catch (error) {
    console.error('Get room by code error:', error)
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params
    const room = db.rooms.findById(id)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    res.json({ room })
  } catch (error) {
    console.error('Get room error:', error)
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

app.post('/api/rooms/:id/join', async (req, res) => {
  try {
    const { id: roomId } = req.params
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const room = db.rooms.findById(roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    const member = db.room_members.add(roomId, userId)
    res.json({ member })
  } catch (error) {
    console.error('Join room error:', error)
    res.status(500).json({ error: 'Failed to join room' })
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

    if (typeof githubId !== 'string' || !githubId.trim()) {
      return res.status(400).json({ error: 'githubId must be a non-empty string' })
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

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:5000'

app.post('/api/quizzes/generate', async (req, res) => {
  console.log('=== QUIZ GENERATION (TEXT) DEBUG ===')
  console.log('Topic:', req.body.topic)
  console.log('Text length:', req.body.sourceText?.length)
  console.log('Text preview:', req.body.sourceText?.slice(0, 300))
  console.log('==========================================')
  try {
    const { sourceText, roomId, topic = 'Generated Quiz' } = req.body

    if (!sourceText || sourceText.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide at least 50 characters of notes' })
    }

    let questions: any[] = []
    let errorMsg = ''
    let usedLocal = false

    try {
      const prompt = `You are a quiz generator. Your ONLY job is to create multiple choice questions 
STRICTLY based on the provided study material. 

CRITICAL RULES:
- Every question MUST be answerable using ONLY the provided text
- Do NOT add any knowledge from outside the provided material  
- Do NOT generate generic CS questions — use specific facts, terms, and concepts FROM THE TEXT
- Questions must reference specific content from the material (names, definitions, algorithms, concepts mentioned)
- If the text mentions a specific algorithm, ask about THAT specific algorithm as described

Return ONLY a valid JSON array starting with [ and ending with ].

Each object must have:
{
  "id": "q1",
  "text": "question based directly on the provided material",
  "options": ["option1", "option2", "option3", "option4"],
  "correct": 0,
  "explanation": "explanation citing the specific part of the material this came from",
  "topic": "specific topic from the material",
  "question_type": "mcq"
}

STUDY MATERIAL:
---
${sourceText.slice(0, 8000)}
---`

      const result = await rateLimitedGenerate(prompt)
      console.log('OpenAI response preview:', result.slice(0, 300))
      questions = extractJSON(result)
    } catch (e: any) {
      console.log('AI failed, using local generator:', e.message)
      questions = generateLocalQuiz(sourceText, topic)
      usedLocal = true
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.log('Using local quiz generator as fallback')
      questions = generateLocalQuiz(sourceText, topic)
      usedLocal = true
    }

    questions = questions.filter((q: any) => q && q.text && Array.isArray(q.options) && q.options.length === 4)
    if (questions.length === 0) {
      return res.status(500).json({ error: 'Failed to generate valid questions' })
    }

    console.log('Generated questions:', questions.length, 'Used local:', usedLocal)

    questions = questions.map((q: any) => ({
      id: q.id || uuidv4(),
      text: q.text,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: typeof q.correct === 'number' ? q.correct : 0,
      explanation: q.explanation || '',
      topic: q.topic || topic,
      question_type: q.question_type || 'mcq',
    }))

    const quiz = {
      id: uuidv4(),
      room_id: roomId || null,
      title: topic,
      questions,
      question_count: questions.length,
      type: 'generated',
      source_text: sourceText.slice(0, 500),
      created_at: new Date().toISOString(),
    }

    if (roomId) {
      db.quizzes.create(quiz)
    }

    res.json({ 
      quiz,
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        topic: q.topic,
        question_type: q.question_type,
        code_snippet: q.code_snippet,
      }))
    })
  } catch (error: any) {
    console.error('Quiz generation error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate quiz' })
  }
})

app.get('/api/quizzes', async (req, res) => {
  try {
    const { roomId } = req.query
    
    let quizzes = db.quizzes.findAll()
    
    if (roomId) {
      quizzes = quizzes.filter(q => q.room_id === roomId)
    }
    
    quizzes = quizzes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    const formatted = quizzes.map(q => ({
      id: q.id,
      title: q.title || 'Quiz',
      question_count: q.question_count || q.questions?.length || 0,
      type: q.type || 'generated',
      created_at: q.created_at,
    }))
    
    res.json({ quizzes: formatted })
  } catch (error) {
    console.error('Get quizzes error:', error)
    res.status(500).json({ error: 'Failed to fetch quizzes' })
  }
})

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const quiz = db.quizzes.findById(id)
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    res.json({ 
      quiz: {
        id: quiz.id,
        title: quiz.title || 'Quiz',
        room_id: quiz.room_id,
        questions: quiz.questions || [],
        question_count: quiz.question_count || quiz.questions?.length || 0,
        type: quiz.type || 'generated',
        created_at: quiz.created_at,
      }
    })
  } catch (error) {
    console.error('Get quiz error:', error)
    res.status(500).json({ error: 'Failed to fetch quiz' })
  }
})

app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    
    const quiz = db.quizzes.findById(id)
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    if (quiz.room_id) {
      const room = db.rooms.findById(quiz.room_id)
      if (room && room.created_by !== userId) {
        return res.status(403).json({ error: 'Only room creator can delete quizzes' })
      }
    }
    
    const deleted = db.quizzes.delete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Delete quiz error:', error)
    res.status(500).json({ error: 'Failed to delete quiz' })
  }
})

app.post('/api/quizzes/generate-from-file', async (req, res) => {
  console.log('=== QUIZ GENERATION DEBUG ===')
  console.log('Topic:', req.body.topic)
  console.log('extractOnly:', req.body.extractOnly)
  try {
    if (!req.body.fileData) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const topic = req.body.topic || 'Quiz'
    const roomId = req.body.roomId
    const extractOnly = req.body.extractOnly === true
    
    let text = ''
    const mimetype = req.body.fileType || 'text/plain'
    const filename = req.body.fileName || 'file'
    const ext = filename.split('.').pop()?.toLowerCase()
    
    console.log('File:', filename, 'Type:', mimetype, 'Ext:', ext)
    
    try {
      const buffer = Buffer.from(req.body.fileData, 'base64')
      
      if (ext === 'pdf' || mimetype === 'application/pdf') {
        const pdfData = await pdf(buffer)
        text = pdfData.text
        console.log('PDF extracted, raw length:', text.length, 'pages:', pdfData.numpages)
      } else if (ext === 'pptx') {
        try {
          const AdmZip = require('adm-zip')
          const zip = new AdmZip(buffer)
          const entries = zip.getEntries()
          let pptText = ''
          for (const entry of entries) {
            if (entry.entryName.match(/^ppt\/slides\//)) {
              pptText += entry.getText() + ' '
            }
          }
          text = pptText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        } catch (pptErr) {
          console.error('PPTX parse error:', pptErr)
          return res.status(400).json({ error: 'Could not read PPTX file. Try converting to PDF or text.' })
        }
      } else {
        text = buffer.toString('utf-8')
      }
    } catch (parseErr) {
      console.error('File parse error:', parseErr)
      return res.status(400).json({ error: 'Could not read file. Please use PDF, TXT, MD, or PPTX files.' })
    }

    // Clean up extracted text
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim()

    console.log('Cleaned text length:', text.length)
    console.log('Text preview (first 300):', text.slice(0, 300))
    console.log('Text preview (last 200):', text.slice(-200))
    console.log('============================')

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'File content too short. Need at least 50 characters.' })
    }

    if (extractOnly) {
      return res.json({ 
        text: text.slice(0, 15000), 
        characters: text.length,
        preview: text.slice(0, 200)
      })
    }

    let questions: any[] = []
    try {
      const result = await rateLimitedGenerate(`Generate 10 CS MCQ from file. JSON array {id,text,options:[4],correct,explanation,topic}. Content: ${text.slice(0, 5000)}`)
      const match = result.match(/\[[\s\S]*\]/)
      if (match) questions = JSON.parse(match[0])
    } catch (e) {
      console.log('AI failed, using local generator')
      questions = generateLocalQuiz(text, topic)
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      questions = generateLocalQuiz(text, topic)
    }

    questions = questions.map((q: any) => ({
      id: q.id || uuidv4(),
      text: q.text,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: typeof q.correct === 'number' ? q.correct : 0,
      explanation: q.explanation || '',
      topic: q.topic || topic,
      question_type: q.question_type || 'mcq',
    }))

    const quiz = {
      id: uuidv4(),
      room_id: roomId || null,
      title: topic,
      questions,
      question_count: questions.length,
      type: 'generated',
      source_text: text.slice(0, 500),
      created_at: new Date().toISOString(),
    }

    if (roomId) {
      db.quizzes.create(quiz)
    }

    res.json({ 
      quiz,
      questions
    })
  } catch (error: any) {
    console.error('File generate error:', error)
    res.status(500).json({ error: error.message || 'Failed to generate quiz from file' })
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

    const attempts = db.quiz_attempts.findByUserId(userId)
    if (!attempts.length) {
      return res.json({ weakAreas: [], message: 'No practice data yet - practice more quizzes!' })
    }

    const topicStats: Record<string, { correct: number; total: number }> = {}
    attempts.forEach((attempt: any) => {
      const topic = attempt.topic || 'General'
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
      topicStats[topic].correct += attempt.correct || 0
      topicStats[topic].total += attempt.total || 0
    })

    const weakAreas = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
        attempts: stats.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)

    return res.json({ weakAreas })
  } catch (error) {
    console.error('Weak areas analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze weak areas' })
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
    function uniqueInviteCode() {
      let code = generateInviteCode()
      const existing = db.rooms.findAll().map(r => r.invite_code)
      while (existing.includes(code)) {
        code = generateInviteCode()
      }
      return code
    }

    const room = db.rooms.create({
      id: uuidv4(),
      name,
      topic,
      description: description || null,
      emoji: emoji || '📚',
      invite_code: uniqueInviteCode(),
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
    })

    if (createdBy) {
      db.room_members.add(room.id, createdBy)
    }

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
    const members = db.room_members.findByRoomId(roomId)
    const detailed = members.map(m => {
      const user = db.users.findById(m.user_id)
      return {
        id: m.user_id,
        username: user?.username || 'Unknown',
        avatar_url: user?.avatar_url || null,
        online: false,
        status: 'active',
        score: user?.score || 0,
      }
    })
    res.json({ members: detailed })
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

app.get('/api/rooms/:id/resources', async (req, res) => {
  try {
    const { id: roomId } = req.params
    const resources = db.room_resources.findByRoomId(roomId)
    res.json({ resources })
  } catch (error) {
    console.error('Get room resources error:', error)
    res.status(500).json({ error: 'Failed to fetch resources' })
  }
})

app.post('/api/rooms/:id/resources', async (req, res) => {
  try {
    const { id: roomId } = req.params
    const { url, label, userId } = req.body
    if (!url || !label || !userId) {
      return res.status(400).json({ error: 'url, label, and userId are required' })
    }
    const resource = db.room_resources.create({
      id: uuidv4(),
      room_id: roomId,
      url,
      label,
      upvotes: 0,
      created_by: userId,
      created_at: new Date().toISOString(),
    })
    res.json({ resource })
  } catch (error) {
    console.error('Create room resource error:', error)
    res.status(500).json({ error: 'Failed to add resource' })
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
    if (!roomId || !challengerId || !opponentId || !quizId) {
      return res.status(400).json({ error: 'roomId, challengerId, opponentId, quizId are required' })
    }

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

app.get('/api/duels/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const duels = db.duels.findPendingByUserId(userId)
    const formatted = duels.map(d => {
      const challenger = db.users.findById(d.challenger_id)
      const quiz = d.quiz_id ? db.quizzes.findById(d.quiz_id) : null
      return {
        id: d.id,
        challenger: challenger?.username || 'Unknown',
        quiz_title: quiz?.title || 'Quiz',
        direction: 'incoming' as const,
      }
    })
    res.json({ duels: formatted })
  } catch (error) {
    console.error('Get pending duels error:', error)
    res.status(500).json({ error: 'Failed to fetch pending duels' })
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

app.post('/api/duels/:id/decline', async (req, res) => {
  try {
    const { id: duelId } = req.params

    const duel = db.duels.update(duelId, { status: 'declined' })

    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' })
    }

    res.json({ duel })
  } catch (error) {
    console.error('Decline duel error:', error)
    res.status(500).json({ error: 'Failed to decline duel' })
  }
})

app.post('/api/duels/:id/submit', async (req, res) => {
  try {
    const { id: duelId } = req.params
    const { userId, answers } = req.body
    if (!userId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'userId and answers are required' })
    }

    const duel = db.duels.findById(duelId)
    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' })
    }

    const quiz = duel.quiz_id ? db.quizzes.findById(duel.quiz_id) : null
    const questions = quiz?.questions || []
    const score = answers.reduce((acc: number, ans: { questionId: string; selected: number }) => {
      const q = questions.find((q: any) => q.id === ans.questionId)
      if (!q) return acc
      return acc + (ans.selected === q.correct ? 1 : 0)
    }, 0)

    const existing = db.duel_submissions.findByDuelAndUser(duelId, userId)
    if (existing) {
      db.duel_submissions.update(duelId, userId, { answers, score, submitted_at: new Date().toISOString() })
    } else {
      db.duel_submissions.create({
        id: uuidv4(),
        duel_id: duelId,
        user_id: userId,
        answers,
        score,
        submitted_at: new Date().toISOString(),
      })
    }

    const submissions = db.duel_submissions.findByDuelId(duelId)
    if (submissions.length >= 2) {
      const [a, b] = submissions
      let winnerId: string | null = null
      if (a.score > b.score) winnerId = a.user_id
      if (b.score > a.score) winnerId = b.user_id
      db.duels.update(duelId, { status: 'completed', winner_id: winnerId, completed_at: new Date().toISOString() })
    }

    return res.json({ success: true, score })
  } catch (error) {
    console.error('Submit duel error:', error)
    res.status(500).json({ error: 'Failed to submit duel' })
  }
})

app.get('/api/duels/:id/results', async (req, res) => {
  try {
    const { id: duelId } = req.params
    const duel = db.duels.findById(duelId)
    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' })
    }
    const submissions = db.duel_submissions.findByDuelId(duelId)
    res.json({ duel, submissions })
  } catch (error) {
    console.error('Get duel results error:', error)
    res.status(500).json({ error: 'Failed to fetch duel results' })
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
    const friends = db.room_members
      .findByUserId(userId)
      .flatMap(m => db.room_members.findByRoomId(m.room_id))
      .filter(m => m.user_id !== userId)
      .map(m => db.users.findById(m.user_id))
      .filter(Boolean)
    res.json({ friends })
  } catch (error) {
    console.error('Get friends error:', error)
    res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

app.post('/api/users/:id/xp', async (req, res) => {
  try {
    const { id: userId } = req.params
    const { xp } = req.body
    if (typeof xp !== 'number' || xp <= 0) {
      return res.status(400).json({ error: 'xp must be a positive number' })
    }
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
    const attempts = db.quiz_attempts.findByUserId(userId)
    const wins = attempts.filter(a => a.correct >= a.total * 0.7).length
    const losses = attempts.length - wins
    const winRate = attempts.length ? Math.round((wins / attempts.length) * 100) : 0
    const badges = db.badges.findByUserId(userId)
    res.json({
      stats: {
        ...user,
        wins,
        losses,
        winRate,
        badges,
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
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
      username: db.users.findById(userId)?.username || 'Unknown',
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
