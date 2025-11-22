"""
Medical Assistant Agent - Core Agent Implementation

This module implements the main agent that orchestrates all medical operations.
The agent uses LangChain's ReAct pattern to reason about user requests and take actions.

Educational Notes:
====================

**What is a ReAct Agent?**
ReAct = Reasoning + Acting
- The agent reasons about what to do
- Then acts by calling tools
- Then reasons about the results
- Repeats until task is complete

**Agent Loop:**
1. User: "Create doctor John Smith in Cardiology"
2. Agent Reasoning: "I need to use create_doctor_tool, but need more info"
3. Agent Action: Ask user for missing fields
4. User: Provides missing info
5. Agent Reasoning: "Now I have all required fields"
6. Agent Action: Call create_doctor_tool
7. Agent: Return success message

**Why This Architecture:**
- LLM handles natural language understanding
- Tools handle specific operations (API calls)
- Memory provides conversation context
- Agent orchestrates everything
"""

from typing import Dict, Any, Optional, List
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.memory import BaseMemory
from langchain_core.tools import BaseTool
import logging

from app.agent.llm_provider import create_llm_from_settings
from app.agent.memory_manager import create_memory_manager_from_settings
from app.tools.doctor_tools import (
    create_doctor_tool,
    search_doctors_tool,
    get_doctor_details_tool,
)

# Set up logging
logger = logging.getLogger(__name__)


class MedicalAgent:
    """
    Medical Assistant Agent - Main orchestration class.
    
    This agent helps users with medical practice management tasks like:
    - Creating and managing doctors
    - Registering and managing patients  
    - Scheduling appointments
    - Managing prescriptions
    
    The agent uses natural language to understand requests and intelligently
    asks for missing information before performing operations.
    
    Educational Note:
    - This is the "brain" of the agent system
    - It combines LLM (thinking) + Tools (actions) + Memory (context)
    - Uses LangChain's AgentExecutor for orchestration
    """
    
    def __init__(
        self,
        llm: Optional[BaseLanguageModel] = None,
        memory_manager: Optional[Any] = None,
        auth_token: Optional[str] = None,
        verbose: bool = True,
    ):
        """
        Initialize the medical agent.
        
        Args:
            llm: Language model to use (defaults to settings)
            memory_manager: Memory manager for conversations (defaults to settings)
            auth_token: JWT token for medical API authentication
            verbose: If True, shows agent's thinking process
            
        Educational Note:
        - llm is the "brain" - understands language and makes decisions
        - memory_manager stores conversation history
        - auth_token is passed to tools for API authentication
        - verbose mode helps you see how the agent thinks
        """
        # Initialize LLM
        self.llm = llm or create_llm_from_settings()
        
        # Initialize memory manager
        self.memory_manager = memory_manager or create_memory_manager_from_settings()
        
        # Store auth token (will be passed to tools)
        self.auth_token = auth_token
        
        # Verbose mode
        self.verbose = verbose
        
        # Initialize tools
        self.tools = self._initialize_tools()
        
        # Create agent prompt
        self.prompt = self._create_agent_prompt()
        
        # Agent executor will be created per session
        self._agent_executors: Dict[str, AgentExecutor] = {}
        
        logger.info(f"Medical Agent initialized with {len(self.tools)} tools")
    
    def _initialize_tools(self) -> List[BaseTool]:
        """
        Initialize all available tools for the agent.
        
        Returns:
            List of LangChain tools the agent can use
            
        Educational Note:
        - Each tool represents a capability
        - Agent decides which tool to use based on user request
        - More tools = more capabilities but slower decisions
        """
        tools = [
            # Doctor management tools
            create_doctor_tool,
            search_doctors_tool,
            get_doctor_details_tool,
            
            # More tools will be added in Phase 8:
            # - create_patient_tool
            # - search_patients_tool
            # - create_appointment_tool
            # - get_available_slots_tool
        ]
        
        return tools
    
    def _create_agent_prompt(self) -> PromptTemplate:
        """
        Create the system prompt that defines agent behavior.
        
        This prompt is crucial - it tells the agent:
        - Who it is and what it does
        - How to interact with users
        - How to use tools
        - How to handle missing information
        
        Returns:
            PromptTemplate for the agent
            
        Educational Note:
        - The prompt is like the agent's "job description"
        - Good prompts = better agent behavior
        - This uses ReAct format with reasoning steps
        """
        template = """You are a Medical Assistant Agent for a prescription management system.
You help doctors and administrators with medical practice management tasks.

IMPORTANT CAPABILITIES:
- Create and search for doctors
- Register and search for patients (coming soon)
- Schedule appointments (coming soon)
- Manage prescriptions (coming soon)

IMPORTANT GUIDELINES:
1. **Be Conversational**: Communicate naturally with users
2. **Ask for Missing Information**: If required fields are missing, ask the user politely
3. **Validate Before Acting**: Use tools to check if operations will succeed
4. **Provide Clear Feedback**: Explain what you're doing and what happened
5. **Handle Errors Gracefully**: If something fails, explain why and suggest solutions

AUTHENTICATION:
- You have an auth_token that must be passed to all tools
- If operations fail due to authentication, inform the user

TOOLS AVAILABLE:
You have access to the following tools:

{tools}

Tool Names: {tool_names}

TOOL USAGE FORMAT:
To use a tool, use this exact format:

Thought: I need to figure out what to do
Action: tool_name
Action Input: {{"parameter1": "value1", "parameter2": "value2"}}
Observation: [result from tool]

... (repeat Thought/Action/Action Input/Observation as needed)

Thought: I now know the final answer
Final Answer: [your response to the user]

CONVERSATION HISTORY:
{chat_history}

CURRENT REQUEST:
Question: {input}

AGENT WORK:
{agent_scratchpad}"""

        return PromptTemplate(
            template=template,
            input_variables=["input", "chat_history", "agent_scratchpad", "tools", "tool_names"],
        )
    
    def _get_agent_executor(self, session_id: str) -> AgentExecutor:
        """
        Get or create an agent executor for a session.
        
        Each session (user conversation) gets its own executor with its own memory.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            AgentExecutor configured for this session
            
        Educational Note:
        - AgentExecutor is LangChain's agent runner
        - It handles the ReAct loop (think -> act -> observe -> repeat)
        - Each session has isolated memory
        """
        if session_id not in self._agent_executors:
            # Get memory for this session
            memory = self.memory_manager.get_memory(session_id)
            
            # Create ReAct agent
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=self.prompt,
            )
            
            # Create executor
            executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                memory=memory,
                verbose=self.verbose,
                max_iterations=10,  # Prevent infinite loops
                handle_parsing_errors=True,  # Gracefully handle errors
                return_intermediate_steps=False,  # Return only final answer
            )
            
            self._agent_executors[session_id] = executor
            
            logger.info(f"Created agent executor for session: {session_id}")
        
        return self._agent_executors[session_id]
    
    async def process_message(
        self,
        message: str,
        session_id: str = "default",
        user_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Process a user message and return agent's response.
        
        This is the main method you'll use to interact with the agent.
        
        Args:
            message: User's message/request
            session_id: Session identifier (for memory)
            user_context: Additional context (user info, auth token, etc.)
            
        Returns:
            Agent's response as a string
            
        Educational Note:
        - This is the main entry point for agent interactions
        - The agent will reason about the message and decide what to do
        - May involve multiple tool calls and reasoning steps
        
        Example:
            response = await agent.process_message(
                message="Create a doctor named John Smith",
                session_id="user-123",
                user_context={"auth_token": "jwt-token-here"}
            )
        """
        try:
            # Update auth token if provided in context
            if user_context and user_context.get("auth_token"):
                self.auth_token = user_context["auth_token"]
            
            # Get agent executor for this session
            executor = self._get_agent_executor(session_id)
            
            # Prepare input with auth token
            agent_input = {
                "input": message,
                "auth_token": self.auth_token,
            }
            
            # Add user context to input
            if user_context:
                agent_input.update(user_context)
            
            # Run agent
            logger.info(f"Processing message for session {session_id}: {message[:50]}...")
            
            result = await executor.ainvoke(agent_input)
            
            # Extract response
            response = result.get("output", "I encountered an error processing your request.")
            
            logger.info(f"Agent response generated for session {session_id}")
            
            return response
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error processing message: {error_msg}", exc_info=True)
            
            # Provide user-friendly error messages
            if "rate limit" in error_msg.lower():
                return "⚠️ I'm experiencing high load right now. Please try again in a moment."
            elif "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
                return "❌ Authentication failed. Please make sure you're logged in."
            else:
                return f"❌ I encountered an error: {error_msg}\n\nPlease try rephrasing your request or contact support if the issue persists."
    
    def clear_session(self, session_id: str) -> bool:
        """
        Clear memory and executor for a session.
        
        Use this when:
        - User logs out
        - User wants to start fresh conversation
        - Session has been inactive for too long
        
        Args:
            session_id: Session to clear
            
        Returns:
            True if session was cleared, False if it didn't exist
        """
        # Clear memory
        memory_cleared = self.memory_manager.clear_session(session_id)
        
        # Clear executor
        if session_id in self._agent_executors:
            del self._agent_executors[session_id]
            executor_cleared = True
        else:
            executor_cleared = False
        
        logger.info(f"Session {session_id} cleared: memory={memory_cleared}, executor={executor_cleared}")
        
        return memory_cleared or executor_cleared
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a session.
        
        Useful for debugging and monitoring.
        
        Args:
            session_id: Session to get info about
            
        Returns:
            Dict with session info or None if session doesn't exist
        """
        return self.memory_manager.get_session_info(session_id)
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get agent statistics.
        
        Returns:
            Dict with statistics about the agent:
            - Active sessions
            - Total sessions created
            - Tools available
            - LLM model being used
        """
        memory_stats = self.memory_manager.get_statistics()
        
        return {
            **memory_stats,
            "tools_count": len(self.tools),
            "tool_names": [tool.name for tool in self.tools],
            "llm_model": getattr(self.llm, "model_name", "unknown"),
            "active_executors": len(self._agent_executors),
        }


# ==========================================
# Convenience Functions
# ==========================================

def create_medical_agent(
    auth_token: Optional[str] = None,
    verbose: bool = True,
) -> MedicalAgent:
    """
    Create a medical agent with default settings.
    
    This is the easiest way to create an agent.
    
    Args:
        auth_token: JWT token for medical API authentication
        verbose: If True, shows agent's thinking process
        
    Returns:
        Configured MedicalAgent instance
        
    Usage:
        from app.agent.medical_agent import create_medical_agent
        
        # Create agent
        agent = create_medical_agent(auth_token="your-jwt-token")
        
        # Process messages
        response = await agent.process_message(
            message="Create a doctor named John Smith in Cardiology",
            session_id="user-123"
        )
        
        print(response)
    """
    return MedicalAgent(
        auth_token=auth_token,
        verbose=verbose,
    )


# ==========================================
# Testing & Examples
# ==========================================

async def test_medical_agent():
    """
    Test the medical agent with example conversations.
    
    Run this to see how the agent works:
        cd prescription-management/agent
        python -m app.agent.medical_agent
    """
    print("Testing Medical Agent")
    print("=" * 60)
    
    # Create agent (without auth token for testing)
    print("\n1. Creating agent...")
    agent = create_medical_agent(verbose=True)
    print(f"✅ Agent created with {len(agent.tools)} tools")
    
    # Print available tools
    print(f"\n📋 Available tools:")
    for i, tool in enumerate(agent.tools, 1):
        print(f"   {i}. {tool.name}: {tool.description[:80]}...")
    
    # Test conversation 1: Ask about capabilities
    print("\n2. Testing conversation - Ask about capabilities:")
    print("   User: What can you help me with?")
    try:
        response = await agent.process_message(
            message="What can you help me with?",
            session_id="test-session-1"
        )
        print(f"   Agent: {response[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test conversation 2: Try to create doctor (will fail - no auth token)
    print("\n3. Testing conversation - Create doctor without auth:")
    print("   User: Create a doctor named John Smith")
    try:
        response = await agent.process_message(
            message="Create a doctor named John Smith in Cardiology",
            session_id="test-session-2"
        )
        print(f"   Agent: {response}")
        print("   ✅ Expected: Should ask for missing fields or auth")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Get statistics
    print("\n4. Agent statistics:")
    stats = agent.get_statistics()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("\n" + "=" * 60)
    print("✅ Agent core tests completed!")
    print("\nNote: Full testing requires:")
    print("1. Valid JWT token for authentication")
    print("2. Running medical backend on port 8000")
    print("3. Interactive console interface (Phase 7)")


if __name__ == "__main__":
    """
    Run medical agent tests.
    
    Usage:
        cd prescription-management/agent
        python -m app.agent.medical_agent
    """
    import asyncio
    asyncio.run(test_medical_agent())
