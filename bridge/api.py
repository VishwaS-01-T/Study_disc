"""
StudyOS Universal API
Multi-agent AI system for exam preparation
Integrated with agents/ and core/
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
import json
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="StudyOS Universal API",
    description="Multi-Agent AI System for Exam Preparation",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Import Agents and Core
# ============================================================================

try:
    from agents.orchestrator import Orchestrator
    from agents.planning_agent import PlanningAgent
    from agents.strategy_agent import StrategyAgent
    from agents.context_agent import ContextAgent
    from core.event_log import EventLog
    from core.gemini_client import GeminiClient
    AGENTS_AVAILABLE = True
    print("✓ Agents loaded successfully")
except ImportError as e:
    AGENTS_AVAILABLE = False
    print(f"⚠ Agents not available: {e}")

# Initialize agents
planning_agent = PlanningAgent() if AGENTS_AVAILABLE else None
strategy_agent = StrategyAgent() if AGENTS_AVAILABLE else None
context_agent = ContextAgent() if AGENTS_AVAILABLE else None
orchestrator = Orchestrator() if AGENTS_AVAILABLE else None
event_log = EventLog() if AGENTS_AVAILABLE else None

# ============================================================================
# Data Models
# ============================================================================

class StudentSetup(BaseModel):
    exam_name: str
    exam_type: str
    deadline: int
    subjects: List[str]
    subject_weightages: Dict[str, int]
    study_hours: int
    weak_areas: Optional[str] = ""
    strengths: Optional[str] = ""
    previous_attempts: str = "0"
    target_score: Optional[str] = ""
    study_style: str = "balanced"

class TestSubmission(BaseModel):
    student_id: str
    test_id: str
    answers: Dict[int, int]

class StudyPlanRequest(BaseModel):
    topics: List[str]
    exam_date: str
    weak_areas: Optional[str] = ""
    days: int = 14

class WeakAreaRequest(BaseModel):
    user_id: str
    practice_data: List[Dict[str, Any]] = []

class QuizContextRequest(BaseModel):
    room_topic: str
    room_name: str
    source_text: str = ""

# ============================================================================
# WebSocket Manager
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket
        print(f"Connected: {student_id}")
    
    def disconnect(self, student_id: str):
        if student_id in self.active_connections:
            del self.active_connections[student_id]
    
    async def send_log(self, student_id: str, agent: str, action: str, status: str):
        if student_id in self.active_connections:
            try:
                await self.active_connections[student_id].send_json({
                    "agent": agent,
                    "action": action,
                    "status": status,
                    "timestamp": datetime.now().isoformat()
                })
            except:
                self.disconnect(student_id)

manager = ConnectionManager()

# ============================================================================
# Storage
# ============================================================================

STUDENTS_DB = {}
TESTS_DB = {}

# ============================================================================
# Fallback Agent System (when agents unavailable)
# ============================================================================

class FallbackAgentSystem:
    @staticmethod
    def generate_study_plan(topics: List[str], exam_date: str, weak_areas: str, days: int):
        """Fallback study plan when agents unavailable"""
        plan = []
        start_date = datetime.now()
        
        for i in range(min(days, 14)):
            date = start_date.replace(day=start_date.day + i)
            date_str = date.strftime("%Y-%m-%d")
            
            topic_idx = i % len(topics) if topics else 0
            day_topics = [topics[topic_idx]] if topics else ["General"]
            
            if weak_areas and i < 3:
                day_topics.append(weak_areas.split(',')[0].strip())
            
            plan.append({
                "date": date_str,
                "topics": day_topics,
                "task": f"Study {day_topics[0]} - Practice problems",
                "estimated_minutes": 30 + (15 if i % 2 == 0 else 0)
            })
        
        return plan
    
    @staticmethod
    def analyze_weak_areas(practice_data: List[Dict]):
        if not practice_data:
            return []
        
        topic_stats: Dict[str, Dict[str, int]] = {}
        
        for attempt in practice_data:
            topic = attempt.get("topic", "General")
            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            
            topic_stats[topic]["total"] += 1
            if attempt.get("correct"):
                topic_stats[topic]["correct"] += 1
        
        weak_areas = []
        for topic, stats in topic_stats.items():
            accuracy = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0
            if accuracy < 70 and stats["total"] >= 3:
                weak_areas.append({
                    "topic": topic,
                    "accuracy": round(accuracy),
                    "attempts": stats["total"]
                })
        
        return sorted(weak_areas, key=lambda x: x["accuracy"])[:5]

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "StudyOS Universal API",
        "version": "2.0.0",
        "agents_available": AGENTS_AVAILABLE,
        "agents": ["Context", "Strategy", "Planning", "Execution", "Orchestrator"] if AGENTS_AVAILABLE else []
    }

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "bridge": "python",
        "agents_loaded": AGENTS_AVAILABLE
    }

@app.post("/api/student/setup")
async def setup_student(data: StudentSetup):
    """Setup student with all agents"""
    student_id = str(uuid.uuid4())
    
    student_data = {
        "id": student_id,
        "exam_name": data.exam_name,
        "exam_type": data.exam_type,
        "deadline": data.deadline,
        "subjects": data.subjects,
        "subject_weightages": data.subject_weightages,
        "study_hours": data.study_hours,
        "weak_areas": data.weak_areas,
        "created_at": datetime.now().isoformat()
    }
    
    STUDENTS_DB[student_id] = student_data
    
    if AGENTS_AVAILABLE and orchestrator:
        try:
            result = orchestrator.process_student(student_data)
            return {"status": "success", "student_id": student_id, "agent_result": result}
        except Exception as e:
            return {"status": "success", "student_id": student_id, "agent_error": str(e)}
    
    return {"status": "success", "student_id": student_id}

@app.post("/api/study-plan/generate")
async def generate_study_plan(data: StudyPlanRequest):
    """Generate study plan using Planning Agent"""
    
    if AGENTS_AVAILABLE and planning_agent:
        try:
            student_data = {
                "weak_areas": data.weak_areas,
                "subjects": data.topics,
                "study_hours": 2,
            }
            strategy = "Focus on weak areas: " + data.weak_areas if data.weak_areas else "Balanced coverage"
            
            result = planning_agent.create_daily_tasks(strategy, student_data)
            
            return {
                "plan": result,
                "source": "planning_agent",
                "agent": "PlanningAgent"
            }
        except Exception as e:
            print(f"Planning agent error: {e}")
    
    # Fallback
    plan = FallbackAgentSystem.generate_study_plan(
        data.topics,
        data.exam_date,
        data.weak_areas or "",
        data.days
    )
    
    return {
        "plan": plan,
        "source": "fallback",
        "agent": "FallbackAgentSystem"
    }

@app.post("/api/weak-areas/analyze")
async def analyze_weak_areas(data: WeakAreaRequest):
    """Analyze weak areas using Strategy Agent"""
    
    if AGENTS_AVAILABLE and strategy_agent:
        try:
            world_model = "Student practice data analysis"
            student_data = {
                "weak_areas": "",
                "subjects": [],
                "study_hours": 2,
            }
            
            result = strategy_agent.create_strategy(world_model, student_data)
            
            return {
                "analysis": result,
                "source": "strategy_agent",
                "agent": "StrategyAgent"
            }
        except Exception as e:
            print(f"Strategy agent error: {e}")
    
    # Fallback
    weak_areas = FallbackAgentSystem.analyze_weak_areas(data.practice_data)
    
    return {
        "weak_areas": weak_areas,
        "source": "fallback",
        "agent": "FallbackAgentSystem"
    }

@app.post("/api/quiz-context")
async def get_quiz_context(data: QuizContextRequest):
    """Get context for quiz generation using Context Agent"""
    
    if AGENTS_AVAILABLE and context_agent:
        try:
            student_data = {
                "exam": data.room_topic,
                "deadline": 30,
                "subjects": [data.room_topic],
                "study_hours": 2,
                "weak_areas": "",
            }
            
            result = context_agent.build_world_model(student_data)
            
            return {
                "context": result,
                "source": "context_agent",
                "agent": "ContextAgent"
            }
        except Exception as e:
            print(f"Context agent error: {e}")
    
    # Fallback
    return {
        "context": f"Quiz context for {data.room_topic}",
        "source": "fallback",
        "agent": "FallbackAgentSystem"
    }

@app.websocket("/ws/agents/{student_id}")
async def websocket_agent(websocket: WebSocket, student_id: str):
    """WebSocket for real-time agent updates"""
    await manager.connect(student_id, websocket)
    
    try:
        if student_id in STUDENTS_DB:
            student_data = STUDENTS_DB[student_id]
            setup_data = StudentSetup(
                exam_name=student_data["exam_name"],
                exam_type=student_data["exam_type"],
                deadline=student_data["deadline"],
                subjects=student_data["subjects"],
                subject_weightages=student_data["subject_weightages"],
                study_hours=student_data["study_hours"],
                weak_areas=student_data.get("weak_areas", ""),
            )
            
            if AGENTS_AVAILABLE and orchestrator:
                await orchestrator.process_student(setup_data.__dict__)
            else:
                await manager.send_log(student_id, "System", "Agents not available", "error")
        
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(student_id)

@app.get("/api/tasks/daily/{student_id}")
async def get_daily_tasks(student_id: str):
    if student_id not in STUDENTS_DB:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student = STUDENTS_DB[student_id]
    tasks = []
    
    if AGENTS_AVAILABLE and planning_agent:
        try:
            result = planning_agent.create_daily_tasks("strategy", student)
            tasks = [{"id": 1, "text": str(result), "completed": False}]
        except:
            pass
    
    if not tasks:
        tasks = [{"id": 1, "text": "Complete practice questions", "completed": False}]
    
    return {"tasks": tasks}

@app.get("/api/test/daily/{student_id}")
async def get_daily_test(student_id: str):
    if student_id not in STUDENTS_DB:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student = STUDENTS_DB[student_id]
    test_id = str(uuid.uuid4())
    questions = []
    
    for i, subject in enumerate(student.get("subjects", ["General"])[:10]):
        questions.append({
            "id": str(i + 1),
            "text": f"Sample {subject} question",
            "options": [f"{subject} Option A", f"{subject} Option B", f"{subject} Option C", f"{subject} Option D"],
            "correct": i % 4,
            "explanation": f"Explanation for {subject}",
            "topic": subject,
            "question_type": "mcq"
        })
    
    TESTS_DB[test_id] = questions
    return {"test_id": test_id, "questions": questions}

@app.post("/api/test/submit")
async def submit_test(submission: TestSubmission):
    if submission.test_id not in TESTS_DB:
        raise HTTPException(status_code=404, detail="Test not found")
    
    questions = TESTS_DB[submission.test_id]
    score = 0
    results = []
    
    for q in questions:
        user_answer = submission.answers.get(q["id"])
        is_correct = user_answer == q["correct"]
        if is_correct:
            score += 1
        results.append({
            "question_id": q["id"],
            "correct": is_correct,
            "explanation": q["explanation"]
        })
    
    return {
        "score": score,
        "total": len(questions),
        "accuracy": round((score / len(questions)) * 100, 2),
        "results": results
    }

@app.on_event("startup")
async def startup():
    print("=" * 50)
    print("StudyOS Bridge API Starting on port 5000...")
    print(f"Agents loaded: {AGENTS_AVAILABLE}")
    if AGENTS_AVAILABLE:
        print("Active agents: Context | Strategy | Planning | Orchestrator")
    else:
        print("Using fallback mode")
    print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)