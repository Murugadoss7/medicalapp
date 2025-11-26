"""
Interactive Console Testing Interface for Medical Agent

This provides a simple command-line interface to test the medical agent.
Perfect for development, testing, and demonstrations.

Usage:
    cd prescription-management/agent
    python -m app.console

Educational Notes:
====================

**Why a Console Interface?**
- Easy testing during development
- No need for frontend initially
- Can see agent's thinking process
- Quick iteration on prompts and tools
- Useful for debugging

**Testing Flow:**
1. Start console
2. Provide auth token (optional for testing)
3. Chat with agent
4. See agent's reasoning
5. Test different scenarios
"""

import asyncio
import sys
from typing import Optional
from datetime import datetime

from app.agent.medical_agent import create_medical_agent
from app.config import get_settings


class ConsoleInterface:
    """
    Interactive console interface for the medical agent.
    
    Provides a simple chat interface with:
    - Color-coded output
    - Command handling (/help, /exit, /clear, etc.)
    - Session management
    - Conversation history display
    """
    
    # ANSI color codes for terminal
    COLORS = {
        "reset": "\033[0m",
        "bold": "\033[1m",
        "user": "\033[94m",      # Blue
        "agent": "\033[92m",      # Green
        "system": "\033[93m",     # Yellow
        "error": "\033[91m",      # Red
        "command": "\033[95m",    # Magenta
    }
    
    def __init__(self, auth_token: Optional[str] = None, verbose: bool = True):
        """
        Initialize the console interface.
        
        Args:
            auth_token: JWT token for medical API authentication
            verbose: If True, shows agent's thinking process
        """
        self.auth_token = auth_token
        self.verbose = verbose
        self.session_id = f"console-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.agent = None
        self.running = False
        
    def print_colored(self, text: str, color: str = "reset"):
        """Print text with color."""
        print(f"{self.COLORS.get(color, '')}{text}{self.COLORS['reset']}")
    
    def print_banner(self):
        """Print welcome banner."""
        self.print_colored("\n" + "=" * 70, "bold")
        self.print_colored("🏥 Medical Assistant Agent - Interactive Console", "bold")
        self.print_colored("=" * 70, "bold")
        self.print_colored("\nType '/help' for available commands", "system")
        self.print_colored("Type '/exit' to quit\n", "system")
        
    def print_help(self):
        """Print available commands."""
        self.print_colored("\n📋 Available Commands:", "bold")
        commands = [
            ("/help", "Show this help message"),
            ("/exit or /quit", "Exit the console"),
            ("/clear", "Clear current session and start fresh"),
            ("/token <token>", "Set authentication token"),
            ("/stats", "Show agent statistics"),
            ("/examples", "Show example conversations"),
            ("/verbose on|off", "Toggle verbose mode (show agent thinking)"),
        ]
        for cmd, desc in commands:
            self.print_colored(f"  {cmd:20} - {desc}", "command")
        print()
    
    def print_examples(self):
        """Print example conversations."""
        self.print_colored("\n💡 Example Conversations:", "bold")
        examples = [
            "What can you help me with?",
            "Search for doctors in Cardiology",
            "Create a doctor named Dr. Sarah Johnson in Neurology",
            "Tell me about available features",
        ]
        for i, example in enumerate(examples, 1):
            self.print_colored(f"  {i}. {example}", "system")
        print()
    
    async def handle_command(self, user_input: str) -> bool:
        """
        Handle special commands starting with /.
        
        Returns:
            True if command was handled, False otherwise
        """
        if not user_input.startswith("/"):
            return False
        
        parts = user_input.split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        
        if command in ["/exit", "/quit"]:
            self.print_colored("\n👋 Goodbye! Thanks for testing the agent.\n", "system")
            self.running = False
            return True
        
        elif command == "/help":
            self.print_help()
            return True
        
        elif command == "/clear":
            if self.agent:
                self.agent.clear_session(self.session_id)
            self.print_colored("\n✨ Session cleared. Starting fresh!\n", "system")
            return True
        
        elif command == "/token":
            if not args:
                self.print_colored("\n❌ Usage: /token <your-jwt-token>\n", "error")
            else:
                self.auth_token = args
                if self.agent:
                    self.agent.auth_token = args
                self.print_colored("\n✅ Authentication token updated!\n", "system")
            return True
        
        elif command == "/stats":
            if self.agent:
                stats = self.agent.get_statistics()
                self.print_colored("\n📊 Agent Statistics:", "bold")
                for key, value in stats.items():
                    self.print_colored(f"  {key}: {value}", "system")
                print()
            else:
                self.print_colored("\n⚠️ Agent not initialized yet\n", "error")
            return True
        
        elif command == "/examples":
            self.print_examples()
            return True
        
        elif command == "/verbose":
            if args.lower() == "on":
                self.verbose = True
                if self.agent:
                    self.agent.verbose = True
                self.print_colored("\n✅ Verbose mode enabled\n", "system")
            elif args.lower() == "off":
                self.verbose = False
                if self.agent:
                    self.agent.verbose = False
                self.print_colored("\n✅ Verbose mode disabled\n", "system")
            else:
                self.print_colored("\n❌ Usage: /verbose on|off\n", "error")
            return True
        
        else:
            self.print_colored(f"\n❌ Unknown command: {command}", "error")
            self.print_colored("Type '/help' for available commands\n", "system")
            return True
    
    async def process_message(self, user_input: str):
        """Process a user message through the agent."""
        try:
            # Create agent if not exists
            if not self.agent:
                self.print_colored("\n⚙️  Initializing agent...", "system")
                self.agent = create_medical_agent(
                    auth_token=self.auth_token,
                    verbose=self.verbose
                )
                self.print_colored("✅ Agent ready!\n", "system")
            
            # Process message
            response = await self.agent.process_message(
                message=user_input,
                session_id=self.session_id,
                user_context={"auth_token": self.auth_token} if self.auth_token else None,
            )
            
            # Print response
            self.print_colored(f"\n🤖 Agent: {response}\n", "agent")
            
        except KeyboardInterrupt:
            raise
        except Exception as e:
            self.print_colored(f"\n❌ Error: {str(e)}\n", "error")
    
    async def run(self):
        """Run the interactive console."""
        self.running = True
        self.print_banner()
        
        # Check for API key
        try:
            settings = get_settings()
            if settings.llm_provider == "openai" and (not settings.openai_api_key or settings.openai_api_key == "your-key-here"):
                self.print_colored("⚠️  WARNING: No valid OpenAI API key configured!", "error")
                self.print_colored("   Set OPENAI_API_KEY in agent/.env file\n", "system")
            elif settings.llm_provider == "claude" and (not settings.anthropic_api_key or settings.anthropic_api_key == "your-key-here"):
                self.print_colored("⚠️  WARNING: No valid Anthropic API key configured!", "error")
                self.print_colored("   Set ANTHROPIC_API_KEY in agent/.env file\n", "system")
        except Exception as e:
            self.print_colored(f"⚠️  Config error: {e}\n", "error")
        
        # Main loop
        while self.running:
            try:
                # Get user input
                self.print_colored("You: ", "user")
                user_input = input().strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                is_command = await self.handle_command(user_input)
                if is_command:
                    continue
                
                # Process message through agent
                await self.process_message(user_input)
                
            except KeyboardInterrupt:
                self.print_colored("\n\n👋 Interrupted. Type '/exit' to quit or continue chatting.\n", "system")
                continue
            except EOFError:
                self.print_colored("\n\n👋 Goodbye!\n", "system")
                break
            except Exception as e:
                self.print_colored(f"\n❌ Unexpected error: {str(e)}\n", "error")
                continue


# ==========================================
# Main Entry Point
# ==========================================

async def main():
    """
    Main entry point for the console interface.
    
    Usage:
        cd prescription-management/agent
        python -m app.console
        
    Or with auth token:
        python -m app.console --token "your-jwt-token"
    """
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="Medical Agent Console Interface")
    parser.add_argument("--token", help="JWT authentication token", default=None)
    parser.add_argument("--quiet", action="store_true", help="Disable verbose mode")
    args = parser.parse_args()
    
    # Create and run console
    console = ConsoleInterface(
        auth_token=args.token,
        verbose=not args.quiet,
    )
    
    await console.run()


if __name__ == "__main__":
    """
    Run the console interface.
    
    Usage:
        cd prescription-management/agent
        python -m app.console
    """
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
