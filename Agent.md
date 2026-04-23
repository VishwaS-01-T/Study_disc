# StudyOS AI Agents

Documentation for the Python AI agent system integrated with the full-stack platform.

## Overview

StudyOS uses a multi-agent AI system to power intelligent study features:

- AI-generated quizzes
- Study plan generation
- Weak area detection
- Context-aware quiz enrichment

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                   │
│    /study-plan  /profile  /rooms/[id]  /duel/[id]      │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│              Port 4000 - REST API + Socket.io              │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│              Python Bridge API (FastAPI)                      │
│                   Port 5000                               │
│                     ↓                                     │
│              ┌──────────────────────────────────────────┐   │
│              │          Orchestrator                   │   │
│              └──────────────────────────────────────────┘   │
│                     ↓                                     │
│    ┌──────────────┴──────────────────────────────────┐     │
│    ↓                                                 ↓     │
│  ContextAgent     StrategyAgent    PlanningAgent        │     │
│    ↓                                                 ↓     │
│  core/event_log  core/gemini_client.py ──→ Gemini AI  │     │
└─────────────────────────────────────────────────────────────┘
```

## Agents

### 1. Context Agent

**File**: `agents/context_agent.py`

**Purpose**: Builds a world model from student profile to provide context for quiz generation.

**How it works**:
1. Takes student data (exam, deadline, subjects, weak areas)
2. Uses Gemini to analyze the learning situation
3. Returns contextual insights for quiz generation

**Code**:
```python
from core.gemini_client import GeminiClient

class ContextAgent:
    def __init__(self):
        self.client = GeminiClient()
    
    def build_world_model(self, student_data):
        prompt = f"""
        Analyze this student profile and create a structured world model:
        Exam: {student_data['exam']}
        Deadline: {student_data['deadline']} days
        Subjects: {student_data['subjects']}
        Study Hours: {student_data['study_hours']} hours/day
        Weak Areas: {student_data['weak_areas']}
        
        Return a brief analysis of their situation.
        """
        return self.client.generate(prompt)
```

**Used by**: Bridge `/api/quiz-context` endpoint

---

### 2. Strategy Agent

**File**: `agents/strategy_agent.py`

**Purpose**: Creates long-term learning strategy based on weak areas and goals.

**How it works**:
1. Takes world model from Context Agent
2. Analyzes student's weak areas and available time
3. Creates a phased strategy (Foundation → Application → Mastery)

**Code**:
```python
from core.gemini_client import GeminiClient

class StrategyAgent:
    def __init__(self):
        self.client = GeminiClient()
    
    def create_strategy(self, world_model, student_data):
        prompt = f"""
        Based on this student context: {world_model}
        
        Create a 6-week strategic learning plan for {student_data['exam']}.
        Focus on weak areas: {student_data['weak_areas']}
        Available time: {student_data['study_hours']} hours/day
        
        Return 3 main phases (Foundation, Application, Mastery) with brief goals.
        """
        return self.client.generate(prompt)
```

**Used by**: Bridge `/api/weak-areas/analyze` endpoint

---

### 3. Planning Agent

**File**: `agents/planning_agent.py`

**Purpose**: Generates daily study tasks based on strategy.

**How it works**:
1. Takes strategy from Strategy Agent
2. Creates specific daily tasks
3. Focuses on weak areas with time allocation

**Code**:
```python
from core.gemini_client import GeminiClient

class PlanningAgent:
    def __init__(self):
        self.client = GeminiClient()
    
    def create_daily_tasks(self, strategy, student_data):
        prompt = f"""
        Based on this strategy: {strategy}
        
        Create 3 daily study tasks for today focusing on:
        - Weak areas: {student_data['weak_areas']}
        - Subjects: {student_data['subjects']}
        - Time available: {student_data['study_hours']} hours
        
        Format each task as: "Subject: Topic (duration)" with effort level and reason.
        """
        return self.client.generate(prompt)
```

**Used by**: Bridge `/api/study-plan/generate` endpoint

---

### 4. Orchestrator

**File**: `agents/orchestrator.py`

**Purpose**: Coordinates all agents in sequence for comprehensive setup.

**How it works**:
1. Calls Context Agent → builds world model
2. Calls Strategy Agent → creates strategy
3. Calls Planning Agent → generates tasks
4. Tracks all in EventLog

**Code**:
```python
from agents.context_agent import ContextAgent
from agents.strategy_agent import StrategyAgent
from agents.planning_agent import PlanningAgent
from core.event_log import EventLog

class Orchestrator:
    def __init__(self):
        self.context_agent = ContextAgent()
        self.strategy_agent = StrategyAgent()
        self.planning_agent = PlanningAgent()
        self.event_log = EventLog()
    
    def process_student(self, student_data):
        # Context Agent
        self.event_log.add("Context Agent", "Building student world model...")
        world_model = self.context_agent.build_world_model(student_data)
        
        # Strategy Agent
        self.event_log.add("Strategy Agent", "Creating long-term strategy...")
        strategy = self.strategy_agent.create_strategy(world_model, student_data)
        
        # Planning Agent
        self.event_log.add("Planning Agent", "Generating daily tasks...")
        tasks = self.planning_agent.create_daily_tasks(strategy, student_data)
        
        self.event_log.add("Orchestrator", "✓ System ready. Monitoring activated.")
        
        return {
            'world_model': world_model,
            'strategy': strategy,
            'tasks': tasks,
            'logs': self.event_log.get_all()
        }
```

**Used by**: Bridge `/api/student/setup` endpoint

---

## Core

### Event Log

**File**: `core/event_log.py`

Tracks agent activities with timestamps.

```python
from datetime import datetime

class EventLog:
    def __init__(self):
        self.logs = []
    
    def add(self, agent, action):
        self.logs.append({
            'agent': agent,
            'action': action,
            'timestamp': datetime.now().isoformat()
        })
    
    def get_all(self):
        return self.logs
```

### Gemini Client

**File**: `core/gemini_client.py`

Uses Google Gemini for AI generation. Requires `GEMINI_API_KEY`.

```python
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def generate(self, prompt):
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"
```

### Student State

**File**: `core/student_state.py`

Pydantic model for student data.

```python
from pydantic import BaseModel
from typing import List, Optional

class StudentState(BaseModel):
    exam: str
    deadline: int
    subjects: List[str]
    study_hours: int
    weak_areas: str
    tasks: List[dict] = []
    journey_map: List[dict] = []
```

---

## Integration

### Flow

```
1. Frontend requests study plan
2. Backend calls Bridge /api/study-plan/generate
3. Bridge imports and uses PlanningAgent
4. PlanningAgent uses GeminiClient
5. Gemini processes prompt
6. Response returns to frontend
```

### Bridge Endpoints

| Endpoint | Agent | Purpose |
|----------|-------|---------|
| `/api/student/setup` | Orchestrator | Full student setup |
| `/api/study-plan/generate` | PlanningAgent | Generate study plan |
| `/api/weak-areas/analyze` | StrategyAgent | Analyze weak areas |
| `/api/quiz-context` | ContextAgent | Get quiz context |

### Fallback Mode

If `GEMINI_API_KEY` is not set in `bridge/.env`, the bridge uses fallback code instead of agents.

```
bridge/.env:
GEMINI_API_KEY=your_key_here
```

---

## Setup

### 1. Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy key

### 2. Add to Bridge

Edit `bridge/.env`:
```
GEMINI_API_KEY=your_actual_key_here
```

### 3. Run Bridge

```bash
cd bridge
python api.py
```

### 4. Run Full Stack

```bash
# Terminal 1: Bridge
cd bridge && python api.py

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Testing Agents

### Test Individual Agent

```bash
cd bridge
python3 -c "
from agents.planning_agent import PlanningAgent
agent = PlanningAgent()
result = agent.create_daily_tasks('Focus on recursion', {'weak_areas': 'recursion', 'subjects': ['Algorithms'], 'study_hours': 2})
print(result)
"
```

### Test Import

```bash
cd bridge
python3 -c "
from agents.orchestrator import Orchestrator
from agents.planning_agent import PlanningAgent
from agents.strategy_agent import StrategyAgent
from agents.context_agent import ContextAgent
from core.event_log import EventLog
print('✓ All agents imported successfully')
"
```

### Test Bridge Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "ok", "bridge": "python", "agents_loaded": true}
```

---

## Troubleshooting

### "No module named 'google'"

Install the package:
```bash
pip install google-generativeai
```

### "Module not found" when importing agents

Make sure you're in the bridge directory:
```bash
cd bridge
python api.py
```

Or add parent to path:
```python
import sys
sys.path.insert(0, '..')
from agents.orchestrator import Orchestrator
```

### Agents not loading

Check bridge output on startup:
```
✓ Agents loaded successfully
```

If you see `⚠ Agents not available`, check:
1. `GEMINI_API_KEY` is set in `bridge/.env`
2. `google-generativeai` is installed
3. No import errors in agent files

---

## Adding New Agents

### Steps

1. Create agent file in `agents/`:
```python
# agents/my_agent.py
from core.gemini_client import GeminiClient

class MyAgent:
    def __init__(self):
        self.client = GeminiClient()
    
    def run(self, input_data):
        # Your logic here
        pass
```

2. Import in `bridge/api.py`:
```python
from agents.my_agent import MyAgent
```

3. Use in endpoint:
```python
@app.post("/api/my-endpoint")
async def my_endpoint(request: MyRequest):
    agent = MyAgent()
    result = agent.run(request.data)
    return {"result": result}
```

---

## Credits

- Built with FastAPI (Python)
- Uses Google Gemini for AI generation
- Integrated with Next.js 14 + Node.js full stack