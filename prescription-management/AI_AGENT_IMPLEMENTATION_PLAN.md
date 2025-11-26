# AI Agent Implementation Plan
## Medical App Assistant - Educational Guide

---

## Table of Contents
1. [What is an AI Agent?](#what-is-an-ai-agent)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Technology Stack](#technology-stack)
5. [Code Structure & Explanation](#code-structure--explanation)
6. [Testing Strategy](#testing-strategy)

---

## What is an AI Agent?

### Simple Explanation
An **AI Agent** is like a smart assistant that can:
1. **Understand** what you ask (using LLM like GPT-4, Claude)
2. **Decide** what actions to take
3. **Execute** actions using tools (like calling APIs)
4. **Remember** previous conversations (memory)
5. **Respond** with results

### Example Flow:
```
User: "Create a new doctor named John Smith who specializes in cardiology"

Agent thinks:
1. User wants to create a doctor ✓
2. I need: first_name, last_name, specialization ✓
3. I have a tool called "create_doctor" ✓
4. Let me use that tool with the provided information

Agent executes:
→ Calls create_doctor tool
→ Tool makes HTTP POST to /api/v1/doctors
→ Gets response from medical backend

Agent responds:
"Doctor John Smith (Cardiology) has been created successfully. Doctor ID: abc-123"
```

---

## Architecture Overview

### Simple Architecture (What We're Building)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  - User types in chat: "Schedule appointment for patient..."    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Agent Module (prescription-management/agent/)       │
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Chat API   │──────│  LangChain   │──────│   Memory     │  │
│  │  (FastAPI)   │      │    Agent     │      │  (Session)   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Custom Tools (Python Functions)             │   │
│  │  - create_doctor()    - schedule_appointment()           │   │
│  │  - create_patient()   - search_doctors()                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Medical Backend (Existing - Port 8000)              │
│  - POST /api/v1/doctors       - POST /api/v1/appointments       │
│  - POST /api/v1/patients      - GET  /api/v1/doctors/search     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components Explained

#### 1. Chat API (FastAPI Endpoint)
- **What**: REST API that receives chat messages
- **Why**: Entry point for user requests
- **Example**: `POST /api/v1/agent/chat { "message": "Create doctor..." }`

#### 2. LangChain Agent
- **What**: The "brain" that decides what to do
- **Why**: Converts natural language to tool calls
- **How**: Uses LLM (GPT-4/Claude/Llama) to understand intent

#### 3. Memory (Session-based)
- **What**: Stores conversation history
- **Why**: Remember context from previous messages
- **Example**: User says "Schedule it for tomorrow" - agent remembers "it" = appointment discussed earlier

#### 4. Custom Tools
- **What**: Python functions that perform actions
- **Why**: Agent needs to actually DO things, not just talk
- **Example**: `create_doctor()` function calls medical backend API

---

## Implementation Phases

### Phase 1: Foundation Setup (Educational Focus)

**Goal**: Set up project structure and understand components

**Files to Create**:
```
prescription-management/
└── agent/
    ├── __init__.py
    ├── config.py              # Configuration for LLMs
    ├── README.md              # Agent module documentation
    ├── requirements.txt       # Agent-specific dependencies
    └── docs/
        └── CONCEPTS.md        # Educational concepts guide
```

**What You'll Learn**:
- How to structure a Python module
- Configuration management
- Dependency management

---

### Phase 2: Multi-LLM Support (Core Agent)

**Goal**: Create agent that works with OpenAI, Claude, or open-source LLMs

**Files to Create**:
```
agent/
├── llm_provider.py           # LLM abstraction layer
├── agent_core.py             # Main agent logic
└── tests/
    └── test_llm_provider.py  # Test different LLMs
```

**What You'll Learn**:
- **Abstraction**: How to write code that works with multiple LLM providers
- **Factory Pattern**: Choose LLM at runtime based on config
- **API Integration**: Connect to OpenAI, Anthropic, Ollama APIs

**Code Concept**:
```python
# llm_provider.py
class LLMProvider:
    """Factory to create different LLM instances"""

    @staticmethod
    def create(provider: str, config: dict):
        if provider == "openai":
            return ChatOpenAI(model=config['model'], api_key=config['api_key'])
        elif provider == "claude":
            return ChatAnthropic(model=config['model'], api_key=config['api_key'])
        elif provider == "ollama":
            return ChatOllama(model=config['model'])
        else:
            raise ValueError(f"Unknown provider: {provider}")
```

**Educational Note**: This is called the **Factory Pattern** - one function creates different objects based on input.

---

### Phase 3: Conversation Memory

**Goal**: Enable agent to remember conversation context

**Files to Create**:
```
agent/
├── memory_manager.py         # Memory system
├── session_store.py          # Store sessions (in-memory or Redis)
└── tests/
    └── test_memory.py        # Test memory functionality
```

**What You'll Learn**:
- **Session Management**: How to track user sessions
- **Memory Types**: Buffer memory vs. summarization memory
- **Context Window**: Managing token limits

**Memory Types Explained**:

1. **Buffer Memory** (Simple)
   - Stores last N messages
   - Example: Last 10 messages in conversation
   - Use when: Conversations are short

2. **Conversation Summary Memory** (Smart)
   - Summarizes old messages, keeps recent ones
   - Example: "User previously discussed creating a doctor named John"
   - Use when: Conversations are long

**Code Concept**:
```python
# memory_manager.py
from langchain.memory import ConversationBufferMemory

class MemoryManager:
    """Manages conversation memory per session"""

    def __init__(self):
        self.sessions = {}  # session_id -> memory

    def get_memory(self, session_id: str):
        """Get or create memory for a session"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationBufferMemory(
                return_messages=True,
                memory_key="chat_history"
            )
        return self.sessions[session_id]
```

**Educational Note**: Memory is like giving the agent a notepad to remember what was discussed.

---

### Phase 4: Custom Tools (The Action Layer)

**Goal**: Create tools that call medical backend APIs

**Files to Create**:
```
agent/
├── tools/
│   ├── __init__.py
│   ├── base_tool.py          # Base class for all tools
│   ├── doctor_tools.py       # Doctor-related tools
│   ├── patient_tools.py      # Patient-related tools
│   ├── appointment_tools.py  # Appointment tools
│   └── search_tools.py       # Search functionality
├── api_client.py             # HTTP client for medical backend
└── tests/
    └── tools/
        └── test_doctor_tools.py
```

**What You'll Learn**:
- **Tool Definition**: How to define tools for LangChain
- **API Integration**: Making HTTP requests to medical backend
- **Error Handling**: What to do when API calls fail
- **Tool Design**: Writing clear descriptions for the agent

**Tool Anatomy Explained**:

```python
from langchain.tools import tool

@tool
def create_doctor(
    first_name: str,
    last_name: str,
    specialization: str,
    email: str,
    auth_token: str
) -> str:
    """
    Create a new doctor in the medical system.

    Args:
        first_name: Doctor's first name
        last_name: Doctor's last name
        specialization: Medical specialization (e.g., Cardiology)
        email: Doctor's email address
        auth_token: JWT token for authentication

    Returns:
        Success message with doctor ID or error message
    """
    # This description helps the agent know WHEN to use this tool
    # The agent reads this and decides: "User wants to create a doctor?
    # This tool matches!"

    try:
        # Make HTTP request to medical backend
        response = requests.post(
            "http://localhost:8000/api/v1/doctors",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "first_name": first_name,
                "last_name": last_name,
                "specialization": specialization,
                "email": email
            }
        )
        response.raise_for_status()
        doctor = response.json()
        return f"Successfully created doctor: {first_name} {last_name} (ID: {doctor['id']})"

    except requests.HTTPError as e:
        return f"Error creating doctor: {str(e)}"
```

**Educational Notes**:
- **@tool decorator**: Tells LangChain "this is a tool the agent can use"
- **Docstring**: The description is CRITICAL - agent reads it to understand the tool
- **Type hints**: Helps agent know what data types to pass
- **Error handling**: Always return a string, even on error

---

### Phase 5: Agent Core Logic

**Goal**: Bring everything together - LLM + Memory + Tools

**Files to Create**:
```
agent/
├── agent_executor.py         # Main agent logic
├── prompts.py                # System prompts
└── tests/
    └── test_agent_executor.py
```

**What You'll Learn**:
- **Agent Architecture**: How all pieces fit together
- **Prompt Engineering**: Writing effective system prompts
- **Tool Binding**: Connecting tools to the agent
- **Execution Loop**: How agent thinks and acts

**Agent Execution Flow**:

```python
# agent_executor.py
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate

class MedicalAgent:
    """The main agent that orchestrates everything"""

    def __init__(self, llm, tools, memory):
        self.llm = llm
        self.tools = tools
        self.memory = memory

        # System prompt - tells agent its role
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful medical assistant for a clinic management system.

            You can help with:
            - Creating and managing doctor profiles
            - Registering patients
            - Scheduling appointments
            - Searching for doctors and patients

            Always be professional and ask for clarification if needed.
            When creating entities, confirm the details before executing.
            """),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])

        # Create the agent
        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)

        # Create executor (runs the agent)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,  # See what agent is thinking
            max_iterations=5,  # Prevent infinite loops
            handle_parsing_errors=True
        )

    def chat(self, message: str, session_id: str) -> str:
        """
        Process a chat message and return response

        Flow:
        1. User message → Agent
        2. Agent thinks: "What tools do I need?"
        3. Agent calls tools (if needed)
        4. Agent formulates response
        5. Response → User
        """
        result = self.agent_executor.invoke({
            "input": message,
            "session_id": session_id
        })
        return result["output"]
```

**Educational Notes**:
- **System Prompt**: Like giving instructions to a human assistant
- **Placeholders**: Special slots for chat history and agent thinking
- **Agent Scratchpad**: Where agent writes its "thoughts"
- **Verbose mode**: See agent's thinking process (great for learning!)

---

### Phase 6: Console Testing (Interactive Learning)

**Goal**: Test agent from command line before building UI

**Files to Create**:
```
agent/
├── console_chat.py           # Interactive console interface
└── tests/
    └── test_scenarios.py     # Automated test scenarios
```

**What You'll Learn**:
- **Interactive Testing**: Chat with agent in terminal
- **Debugging**: See exactly what agent is doing
- **Scenario Testing**: Test common use cases

**Console Interface**:

```python
# console_chat.py
import asyncio
from agent_executor import MedicalAgent
from llm_provider import LLMProvider
from memory_manager import MemoryManager
from tools import get_all_tools

async def main():
    """Interactive console chat with agent"""

    print("=" * 60)
    print("Medical Assistant Agent - Console Interface")
    print("=" * 60)
    print("\nCommands:")
    print("  /quit - Exit")
    print("  /clear - Clear conversation history")
    print("  /debug - Toggle debug mode")
    print("\n")

    # Initialize agent
    config = load_config()
    llm = LLMProvider.create(config['llm_provider'], config)
    memory = MemoryManager()
    tools = get_all_tools(config['medical_api_url'])

    agent = MedicalAgent(llm, tools, memory.get_memory("console-session"))

    print("Agent ready! You can start chatting.")
    print("Example: 'Create a doctor named John Smith specializing in Cardiology'\n")

    while True:
        # Get user input
        user_input = input("You: ").strip()

        if not user_input:
            continue

        if user_input == "/quit":
            print("Goodbye!")
            break

        if user_input == "/clear":
            memory.clear_session("console-session")
            print("Conversation cleared!")
            continue

        # Send to agent
        try:
            print("\nAgent: ", end="", flush=True)
            response = agent.chat(user_input, "console-session")
            print(response)
            print()
        except Exception as e:
            print(f"Error: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(main())
```

**Educational Note**: Console testing lets you see the agent in action and understand how it thinks before adding UI complexity.

---

### Phase 7: FastAPI Integration

**Goal**: Create REST API for agent chat

**Files to Create**:
```
agent/
├── api/
│   ├── __init__.py
│   ├── chat_endpoint.py      # Chat API endpoint
│   ├── session_endpoint.py   # Session management
│   └── health_endpoint.py    # Health check
└── main.py                   # FastAPI app
```

**What You'll Learn**:
- **REST API Design**: Creating chat endpoints
- **Session Management**: Managing user sessions
- **Authentication**: Validating JWT tokens
- **Streaming**: Real-time chat responses (optional)

**API Structure**:

```python
# api/chat_endpoint.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    authorization: str = Header(...)
):
    """
    Chat with the AI agent

    Flow:
    1. Validate JWT token
    2. Get user info from token
    3. Pass message to agent with user context
    4. Return agent response
    """
    try:
        # Validate token with medical backend
        user_info = await validate_token(authorization)

        # Check if user is admin or doctor
        if user_info['role'] not in ['admin', 'doctor']:
            raise HTTPException(403, "Only admins and doctors can use the agent")

        # Get agent response
        agent_service = get_agent_service()
        response = await agent_service.chat(
            message=request.message,
            session_id=request.session_id,
            user_info=user_info
        )

        return ChatResponse(
            response=response,
            session_id=request.session_id,
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")
```

**Educational Notes**:
- **Pydantic models**: Validate request/response data
- **JWT validation**: Ensure only authorized users access agent
- **Session ID**: Track conversations per user

---

### Phase 8: Frontend Integration

**Goal**: Add chat interface to React app

**Files to Create**:
```
frontend/src/
├── components/
│   └── agent/
│       ├── ChatAssistant.tsx     # Main chat component
│       ├── ChatMessage.tsx       # Message bubble
│       ├── ChatInput.tsx         # Input field
│       └── ChatWindow.tsx        # Chat container
├── services/
│   └── agentService.ts           # API calls to agent
└── store/
    └── slices/
        └── agentSlice.ts         # Redux state for chat
```

**What You'll Learn**:
- **Real-time UI**: Building chat interfaces
- **State Management**: Redux for chat state
- **WebSockets** (optional): Real-time streaming
- **UX Design**: Chat best practices

---

## Technology Stack

### Core Dependencies

```python
# agent/requirements.txt

# === Core LangChain ===
langchain==0.1.0              # Main framework
langchain-core==0.1.0         # Core abstractions

# === LLM Providers ===
# (Install only what you need)
langchain-openai==0.0.2       # OpenAI (GPT-4, GPT-3.5)
langchain-anthropic==0.0.1    # Anthropic (Claude)
langchain-community==0.0.10   # Community integrations (Ollama, etc.)

# === Memory & Storage ===
langchain-memory==0.0.1       # Conversation memory

# === API Framework ===
fastapi==0.104.1              # REST API
uvicorn==0.24.0               # ASGI server
pydantic==2.5.0               # Data validation

# === HTTP Client ===
httpx==0.25.0                 # Async HTTP client
aiohttp==3.9.0                # Alternative async HTTP

# === Utilities ===
python-dotenv==1.0.0          # Environment variables
pydantic-settings==2.1.0      # Settings management
pyjwt==2.8.0                  # JWT token validation

# === Testing ===
pytest==7.4.3                 # Testing framework
pytest-asyncio==0.21.1        # Async tests
pytest-mock==3.12.0           # Mocking
```

### Optional Dependencies

```python
# === Advanced Memory (Optional) ===
chromadb==0.4.18              # Vector database for semantic search
# Use when: Long conversation history, semantic search

# === Monitoring (Optional) ===
langsmith==0.0.70             # LangChain debugging/monitoring
# Use when: Production deployment, need observability

# === Rate Limiting (Optional) ===
slowapi==0.1.9                # API rate limiting
# Use when: Prevent abuse in production
```

---

## Configuration File Structure

```yaml
# agent/config.yaml

# === LLM Provider Configuration ===
llm:
  # Choose: "openai", "claude", "ollama"
  provider: "openai"

  # Provider-specific settings
  openai:
    model: "gpt-4-turbo-preview"
    api_key: "${OPENAI_API_KEY}"  # From environment variable
    temperature: 0.7
    max_tokens: 1000

  claude:
    model: "claude-3-sonnet-20240229"
    api_key: "${ANTHROPIC_API_KEY}"
    temperature: 0.7
    max_tokens: 1000

  ollama:
    model: "llama2"
    base_url: "http://localhost:11434"
    temperature: 0.7

# === Memory Configuration ===
memory:
  type: "buffer"  # Options: buffer, summary
  max_messages: 20  # For buffer memory
  session_ttl: 3600  # Session timeout in seconds

# === Medical API Configuration ===
medical_api:
  base_url: "http://localhost:8000/api/v1"
  timeout: 30  # Request timeout in seconds

# === Agent Configuration ===
agent:
  max_iterations: 5  # Prevent infinite loops
  verbose: true  # Show agent thinking (dev mode)
  enable_confirmation: true  # Ask before critical actions

# === Security ===
security:
  allowed_roles: ["admin", "doctor"]
  require_confirmation: ["delete", "update"]

# === Logging ===
logging:
  level: "INFO"
  file: "agent.log"
```

---

## Testing Strategy

### 1. Unit Tests (Component Level)

Test individual components in isolation:

```python
# tests/test_llm_provider.py
def test_openai_provider_creation():
    """Test OpenAI provider can be created"""
    config = {"model": "gpt-3.5-turbo", "api_key": "test"}
    llm = LLMProvider.create("openai", config)
    assert llm is not None

# tests/test_memory_manager.py
def test_session_memory_creation():
    """Test memory is created per session"""
    manager = MemoryManager()
    memory1 = manager.get_memory("session-1")
    memory2 = manager.get_memory("session-2")
    assert memory1 != memory2

# tests/tools/test_doctor_tools.py
def test_create_doctor_tool():
    """Test doctor creation tool"""
    result = create_doctor(
        first_name="John",
        last_name="Smith",
        specialization="Cardiology",
        email="john@example.com",
        auth_token="fake-token"
    )
    assert "successfully" in result.lower() or "error" in result.lower()
```

### 2. Integration Tests (End-to-End)

Test complete flows:

```python
# tests/test_agent_integration.py
async def test_create_doctor_flow():
    """Test complete doctor creation flow"""
    agent = create_test_agent()

    response = await agent.chat(
        "Create a doctor named John Smith who specializes in Cardiology",
        session_id="test-session"
    )

    assert "john smith" in response.lower()
    assert "cardiology" in response.lower()
    assert "success" in response.lower() or "created" in response.lower()

async def test_appointment_scheduling_flow():
    """Test appointment scheduling with context"""
    agent = create_test_agent()

    # First message: Set context
    response1 = await agent.chat(
        "I want to schedule an appointment for patient John Doe",
        session_id="test-session"
    )

    # Second message: Use context
    response2 = await agent.chat(
        "Schedule it for tomorrow at 2 PM with Dr. Smith",
        session_id="test-session"
    )

    assert "scheduled" in response2.lower() or "appointment" in response2.lower()
```

### 3. Console Tests (Manual)

Test scenarios to try in console:

```
1. Doctor Creation:
   "Create a doctor named Sarah Johnson specializing in Pediatrics"

2. Patient Registration:
   "Register a new patient: Name is Mike Brown, mobile 9876543210, DOB 1990-05-15"

3. Appointment Scheduling:
   "Schedule an appointment for patient mobile 9876543210 with Dr. Sarah Johnson tomorrow at 3 PM"

4. Multi-turn Conversation:
   User: "I need to find a cardiologist"
   Agent: "I found 3 cardiologists..."
   User: "Schedule an appointment with the first one for next Monday at 10 AM"

5. Error Handling:
   "Create a doctor" (missing information - agent should ask for details)

6. Context Memory:
   User: "Create a doctor named John Smith"
   Agent: "Doctor created..."
   User: "What was his name again?"
   Agent: "John Smith" (remembers from context)
```

---

## Next Steps

Once we complete the plan review:

1. **Start with Phase 2**: LLM Provider setup (most educational)
2. **Build incrementally**: Test each phase before moving on
3. **Document everything**: Add comments explaining concepts
4. **Console test frequently**: See agent in action

---

## Questions to Answer Before Starting

1. **LLM Provider Preference**:
   - Start with OpenAI (easiest), Claude (best quality), or Ollama (free, local)?
   - Do you have API keys ready?

2. **Memory Storage**:
   - Start with in-memory (simple) or Redis (production-ready)?

3. **Testing Approach**:
   - Start with console testing or jump to API?

4. **Complexity Level**:
   - Start minimal (3 tools: create doctor, patient, appointment)?
   - Or full featured (all medical operations)?

---

**Ready to start implementation?** Let me know your preferences and we'll begin with Phase 2!
