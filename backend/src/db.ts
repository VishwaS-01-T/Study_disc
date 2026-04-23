import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function getFilePath(table: string) {
  return path.join(DATA_DIR, `${table}.json`)
}

function readTable(table: string): any[] {
  try {
    const data = fs.readFileSync(getFilePath(table), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeTable(table: string, data: any[]) {
  fs.writeFileSync(getFilePath(table), JSON.stringify(data, null, 2))
}

export const db = {
  users: {
    findById: (id: string) => readTable('users').find(u => u.id === id),
    findByGithubId: (githubId: string) => readTable('users').find(u => u.github_id === githubId),
    create: (user: any) => {
      const users = readTable('users')
      users.push(user)
      writeTable('users', users)
      return user
    },
    update: (id: string, updates: any) => {
      const users = readTable('users')
      const index = users.findIndex(u => u.id === id)
      if (index !== -1) {
        users[index] = { ...users[index], ...updates }
        writeTable('users', users)
        return users[index]
      }
      return null
    },
    findAll: () => readTable('users').sort((a, b) => (b.score || 0) - (a.score || 0)),
  },

  rooms: {
    findById: (id: string) => readTable('rooms').find(r => r.id === id),
    findByInviteCode: (code: string) => readTable('rooms').find(r => r.invite_code === code),
    create: (room: any) => {
      const rooms = readTable('rooms')
      rooms.push(room)
      writeTable('rooms', rooms)
      return room
    },
    findAll: () => readTable('rooms').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  },

  messages: {
    findByRoomId: (roomId: string, limit = 50) => 
      readTable('messages')
        .filter(m => m.room_id === roomId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-limit),
    create: (message: any) => {
      const messages = readTable('messages')
      messages.push(message)
      writeTable('messages', messages)
      return message
    },
  },

  quizzes: {
    findByRoomId: (roomId: string) => readTable('quizzes').filter(q => q.room_id === roomId),
    create: (quiz: any) => {
      const quizzes = readTable('quizzes')
      quizzes.push(quiz)
      writeTable('quizzes', quizzes)
      return quiz
    },
  },

  duels: {
    findById: (id: string) => readTable('duels').find(d => d.id === id),
    findPendingByUserId: (userId: string) => 
      readTable('duels').filter(d => d.status === 'pending' && d.opponent_id === userId),
    create: (duel: any) => {
      const duels = readTable('duels')
      duels.push(duel)
      writeTable('duels', duels)
      return duel
    },
    update: (id: string, updates: any) => {
      const duels = readTable('duels')
      const index = duels.findIndex(d => d.id === id)
      if (index !== -1) {
        duels[index] = { ...duels[index], ...updates }
        writeTable('duels', duels)
        return duels[index]
      }
      return null
    },
  },

  notifications: {
    findByUserId: (userId: string) => 
      readTable('notifications')
        .filter(n => n.user_id === userId && !n.read)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    create: (notification: any) => {
      const notifications = readTable('notifications')
      notifications.push(notification)
      writeTable('notifications', notifications)
      return notification
    },
    markRead: (id: string) => {
      const notifications = readTable('notifications')
      const index = notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications[index].read = true
        writeTable('notifications', notifications)
      }
    },
  },
}