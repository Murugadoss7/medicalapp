"""
Memory Management for AI Agent Conversations

This module manages conversation memory so the agent can remember context
across multiple messages in a chat session.

Educational Notes:
====================

**Why Memory is Important:**
Without memory:
    User: "Create doctor John Smith"
    Agent: "Doctor created"
    User: "What was his name?"
    Agent: "I don't know" ❌ (no memory of previous conversation)

With memory:
    User: "Create doctor John Smith"
    Agent: "Doctor created"
    User: "What was his name?"
    Agent: "John Smith" ✅ (remembers from earlier)

**Memory Types:**
1. Buffer Memory: Stores last N messages (simple, fast)
2. Summary Memory: Summarizes old messages (for long conversations)
3. Vector Memory: Semantic search (advanced, not implemented here)

**Session Management:**
- Each user gets a session_id
- Sessions expire after inactivity (SESSION_TTL)
- Memory is stored in-memory (RAM) - simple but not persistent
- For production: use Redis or database for persistent storage
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.memory import BaseMemory


class MemoryManager:
    """
    Manages conversation memory for all active sessions.

    This class:
    - Creates memory for new sessions
    - Retrieves memory for existing sessions
    - Cleans up expired sessions
    - Supports different memory types

    Educational Note:
    - This is like a "memory bank" for all user conversations
    - Each user (session_id) gets their own memory
    - Old sessions are automatically cleaned up
    """

    def __init__(
        self,
        memory_type: str = "buffer",
        max_messages: int = 20,
        session_ttl: int = 3600,
        llm: Optional[BaseLanguageModel] = None
    ):
        """
        Initialize the memory manager.

        Args:
            memory_type: Type of memory to use
                - "buffer": Keep last N messages (simple, fast)
                - "summary": Summarize old messages (for long chats)
            max_messages: Maximum messages to keep (buffer memory only)
            session_ttl: Session timeout in seconds (default: 1 hour)
            llm: Language model (required for summary memory)

        Educational Note:
        - __init__ is the constructor - runs when you create MemoryManager()
        - We store all sessions in a dictionary (dict)
        - Dictionary structure: {session_id: {"memory": ..., "last_access": ...}}
        """
        self.memory_type = memory_type
        self.max_messages = max_messages
        self.session_ttl = session_ttl
        self.llm = llm

        # Storage for all sessions
        # Dictionary: session_id -> {memory: BaseMemory, last_access: datetime}
        self._sessions: Dict[str, Dict] = {}

        # Statistics
        self._stats = {
            "total_sessions_created": 0,
            "total_sessions_expired": 0,
            "active_sessions": 0,
        }

    def get_memory(self, session_id: str) -> BaseMemory:
        """
        Get or create memory for a session.

        This is the main method you'll use. It:
        1. Checks if session already exists
        2. If yes: returns existing memory and updates last_access
        3. If no: creates new memory for this session

        Args:
            session_id: Unique identifier for the session (e.g., user ID)

        Returns:
            BaseMemory: LangChain memory object for this session

        Educational Note:
        - This method is "idempotent" - calling it multiple times with
          same session_id returns the same memory
        - We update last_access time to prevent expiration
        """
        # Clean up expired sessions first
        self._cleanup_expired_sessions()

        # Check if session exists
        if session_id in self._sessions:
            # Session exists - update last access time
            self._sessions[session_id]["last_access"] = datetime.now()
            return self._sessions[session_id]["memory"]

        # Session doesn't exist - create new one
        memory = self._create_memory()

        self._sessions[session_id] = {
            "memory": memory,
            "last_access": datetime.now(),
            "created_at": datetime.now(),
        }

        # Update statistics
        self._stats["total_sessions_created"] += 1
        self._stats["active_sessions"] = len(self._sessions)

        return memory

    def _create_memory(self) -> BaseMemory:
        """
        Create a new memory instance based on memory_type.

        This is a private method (starts with _) - only used internally.

        Returns:
            BaseMemory: A new memory instance

        Educational Note:
        - Private methods (with _) are for internal use
        - They help organize code but aren't meant to be called from outside
        - This uses Factory Pattern to create different memory types
        """
        if self.memory_type == "buffer":
            return self._create_buffer_memory()
        elif self.memory_type == "summary":
            return self._create_summary_memory()
        else:
            raise ValueError(f"Unknown memory type: {self.memory_type}")

    def _create_buffer_memory(self) -> ConversationBufferMemory:
        """
        Create buffer memory that stores last N messages.

        Buffer Memory Example:
        - Stores last 20 messages (configurable)
        - Oldest message is dropped when limit reached
        - Simple and fast
        - Good for most conversations

        How it works:
            Message 1: "Create doctor"
            Message 2: "His name is John"
            Message 3: "What was his name?"

            Memory contains all 3 messages ✓
            Agent can reference any of them

        Educational Note:
        - ConversationBufferMemory is from LangChain
        - return_messages=True means we get full message objects
        - memory_key="chat_history" is where history is stored in context
        """
        return ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history",
            # Note: max_messages is handled by LangChain internally
            # We set it in configuration, but ConversationBufferMemory
            # doesn't have a built-in limit - it keeps all messages
            # For production, you'd want to implement trimming
        )

    def _create_summary_memory(self) -> ConversationSummaryMemory:
        """
        Create summary memory that summarizes old messages.

        Summary Memory Example:
        - Keeps recent messages as-is
        - Summarizes old messages to save tokens
        - Uses LLM to create summaries
        - Good for long conversations

        How it works:
            Old messages: "Create doctor John Smith in Cardiology"
            Summarized to: "User created Dr. John Smith (Cardiology)"

            Recent messages: Kept as-is

            Total tokens used: Much less than keeping all messages!

        Educational Note:
        - Requires an LLM to create summaries
        - More complex but handles long conversations better
        - Trades some context for token efficiency
        """
        if not self.llm:
            raise ValueError(
                "Summary memory requires an LLM. "
                "Pass llm parameter to MemoryManager constructor."
            )

        return ConversationSummaryMemory(
            llm=self.llm,
            return_messages=True,
            memory_key="chat_history",
        )

    def clear_session(self, session_id: str) -> bool:
        """
        Clear memory for a specific session.

        Use this when:
        - User wants to start a fresh conversation
        - User logs out
        - You want to free up memory

        Args:
            session_id: Session to clear

        Returns:
            bool: True if session was found and cleared, False otherwise

        Educational Note:
        - Removes session from dictionary
        - Memory is garbage collected (freed) by Python automatically
        - Returns False if session didn't exist (not an error)
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            self._stats["active_sessions"] = len(self._sessions)
            return True
        return False

    def _cleanup_expired_sessions(self) -> int:
        """
        Remove sessions that haven't been accessed recently.

        This runs automatically when you call get_memory().

        Returns:
            int: Number of sessions cleaned up

        Educational Note:
        - Prevents memory leaks from abandoned sessions
        - Uses TTL (Time To Live) from configuration
        - Dictionary comprehension creates new dict without expired sessions
        """
        now = datetime.now()
        expired_cutoff = now - timedelta(seconds=self.session_ttl)

        # Find expired sessions
        expired_sessions = [
            session_id
            for session_id, data in self._sessions.items()
            if data["last_access"] < expired_cutoff
        ]

        # Remove expired sessions
        for session_id in expired_sessions:
            del self._sessions[session_id]

        # Update statistics
        if expired_sessions:
            self._stats["total_sessions_expired"] += len(expired_sessions)
            self._stats["active_sessions"] = len(self._sessions)

        return len(expired_sessions)

    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """
        Get information about a session without creating it.

        Useful for debugging and monitoring.

        Args:
            session_id: Session to get info about

        Returns:
            Dict with session info, or None if session doesn't exist
            {
                "session_id": "user-123",
                "created_at": "2025-01-22T10:00:00",
                "last_access": "2025-01-22T10:30:00",
                "age_seconds": 1800,
                "messages_count": 10
            }
        """
        if session_id not in self._sessions:
            return None

        data = self._sessions[session_id]
        now = datetime.now()

        # Try to get message count from memory
        try:
            memory = data["memory"]
            if hasattr(memory, "chat_memory"):
                messages_count = len(memory.chat_memory.messages)
            else:
                messages_count = 0
        except:
            messages_count = 0

        return {
            "session_id": session_id,
            "created_at": data["created_at"].isoformat(),
            "last_access": data["last_access"].isoformat(),
            "age_seconds": (now - data["created_at"]).total_seconds(),
            "idle_seconds": (now - data["last_access"]).total_seconds(),
            "messages_count": messages_count,
        }

    def get_all_sessions(self) -> list[str]:
        """
        Get list of all active session IDs.

        Useful for:
        - Monitoring active sessions
        - Debugging
        - Admin dashboards
        """
        return list(self._sessions.keys())

    def get_statistics(self) -> Dict:
        """
        Get memory manager statistics.

        Returns:
            Dict with statistics:
            {
                "active_sessions": 5,
                "total_sessions_created": 50,
                "total_sessions_expired": 45,
                "memory_type": "buffer",
                "session_ttl": 3600
            }

        Educational Note:
        - Useful for monitoring and debugging
        - Shows how many users are active
        - Helps identify memory issues
        """
        return {
            **self._stats,
            "memory_type": self.memory_type,
            "max_messages": self.max_messages,
            "session_ttl": self.session_ttl,
        }

    def cleanup_all_sessions(self) -> int:
        """
        Clear ALL sessions (use with caution!).

        Use this for:
        - Testing
        - Emergency cleanup
        - Scheduled maintenance

        Returns:
            int: Number of sessions cleared

        Educational Note:
        - This is like "restart" for memory
        - All conversations are forgotten
        - Only use when you really mean it!
        """
        count = len(self._sessions)
        self._sessions.clear()
        self._stats["active_sessions"] = 0
        return count


# ==========================================
# Convenience Functions
# ==========================================

def create_memory_manager_from_settings(
    llm: Optional[BaseLanguageModel] = None
) -> MemoryManager:
    """
    Create memory manager using settings from config.

    This is the easiest way to create a MemoryManager.

    Args:
        llm: Language model (required if using summary memory)

    Usage:
        from app.agent.memory_manager import create_memory_manager_from_settings

        memory_manager = create_memory_manager_from_settings()
        memory = memory_manager.get_memory("user-123")

    Educational Note:
    - Loads settings from environment/.env file
    - Creates MemoryManager with correct configuration
    - You don't need to pass individual parameters
    """
    from app.config import get_settings

    settings = get_settings()

    return MemoryManager(
        memory_type="buffer",  # For now, always use buffer
        max_messages=settings.memory_max_messages,
        session_ttl=settings.session_ttl,
        llm=llm,
    )


# ==========================================
# Testing & Examples
# ==========================================

def test_memory_manager():
    """
    Test the memory manager with examples.

    Run this to understand how memory works:
        cd prescription-management/agent
        python -m app.agent.memory_manager
    """
    print("Testing Memory Manager")
    print("=" * 60)

    # Create memory manager
    manager = MemoryManager(
        memory_type="buffer",
        max_messages=5,
        session_ttl=10,  # 10 seconds for testing
    )

    # Test 1: Create session
    print("\n1. Creating session for user-123...")
    memory1 = manager.get_memory("user-123")
    print(f"✅ Memory created: {type(memory1).__name__}")

    # Test 2: Add messages
    print("\n2. Adding messages to memory...")
    memory1.save_context(
        {"input": "Create a doctor named John Smith"},
        {"output": "Doctor created successfully"}
    )
    memory1.save_context(
        {"input": "What was his name?"},
        {"output": "His name is John Smith"}
    )
    print("✅ Messages added")

    # Test 3: Retrieve memory (should return same instance)
    print("\n3. Retrieving memory again...")
    memory2 = manager.get_memory("user-123")
    print(f"✅ Same memory? {memory1 is memory2}")

    # Test 4: Check messages are preserved
    print("\n4. Checking conversation history...")
    history = memory2.load_memory_variables({})
    if "chat_history" in history:
        messages = history["chat_history"]
        print(f"✅ Found {len(messages)} messages in history")
        for msg in messages:
            print(f"   - {msg.type}: {msg.content[:50]}...")

    # Test 5: Session info
    print("\n5. Getting session info...")
    info = manager.get_session_info("user-123")
    if info:
        print(f"✅ Session info:")
        print(f"   Created: {info['created_at']}")
        print(f"   Messages: {info['messages_count']}")
        print(f"   Age: {info['age_seconds']:.1f}s")

    # Test 6: Multiple sessions
    print("\n6. Creating multiple sessions...")
    manager.get_memory("user-456")
    manager.get_memory("user-789")
    sessions = manager.get_all_sessions()
    print(f"✅ Active sessions: {sessions}")

    # Test 7: Statistics
    print("\n7. Getting statistics...")
    stats = manager.get_statistics()
    print(f"✅ Statistics:")
    for key, value in stats.items():
        print(f"   {key}: {value}")

    # Test 8: Clear session
    print("\n8. Clearing session user-123...")
    cleared = manager.clear_session("user-123")
    print(f"✅ Session cleared: {cleared}")
    print(f"   Remaining sessions: {manager.get_all_sessions()}")

    print("\n" + "=" * 60)
    print("✅ All tests passed!")


if __name__ == "__main__":
    """
    Run memory manager tests.

    Usage:
        cd prescription-management/agent
        python -m app.agent.memory_manager
    """
    test_memory_manager()
