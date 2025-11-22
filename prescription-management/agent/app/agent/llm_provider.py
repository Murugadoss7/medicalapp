"""
LLM Provider Factory - Multi-LLM Support

This module implements the Factory Pattern to create different LLM instances.
It supports OpenAI (GPT-4), Anthropic (Claude), and Ollama (local models).

Educational Notes:
====================

**Factory Pattern:**
- One function creates different objects based on input
- Client code doesn't need to know implementation details
- Easy to add new providers without changing existing code

**Why this is useful:**
- Switch between LLMs by changing config
- Test with different models easily
- Same code works with all providers

**Usage Example:**
    ```python
    from app.agent.llm_provider import LLMProviderFactory
    from app.config import get_settings

    settings = get_settings()
    llm = LLMProviderFactory.create(settings.get_llm_config())

    # Now use llm with any provider
    response = llm.invoke("Hello!")
    ```
"""

from typing import Any, Dict
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatOllama


class LLMProviderFactory:
    """
    Factory class for creating LLM instances.

    This class uses the Static Factory Method pattern.
    All methods are static - no need to create an instance.

    Educational Note:
    - @staticmethod means the method doesn't need 'self'
    - Can be called directly: LLMProviderFactory.create(...)
    - This is a factory, not an LLM itself
    """

    @staticmethod
    def create(config: Dict[str, Any]) -> BaseChatModel:
        """
        Create an LLM instance based on configuration.

        This is the main factory method. It:
        1. Reads the 'provider' key from config
        2. Calls the appropriate creation method
        3. Returns an LLM instance

        Args:
            config: Dictionary with provider and settings
                   Example: {"provider": "openai", "api_key": "...", "model": "gpt-4"}

        Returns:
            BaseChatModel: LangChain chat model (works with any provider)

        Raises:
            ValueError: If provider is unknown or config is invalid

        Educational Note:
        - BaseChatModel is LangChain's base class for all chat models
        - All providers (OpenAI, Claude, Ollama) inherit from it
        - This means they all have the same interface (methods)
        - You can use any provider with the same code!
        """
        provider = config.get("provider")

        # Educational Note: Using if/elif to dispatch to specific creation methods
        # This is called "conditional dispatching"
        if provider == "openai":
            return LLMProviderFactory._create_openai(config)

        elif provider == "claude":
            return LLMProviderFactory._create_claude(config)

        elif provider == "ollama":
            return LLMProviderFactory._create_ollama(config)

        else:
            # Unknown provider - raise error with helpful message
            raise ValueError(
                f"Unknown LLM provider: {provider}. "
                f"Supported providers: openai, claude, ollama"
            )

    @staticmethod
    def _create_openai(config: Dict[str, Any]) -> ChatOpenAI:
        """
        Create OpenAI (GPT) chat model instance.

        OpenAI Models:
        - gpt-4-turbo-preview: Latest GPT-4, best quality, slower
        - gpt-4: Original GPT-4, very good, moderate speed
        - gpt-3.5-turbo: Faster, cheaper, still very capable

        Parameters Explained:
        - api_key: Your OpenAI API key from https://platform.openai.com
        - model: Which GPT model to use
        - temperature: 0=deterministic, 1=creative, 2=very random
        - max_tokens: Maximum length of response (1 token ≈ 0.75 words)

        Educational Note:
        - ChatOpenAI is LangChain's wrapper for OpenAI API
        - It handles API calls, retries, error handling automatically
        - You just call .invoke(message) and get a response
        """
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY in .env")

        # Create and return ChatOpenAI instance
        return ChatOpenAI(
            api_key=api_key,
            model=config.get("model", "gpt-4-turbo-preview"),
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("max_tokens", 1000),
            # Additional OpenAI-specific parameters
            request_timeout=30,  # Wait max 30 seconds for response
            max_retries=2,  # Retry twice if API call fails
        )

    @staticmethod
    def _create_claude(config: Dict[str, Any]) -> ChatAnthropic:
        """
        Create Anthropic Claude chat model instance.

        Claude Models:
        - claude-3-opus: Most capable, best reasoning, slowest
        - claude-3-sonnet: Balanced performance and speed (recommended)
        - claude-3-haiku: Fastest, cheapest, still very good

        Why Claude?
        - Often better at reasoning and following instructions
        - Good for medical/professional domains
        - Better at longer context

        Parameters Explained:
        - api_key: Your Anthropic API key from https://console.anthropic.com
        - model: Which Claude version to use
        - temperature: 0-1 for Claude (0=deterministic, 1=creative)
        - max_tokens: Maximum response length

        Educational Note:
        - ChatAnthropic is LangChain's wrapper for Claude API
        - Same interface as ChatOpenAI - you use them the same way!
        - This is the power of LangChain's abstraction
        """
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("Anthropic API key is required. Set ANTHROPIC_API_KEY in .env")

        return ChatAnthropic(
            api_key=api_key,
            model=config.get("model", "claude-3-sonnet-20240229"),
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("max_tokens", 1000),
            # Additional Claude-specific parameters
            timeout=30,
            max_retries=2,
        )

    @staticmethod
    def _create_ollama(config: Dict[str, Any]) -> ChatOllama:
        """
        Create Ollama local model instance.

        Ollama is a tool to run LLMs locally on your computer.
        No API keys needed! No internet required! Free!

        Popular Ollama Models:
        - llama2: Meta's open model, good general purpose
        - mistral: Fast and capable
        - codellama: Specialized for code
        - phi: Smaller, runs on less powerful machines

        Setup:
        1. Install Ollama: https://ollama.ai/download
        2. Pull a model: ollama pull llama2
        3. Start Ollama: ollama serve (runs on port 11434)
        4. Set LLM_PROVIDER=ollama in .env

        Parameters Explained:
        - base_url: Where Ollama is running (usually localhost:11434)
        - model: Which model you pulled (must be installed!)
        - temperature: Same as other providers

        Educational Note:
        - ChatOllama connects to local Ollama server
        - No API calls to external services
        - Great for development, testing, privacy
        - Slower than cloud APIs but free!
        """
        base_url = config.get("base_url", "http://localhost:11434")
        model = config.get("model", "llama2")

        # Validate Ollama is accessible (optional but helpful)
        try:
            import httpx
            # Quick check if Ollama server is running
            response = httpx.get(f"{base_url}/api/tags", timeout=2)
            if response.status_code != 200:
                print(f"⚠️  Warning: Ollama server at {base_url} may not be running")
        except Exception:
            print(f"⚠️  Warning: Cannot connect to Ollama at {base_url}")
            print("    Make sure Ollama is running: ollama serve")

        return ChatOllama(
            base_url=base_url,
            model=model,
            temperature=config.get("temperature", 0.7),
            # Ollama-specific parameters
            num_predict=config.get("max_tokens", 1000),  # Ollama calls it num_predict
        )

    @staticmethod
    def get_provider_info(config: Dict[str, Any]) -> Dict[str, str]:
        """
        Get human-readable information about the provider.

        Useful for logging, debugging, and displaying to users.

        Returns:
            Dictionary with provider details:
            {
                "provider": "openai",
                "model": "gpt-4-turbo-preview",
                "description": "OpenAI GPT-4 Turbo"
            }

        Educational Note:
        - This is a helper method for debugging
        - Doesn't create an LLM, just returns info
        - Useful for health checks and status endpoints
        """
        provider = config.get("provider")
        model = config.get("model", "unknown")

        provider_descriptions = {
            "openai": f"OpenAI {model}",
            "claude": f"Anthropic Claude {model}",
            "ollama": f"Ollama {model} (local)",
        }

        return {
            "provider": provider,
            "model": model,
            "description": provider_descriptions.get(provider, f"Unknown provider: {provider}"),
        }


# ==========================================
# Convenience Functions
# ==========================================

def create_llm_from_settings() -> BaseChatModel:
    """
    Create LLM using settings from config.

    This is a convenience function that:
    1. Loads settings from environment
    2. Gets LLM config
    3. Creates LLM instance

    Usage:
        from app.agent.llm_provider import create_llm_from_settings

        llm = create_llm_from_settings()
        response = llm.invoke("Hello!")

    Educational Note:
    - This combines get_settings() and LLMProviderFactory.create()
    - Makes it easier to get an LLM in one line
    - Most code will use this function
    """
    from app.config import get_settings

    settings = get_settings()
    llm_config = settings.get_llm_config()

    return LLMProviderFactory.create(llm_config)


def get_llm_info() -> Dict[str, str]:
    """
    Get information about the configured LLM provider.

    Returns provider details without creating an LLM instance.
    Useful for health checks and status endpoints.
    """
    from app.config import get_settings

    settings = get_settings()
    llm_config = settings.get_llm_config()

    return LLMProviderFactory.get_provider_info(llm_config)


# ==========================================
# Testing & Examples
# ==========================================

async def test_llm_provider():
    """
    Test the LLM provider with a simple message.

    Run this to verify your LLM is working:
        cd prescription-management/agent
        python -m app.agent.llm_provider
    """
    print("Testing LLM Provider")
    print("=" * 60)

    try:
        # Get LLM info
        info = get_llm_info()
        print(f"✅ LLM configured: {info['description']}")
        print()

        # Create LLM instance
        print("Creating LLM instance...")
        llm = create_llm_from_settings()
        print(f"✅ LLM created: {type(llm).__name__}")
        print()

        # Test with a simple message
        print("Testing LLM with a simple message...")
        test_message = "Say 'Hello! I am working correctly!' and nothing else."

        response = llm.invoke(test_message)
        print(f"✅ LLM Response: {response.content}")
        print()

        print("🎉 LLM provider is working correctly!")

    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Troubleshooting:")
        print("1. Check your .env file exists and has the right API key")
        print("2. For OpenAI: Set OPENAI_API_KEY=sk-...")
        print("3. For Claude: Set ANTHROPIC_API_KEY=sk-ant-...")
        print("4. For Ollama: Make sure 'ollama serve' is running")


if __name__ == "__main__":
    """
    Run this file directly to test LLM provider.

    Usage:
        cd prescription-management/agent
        python -m app.agent.llm_provider
    """
    import asyncio

    asyncio.run(test_llm_provider())
