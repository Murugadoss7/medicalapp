# AI Agent Service
## Medical Assistant for Prescription Management System

Intelligent agent that helps admins and doctors with medical operations through natural language chat interface.

---

## Features

- **Natural Language Interface:** Chat with the agent to perform medical operations
- **Multi-LLM Support:** Works with OpenAI (GPT-4), Anthropic (Claude), or Ollama (local)
- **Conversation Memory:** Remembers context within a session
- **Medical Operations:**
  - Create doctors, patients
  - Schedule appointments
  - Search for availability
  - And more...

---

## Architecture

This is a **separate microservice** that runs independently from the medical backend:

```
Frontend (5173) → Agent Service (8001) → Medical API (8000) → Database
```

**Benefits:**
- Medical backend stays clean (no LangChain dependencies)
- Truly optional deployment
- Independent scaling
- Clear separation of concerns

---

## Prerequisites

- Python 3.10 or higher
- pip or uv package manager
- Medical backend running on port 8000
- LLM API key (OpenAI, Anthropic) OR Ollama installed locally

---

## Quick Start

### 1. Install Dependencies

```bash
cd prescription-management/agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env

# Required: Set LLM provider and API key
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Medical Backend (if not running)

```bash
cd ../backend
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
python3 -m uvicorn app.main:app --reload --port 8000
```

### 4. Start Agent Service

```bash
cd ../agent
python3 -m uvicorn app.main:app --reload --port 8001
```

Agent service will be available at: `http://localhost:8001`

### 5. Test with Console (Optional)

```bash
python console_chat.py
```

---

## Configuration

### LLM Providers

#### Option 1: OpenAI (Easiest)
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

**Get API Key:** https://platform.openai.com/api-keys

#### Option 2: Anthropic Claude (Best Reasoning)
```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

**Get API Key:** https://console.anthropic.com/

#### Option 3: Ollama (Free, Local)
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

**Install Ollama:** https://ollama.ai/download

Then run: `ollama pull llama2`

---

## API Endpoints

### Chat Endpoint
```bash
POST /api/v1/agent/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "Create a doctor named John Smith specializing in Cardiology",
  "session_id": "user-123"
}
```

**Response:**
```json
{
  "response": "I've successfully created Dr. John Smith as a Cardiologist in the system.",
  "session_id": "user-123",
  "timestamp": "2025-01-22T10:30:00Z"
}
```

### Health Check
```bash
GET /api/v1/agent/health
```

**Response:**
```json
{
  "status": "healthy",
  "llm_provider": "openai",
  "model": "gpt-4-turbo-preview"
}
```

---

## Available Tools (Agent Capabilities)

The agent can perform these operations:

### Doctor Management
- `create_doctor` - Create new doctor profile
- `search_doctors` - Find doctors by specialization

### Patient Management
- `create_patient` - Register new patient
- `search_patients` - Find patient by mobile/name

### Appointment Management
- `check_availability` - Get available time slots
- `schedule_appointment` - Book appointment
- `cancel_appointment` - Cancel existing appointment

---

## Example Conversations

### Example 1: Create Doctor
```
You: Create a doctor named Sarah Johnson who specializes in Pediatrics
     with email sarah@clinic.com

Agent: I've successfully created Dr. Sarah Johnson (Pediatrics) in the system.
       Doctor ID: abc-123-def
```

### Example 2: Schedule Appointment with Context
```
You: I need to schedule an appointment for patient mobile 9876543210

Agent: I found the patient: John Doe. Which doctor would you like to
       schedule with, and what date/time?

You: Dr. Sarah Johnson tomorrow at 2 PM

Agent: Appointment scheduled successfully!
       Patient: John Doe
       Doctor: Dr. Sarah Johnson (Pediatrics)
       Date: 2025-01-23 at 2:00 PM
       Appointment ID: appt-456
```

### Example 3: Multi-Step Task
```
You: I want to create a new patient and schedule an appointment

Agent: Sure! Let's start with the patient. What is the patient's name,
       mobile number, and date of birth?

You: Name is Mike Brown, mobile 9123456789, DOB 1990-05-15

Agent: Patient Mike Brown registered successfully. Now, which doctor
       would you like to schedule with?

You: Find me a cardiologist

Agent: I found Dr. John Smith (Cardiology). What date and time works?

You: Next Monday at 10 AM

Agent: Perfect! Appointment scheduled for Monday, Jan 27 at 10 AM with
       Dr. John Smith for patient Mike Brown.
```

---

## Testing

### Console Testing
```bash
python console_chat.py
```

### Unit Tests
```bash
pytest tests/ -v
```

### API Testing with curl
```bash
# Get JWT token from medical backend first
TOKEN="your-jwt-token"

# Test chat
curl -X POST http://localhost:8001/api/v1/agent/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create doctor John Smith", "session_id": "test-123"}'
```

---

## Development

### Project Structure
```
agent/
├── app/
│   ├── agent/              # Agent core logic
│   │   ├── llm_provider.py    # Multi-LLM support
│   │   ├── agent_core.py      # LangChain agent
│   │   └── memory_manager.py  # Conversation memory
│   ├── tools/              # Medical operation tools
│   │   ├── doctor_tools.py
│   │   ├── patient_tools.py
│   │   └── appointment_tools.py
│   ├── api/                # FastAPI endpoints
│   │   └── chat.py
│   ├── clients/            # External API clients
│   │   └── medical_api_client.py
│   ├── config.py           # Configuration
│   └── main.py             # FastAPI app
├── tests/                  # Tests
├── console_chat.py         # Console interface
├── requirements.txt        # Dependencies
└── README.md              # This file
```

### Adding New Tools

1. Create tool function in appropriate file (e.g., `tools/doctor_tools.py`)
2. Use `@tool` decorator from LangChain
3. Write clear docstring (agent uses this to understand the tool)
4. Register tool in `agent_core.py`

**Example:**
```python
from langchain.tools import tool

@tool
async def my_new_tool(param: str) -> str:
    """
    Clear description of what this tool does.

    The agent will read this description to decide when to use this tool.
    """
    # Implementation
    return "Result"
```

---

## Troubleshooting

### Agent Service Won't Start

**Issue:** Port 8001 already in use
```bash
# Find process using port
lsof -i :8001

# Kill process
kill -9 <PID>
```

### LLM API Errors

**Issue:** OpenAI authentication error
- Check API key in `.env`
- Verify key at: https://platform.openai.com/api-keys
- Check billing/usage limits

**Issue:** Ollama connection error
- Ensure Ollama is running: `ollama serve`
- Check model is installed: `ollama list`
- Pull model if needed: `ollama pull llama2`

### Medical API Connection Errors

**Issue:** Can't connect to medical backend
- Verify medical backend is running on port 8000
- Check `MEDICAL_API_URL` in `.env`
- Test medical API: `curl http://localhost:8000/api/v1/health`

### Agent Not Understanding Requests

**Issue:** Agent gives wrong responses
- Try more specific language
- Break complex requests into steps
- Check `AGENT_VERBOSE=true` to see agent thinking
- Try different LLM provider (Claude often better at reasoning)

---

## Security

### Authentication
- All endpoints require valid JWT token from medical backend
- Token validated against medical API
- Only admins and doctors can access agent

### Rate Limiting
- Consider adding rate limiting for production
- Prevent abuse of LLM API

### Data Privacy
- Agent doesn't store conversation data permanently
- Sessions expire after `SESSION_TTL` (default 1 hour)
- All medical operations go through authenticated medical API

---

## Performance

### Latency
- Typical response time: 2-5 seconds (depends on LLM)
- Tool execution adds ~100-500ms
- Use GPT-3.5-turbo or Claude Haiku for faster responses

### Scaling
- Agent service is stateless (except memory)
- Can run multiple instances behind load balancer
- Consider Redis for shared session storage in production

---

## Production Deployment

### Checklist
- [ ] Use production-grade ASGI server (gunicorn + uvicorn)
- [ ] Add rate limiting
- [ ] Set up monitoring (LangSmith, OpenTelemetry)
- [ ] Use Redis for session storage
- [ ] Configure proper CORS
- [ ] Set up logging aggregation
- [ ] Add health checks
- [ ] Configure alerts

### Docker Deployment (Future)
```bash
# Build image
docker build -t medical-agent:latest .

# Run container
docker run -p 8001:8001 --env-file .env medical-agent:latest
```

---

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Use type hints
5. Format with black: `black app/`

---

## License

Part of Prescription Management System

---

## Support

For issues or questions:
- Check this README
- Review `AGENT_SERVICE_PLAN.md` for architecture details
- Check LangChain docs: https://docs.langchain.com
- Review console chat logs with `AGENT_VERBOSE=true`

---

**Built with:**
- LangChain for agent framework
- FastAPI for web framework
- OpenAI/Anthropic/Ollama for LLM
