# StudyOS - AI-Powered Co-Study Platform

Full-stack implementation with Python AI agents + Node.js backend + Next.js 14 frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                   │
│              Port 3000 - /, /rooms, /duel, etc.               │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                   │
│              Port 4000 - REST API, Socket.io                 │
│  - Quiz generation (OpenAI)                                │
│  - Room/duel management                                   │
│  - Falls back to Python bridge for multi-step AI              │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP (multi-step AI)
┌─────────────────────────────────────────────────────────────┐
│               Python Bridge API (FastAPI)                      │
│              Port 5000 - Multi-agent orchestration          │
│  - orchestrator.py - coordinates agents                    │
│  - planning_agent.py - study plans                       │
│  - strategy_agent.py - weak area strategy                 │
│  - context_agent.py - quiz context                      │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### Frontend
```bash
cd frontend
npm install
# Add .env.local with keys:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
# NEXT_PUBLIC_SUPABASE_URL=...
npm run dev
```

### Backend
```bash
cd backend
npm install
# Add .env with keys:
# PORT=4000
# OPENAI_API_KEY=...
# SUPABASE_URL=...
npm run dev
```

### Python Bridge
```bash
cd bridge
pip install -r ../requirements.txt
# Add .env with:
# GEMINI_API_KEY=...
python api.py
```

## Features

| Feature | Implementation |
|---------|----------------|
| Quiz Generation | OpenAI (backend) + context_agent (bridge) |
| Study Planner | planning_agent (bridge) → frontend /study-plan |
| Weak Areas | strategy_agent (bridge) → frontend /profile |
| Rooms + Chat | Backend + Socket.io |
| Duel/BUZZ | Frontend /duel |
| Profile + Streaks | Frontend /profile |
| Leaderboard | Frontend /leaderboard |

## Running All Services

```bash
# Terminal 1: Python bridge
cd bridge && python api.py

# Terminal 2: Node.js backend  
cd backend && npm run dev

# Terminal 3: Next.js frontend
cd frontend && npm run dev
```

Access at http://localhost:3000

## Pages

| Route | Description |
|-------|------------|
| `/` | Homepage with rooms |
| `/login` | Login page |
| `/rooms/[id]` | Room chat + quiz generation |
| `/duel/[id]` | Practice quiz with BUZZ |
| `/profile` | Profile with weak areas |
| `/leaderboard` | Global rankings |
| `/study-plan` | AI study planner |
| `/join/[code]` | Join room via invite |

## Python Agents

- **orchestrator.py** - Coordinates multi-agent workflows
- **planning_agent.py** - Generates study plans (Step 30)
- **strategy_agent.py** - Analyzes weak areas (Step 17)
- **context_agent.py** - Enriches quiz generation with room context
- **core/student_state.py** - Student progress state
- **core/event_log.py** - Activity tracking