# Testing Guide for Medical Assistant Agent

This guide walks you through testing the agent implementation step by step.

## Prerequisites

1. **Medical Backend Running**:
   ```bash
   cd prescription-management/backend
   DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
   python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **LLM API Key Configured**:
   - Option A: OpenAI (Recommended for testing)
     ```bash
     cd prescription-management/agent
     # Edit .env file
     LLM_PROVIDER=openai
     OPENAI_API_KEY=sk-your-actual-key-here
     ```
   
   - Option B: Anthropic Claude
     ```bash
     LLM_PROVIDER=claude
     ANTHROPIC_API_KEY=your-key-here
     ```
   
   - Option C: Ollama (Local, no API key needed)
     ```bash
     # First install and start Ollama
     ollama serve
     ollama pull llama2
     
     # In .env
     LLM_PROVIDER=ollama
     OLLAMA_MODEL=llama2
     ```

3. **Dependencies Installed**:
   ```bash
   cd prescription-management/agent
   pip3 install -r requirements.txt
   ```

## Testing Phase 1: Console Interface

### Start the Console

```bash
cd prescription-management/agent
python3 -m app.console
```

You should see:
```
======================================================================
🏥 Medical Assistant Agent - Interactive Console
======================================================================

Type '/help' for available commands
Type '/exit' to quit

You:
```

### Test Commands

1. **Show Help**:
   ```
   You: /help
   ```
   Should display all available commands.

2. **Show Examples**:
   ```
   You: /examples
   ```
   Should show sample conversation starters.

3. **Show Statistics**:
   ```
   You: /stats
   ```
   Should show agent statistics (sessions, tools, etc.).

4. **Toggle Verbose Mode**:
   ```
   You: /verbose off
   ```
   Disables agent thinking display (cleaner output).
   
   ```
   You: /verbose on
   ```
   Enables agent thinking display (see ReAct loop).

## Testing Phase 2: Agent Capabilities

### Test 1: Ask About Capabilities

```
You: What can you help me with?
```

**Expected**: Agent describes its capabilities (create doctors, search, etc.).

### Test 2: Search for Doctors (No Auth Required for Some Systems)

```
You: Search for doctors in Cardiology
```

**Expected**: 
- If backend allows unauthenticated search: List of doctors
- If auth required: Error message asking for authentication

### Test 3: Try to Create Doctor Without Full Info

```
You: Create a doctor named John Smith
```

**Expected**: Agent asks for missing required fields:
- Last name (provided: Smith)
- Email
- License number
- Specialization

The agent should respond with something like:
```
❌ Cannot create doctor yet. I need a few more details:
1. What is the doctor's email address?
2. What is the doctor's medical license number?
3. What is the doctor's specialization?
```

### Test 4: Provide Missing Information

Continue the conversation:
```
You: Email is john.smith@clinic.com, license is DOC123456, specialization is Cardiology
```

**Expected**: 
- If auth token provided: Doctor created successfully
- If no auth token: Error about authentication required

## Testing Phase 3: Authentication

### Get a JWT Token

First, login to get a token:

```bash
# Login as admin to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Copy the `access_token` from the response.

### Set Token in Console

```
You: /token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Now Try Creating Doctor

```
You: Create a doctor - name: Dr. Sarah Johnson, email: sarah.j@clinic.com, license: DOC789012, specialization: Neurology
```

**Expected**: ✅ Doctor created successfully with details displayed.

## Testing Phase 4: Multi-Turn Conversation

The agent remembers context within a session:

```
You: Create a doctor named Michael Chen
Agent: I need more details...

You: Email michael.chen@hospital.com
Agent: I still need...

You: License MED456789, specialization Pediatrics
Agent: ✅ Doctor created successfully!
```

**Expected**: Agent maintains context and collects information across multiple turns.

## Testing Phase 5: Error Handling

### Test Invalid Input

```
You: xyzabc random text 123
```

**Expected**: Agent tries to understand but may ask for clarification or suggest valid operations.

### Test Without Auth Token

```
You: /clear
You: Create doctor John Doe, john@test.com, LIC999, Cardiology
```

**Expected**: Error message about authentication required.

## Testing Phase 6: Session Management

### Clear Session

```
You: /clear
```

**Expected**: "✨ Session cleared. Starting fresh!"

Now ask:
```
You: What were we talking about?
```

**Expected**: Agent has no memory of previous conversation.

## Common Issues and Solutions

### Issue 1: "Invalid API Key" Error

**Problem**: OpenAI/Anthropic API key not configured or invalid.

**Solution**:
1. Check `.env` file in `agent/` directory
2. Ensure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set correctly
3. Verify key is valid at provider's dashboard

### Issue 2: "Medical API error" or Connection Refused

**Problem**: Medical backend not running or wrong URL.

**Solution**:
1. Start backend: `cd backend && python3 -m uvicorn app.main:app --reload`
2. Verify backend is running: `curl http://localhost:8000/api/v1/health`
3. Check `MEDICAL_API_URL` in agent `.env` file

### Issue 3: Agent Takes Long Time to Respond

**Problem**: LLM API is slow or model is too large.

**Solution**:
1. Use faster model: `OPENAI_MODEL=gpt-3.5-turbo` instead of `gpt-4`
2. Or use local Ollama with smaller model
3. Check internet connection

### Issue 4: "Module not found" Errors

**Problem**: Dependencies not installed.

**Solution**:
```bash
cd agent/
pip3 install -r requirements.txt
```

## Verification Checklist

After testing, verify these work:

- [ ] Console starts without errors
- [ ] `/help` command shows all commands
- [ ] `/examples` shows sample conversations
- [ ] Agent responds to "What can you help me with?"
- [ ] Agent detects missing required fields
- [ ] Agent asks for missing information
- [ ] With auth token, doctor creation works
- [ ] Multi-turn conversations work (agent remembers context)
- [ ] `/clear` resets the session
- [ ] `/stats` shows current statistics
- [ ] `/exit` closes gracefully

## Next Steps

After successful testing:

1. **Add More Tools** (Phase 8):
   - Patient management tools
   - Appointment scheduling tools
   
2. **Create REST API** (Phase 9):
   - FastAPI endpoints for HTTP access
   - WebSocket for real-time chat
   
3. **Frontend Integration** (Phase 10):
   - React chat UI
   - Message history display
   - Typing indicators

## Support

If you encounter issues:

1. Check logs for detailed error messages
2. Verify all prerequisites are met
3. Test each component individually:
   - Backend health: `curl http://localhost:8000/api/v1/health`
   - Agent imports: `python3 -c "from app.agent.medical_agent import create_medical_agent; print('OK')"`
   - Tools: `python3 -m app.tools.doctor_tools`
   - LLM provider: `python3 -m app.agent.llm_provider`

4. Reference the code comments - they explain each component in detail

---

**Happy Testing! 🚀**
