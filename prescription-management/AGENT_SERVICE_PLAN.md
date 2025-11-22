# AI Agent Service - Implementation Plan
## Separate Microservice for Medical Assistant

**Branch:** `feature/ai-agent-integration`
**Architecture:** Separate service (Port 8001)
**Medical Backend:** Unchanged (Port 8000)

---

## Overview

We're building a **separate AI Agent service** that helps admins and doctors with medical operations through natural language chat interface.

### Why Separate Service?
✅ Keeps medical backend clean (no LangChain dependencies)
✅ Truly optional (deploy only if needed)
✅ Independent failures (agent crash ≠ medical crash)
✅ Clear separation of concerns
✅ Easy to scale or remove

### Architecture
```
Frontend (5173) → Agent Service (8001) → Medical API (8000) → Database
                      ↓
                  LangChain + Tools
```

---

## Project Structure

```
prescription-management/
├── backend/                         # Medical API (UNCHANGED)
│   └── app/
│       ├── api/
│       ├── services/
│       └── models/
│
├── agent/                           # NEW: Agent Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app (port 8001)
│   │   ├── config.py               # Configuration
│   │   │
│   │   ├── agent/                  # Agent Core
│   │   │   ├── __init__.py
│   │   │   ├── llm_provider.py    # Multi-LLM support
│   │   │   ├── agent_core.py      # LangChain agent
│   │   │   └── memory_manager.py  # Conversation memory
│   │   │
│   │   ├── tools/                  # Medical operation tools
│   │   │   ├── __init__.py
│   │   │   ├── base_tool.py       # Base tool class
│   │   │   ├── doctor_tools.py    # Doctor operations
│   │   │   ├── patient_tools.py   # Patient operations
│   │   │   └── appointment_tools.py
│   │   │
│   │   ├── api/                    # REST API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── chat.py            # Chat endpoint
│   │   │   └── health.py          # Health check
│   │   │
│   │   └── clients/                # External API clients
│   │       ├── __init__.py
│   │       └── medical_api_client.py  # Calls medical backend
│   │
│   ├── tests/                      # Tests
│   │   ├── test_llm_provider.py
│   │   ├── test_agent_core.py
│   │   └── test_tools.py
│   │
│   ├── console_chat.py             # Console testing
│   ├── requirements.txt            # LangChain dependencies
│   ├── .env.example                # Environment template
│   └── README.md                   # Agent documentation
│
└── frontend/                        # Will add chat UI later
```

---

## Implementation Phases

### ✅ Phase 1: Project Setup (Current)
**Goal:** Create service structure and configuration

**Tasks:**
- [x] Create git branch: `feature/ai-agent-integration`
- [ ] Create `agent/` directory structure
- [ ] Create configuration files
- [ ] Set up dependencies (requirements.txt)
- [ ] Create README with setup instructions

**What You'll Learn:**
- Project organization
- Configuration management
- Dependency isolation

---

### Phase 2: LLM Provider Abstraction
**Goal:** Support multiple LLM providers (OpenAI/Claude/Ollama)

**Files to Create:**
- `agent/app/agent/llm_provider.py`
- `agent/app/config.py`
- `agent/.env.example`

**What You'll Learn:**
- **Factory Pattern:** Creating different LLM instances based on config
- **Abstraction:** Write once, work with any LLM
- **Environment Variables:** Secure API key management

**Concept:**
```python
# One interface, multiple providers
llm = LLMProvider.create("openai", config)   # or
llm = LLMProvider.create("claude", config)   # or
llm = LLMProvider.create("ollama", config)
```

**LangChain Reference:** https://docs.langchain.com/oss/python/langchain/agents

---

### Phase 3: Conversation Memory
**Goal:** Enable agent to remember conversation context

**Files to Create:**
- `agent/app/agent/memory_manager.py`

**What You'll Learn:**
- **Session Management:** Track user conversations
- **Buffer Memory:** Keep last N messages
- **Context Windows:** Handle LLM token limits

**Concept:**
```python
# User says: "Create doctor John Smith"
# Agent responds: "Doctor created"
# User says: "What was his name?"
# Agent remembers: "John Smith" ← Memory!
```

**LangChain Reference:** https://docs.langchain.com/oss/python/langchain/memory

---

### Phase 4: Medical API Client
**Goal:** Create HTTP client to call medical backend

**Files to Create:**
- `agent/app/clients/medical_api_client.py`

**What You'll Learn:**
- **Async HTTP:** Using httpx for non-blocking calls
- **JWT Token Handling:** Pass authentication
- **Error Handling:** Graceful failure handling

**Concept:**
```python
# Agent tool calls medical API via HTTP
client = MedicalAPIClient("http://localhost:8000")
doctor = await client.create_doctor(data, auth_token)
```

---

### Phase 5: First Tool - Create Doctor
**Goal:** Create one tool and test the complete flow

**Files to Create:**
- `agent/app/tools/base_tool.py`
- `agent/app/tools/doctor_tools.py`

**What You'll Learn:**
- **LangChain Tools:** How to define tools
- **Tool Descriptions:** Help agent understand when to use tools
- **Function Calling:** How LLMs call functions

**Concept:**
```python
@tool
def create_doctor(first_name: str, last_name: str, specialization: str) -> str:
    """
    Create a new doctor in the medical system.

    Use this when the user wants to add a new doctor.
    """
    # Implementation
```

**LangChain Reference:** https://docs.langchain.com/oss/python/langchain/tools

---

### Phase 6: Agent Core
**Goal:** Create the LangChain agent that orchestrates everything

**Files to Create:**
- `agent/app/agent/agent_core.py`

**What You'll Learn:**
- **Agent Executors:** How agents think and act
- **Prompt Engineering:** Writing effective system prompts
- **Tool Binding:** Connecting tools to agents
- **ReAct Pattern:** Reasoning + Acting loop

**Concept:**
```python
# Agent thinking process:
# 1. Receive message: "Create doctor John Smith"
# 2. Understand intent: User wants to create doctor
# 3. Check tools: I have create_doctor tool
# 4. Extract parameters: first_name="John", last_name="Smith"
# 5. Call tool
# 6. Return result
```

**Agent Loop (ReAct Pattern):**
```
User Input
    ↓
Reasoning: "What should I do?"
    ↓
Action: Call tool (create_doctor)
    ↓
Observation: "Doctor created"
    ↓
Reasoning: "Task complete"
    ↓
Response: "I've created Dr. John Smith"
```

---

### Phase 7: Console Testing
**Goal:** Test agent from command line

**Files to Create:**
- `agent/console_chat.py`
- `agent/tests/test_scenarios.py`

**What You'll Learn:**
- **Interactive Testing:** Chat with agent in terminal
- **Debugging:** See agent's thinking process
- **Edge Cases:** Test various scenarios

**Test Scenarios:**
```bash
# Scenario 1: Simple creation
You: "Create a doctor named Sarah Johnson specializing in Pediatrics"

# Scenario 2: Missing information
You: "Create a doctor"
Agent: "I need more information. What is the doctor's name and specialization?"

# Scenario 3: Context memory
You: "Create doctor John Smith in Cardiology"
Agent: "Doctor created"
You: "What was his name again?"
Agent: "John Smith"
```

---

### Phase 8: Additional Tools
**Goal:** Add patient and appointment tools

**Files to Create:**
- `agent/app/tools/patient_tools.py`
- `agent/app/tools/appointment_tools.py`

**Tools to Implement:**
1. `create_patient` - Register new patient
2. `search_doctors` - Find doctors by specialization
3. `get_available_slots` - Check doctor availability
4. `schedule_appointment` - Book appointment

---

### Phase 9: FastAPI Endpoints
**Goal:** Create REST API for chat

**Files to Create:**
- `agent/app/main.py` - FastAPI app
- `agent/app/api/chat.py` - Chat endpoint
- `agent/app/api/health.py` - Health check

**Endpoints:**
```
POST   /api/v1/agent/chat          # Send message, get response
GET    /api/v1/agent/health        # Service health check
DELETE /api/v1/agent/session/{id}  # Clear session memory
```

**What You'll Learn:**
- **FastAPI Routing:** Creating endpoints
- **Request Validation:** Pydantic models
- **JWT Validation:** Verify user tokens
- **CORS:** Allow frontend requests

---

### Phase 10: Frontend Integration
**Goal:** Add chat interface to React app

**Files to Create:**
- `frontend/src/components/agent/ChatAssistant.tsx`
- `frontend/src/components/agent/ChatMessage.tsx`
- `frontend/src/components/agent/ChatWindow.tsx`
- `frontend/src/services/agentService.ts`

**What You'll Learn:**
- **Chat UI:** Building conversational interfaces
- **WebSockets** (optional): Real-time streaming
- **State Management:** Redux for chat state

---

## Technology Stack

### Core Dependencies
```python
# agent/requirements.txt

# === LangChain Core ===
langchain==0.1.20
langchain-core==0.1.45
langchain-openai==0.1.6          # OpenAI (GPT-4)
langchain-anthropic==0.1.8       # Anthropic (Claude)
langchain-community==0.0.38      # Ollama + community

# === FastAPI ===
fastapi==0.110.0
uvicorn[standard]==0.29.0
pydantic==2.6.4
pydantic-settings==2.2.1

# === HTTP Client ===
httpx==0.27.0                    # Async HTTP client
aiohttp==3.9.3

# === Utilities ===
python-dotenv==1.0.1
pyjwt==2.8.0                     # JWT validation
python-multipart==0.0.9

# === Testing ===
pytest==8.1.1
pytest-asyncio==0.23.6
```

---

## Configuration

### Environment Variables (.env)
```bash
# === LLM Provider ===
# Choose: openai, claude, ollama
LLM_PROVIDER=openai

# === OpenAI ===
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# === Anthropic (Claude) ===
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# === Ollama (Local) ===
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# === Medical API ===
MEDICAL_API_URL=http://localhost:8000
MEDICAL_API_TIMEOUT=30

# === Agent Settings ===
AGENT_MAX_ITERATIONS=5
AGENT_VERBOSE=true
SESSION_TTL=3600

# === Server ===
HOST=0.0.0.0
PORT=8001
```

---

## Running the Services

### Development Setup

**Terminal 1: Medical Backend**
```bash
cd prescription-management/backend
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
python3 -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2: Agent Service**
```bash
cd prescription-management/agent
python3 -m uvicorn app.main:app --reload --port 8001
```

**Terminal 3: Frontend**
```bash
cd prescription-management/frontend
npm run dev
```

### Console Testing (Before UI)
```bash
cd prescription-management/agent
python console_chat.py
```

---

## Testing Strategy

### 1. Unit Tests
```bash
cd prescription-management/agent
pytest tests/ -v
```

### 2. Console Testing
```bash
python console_chat.py

# Test scenarios:
# - Create doctor
# - Register patient
# - Schedule appointment
# - Multi-turn conversations
# - Error handling
```

### 3. API Testing
```bash
# Start agent service
python -m uvicorn app.main:app --port 8001

# Test with curl
curl -X POST http://localhost:8001/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Create a doctor named John Smith", "session_id": "test-123"}'
```

### 4. Integration Testing
- Start all 3 services (medical, agent, frontend)
- Test complete flow through UI
- Verify agent actions in database

---

## Learning Resources

### LangChain Official Docs
1. **Agents:** https://docs.langchain.com/oss/python/langchain/agents
   - Understanding ReAct pattern
   - Agent executors
   - Tool calling

2. **Tools:** https://docs.langchain.com/oss/python/langchain/tools
   - Creating custom tools
   - Tool descriptions
   - Error handling

3. **Memory:** https://docs.langchain.com/oss/python/langchain/memory
   - Buffer memory
   - Conversation summary
   - Session management

4. **LLM Integration:** https://docs.langchain.com/oss/python/langchain/llms
   - OpenAI integration
   - Anthropic (Claude) integration
   - Local models (Ollama)

### Recommended Reading Order
1. Start with Agents concepts
2. Learn about Tools
3. Understand Memory
4. Practice with examples

---

## Success Metrics

### Phase Completion Checklist

**Phase 1: Setup** ✅
- [ ] Directory structure created
- [ ] Dependencies installed
- [ ] Configuration files ready

**Phase 2-3: Core Agent** 🔄
- [ ] LLM provider works with OpenAI
- [ ] Can switch to Claude/Ollama via config
- [ ] Memory remembers conversation context

**Phase 4-5: First Tool** 🔄
- [ ] Medical API client works
- [ ] Create doctor tool functional
- [ ] Agent successfully creates doctors

**Phase 6-7: Testing** 🔄
- [ ] Agent core logic complete
- [ ] Console chat works
- [ ] Can have multi-turn conversations

**Phase 8-9: Complete Service** 🔄
- [ ] All tools implemented
- [ ] FastAPI endpoints ready
- [ ] Service runs independently

**Phase 10: Integration** 🔄
- [ ] Frontend chat UI built
- [ ] Can chat from web interface
- [ ] All features working end-to-end

---

## Next Steps

1. **Review this plan** - Understand architecture
2. **Set up environment** - Install Python, create venv
3. **Start Phase 1** - Create project structure
4. **Learn as we build** - Each phase teaches concepts
5. **Test frequently** - Console testing after each phase

---

## Support & Questions

As we build:
- I'll explain each concept
- Add detailed comments in code
- Test after each phase
- Adjust plan based on learning

**Ready to start?** Let's create the agent service! 🚀
