"""
Configuration Management for AI Agent Service

This module loads configuration from environment variables (.env file).
It uses Pydantic Settings for validation and type safety.

Educational Notes:
- pydantic-settings automatically loads from .env file
- Field(...) defines required fields with descriptions
- Field(default=...) defines optional fields with defaults
- @field_validator allows custom validation logic
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Pydantic automatically:
    - Loads values from .env file
    - Validates types (str, int, bool, etc.)
    - Converts string "true" to boolean True
    - Raises error if required fields are missing
    """

    # ==========================================
    # LLM Provider Settings
    # ==========================================
    llm_provider: Literal["openai", "claude", "ollama"] = Field(
        default="openai",
        description="LLM provider to use. Options: openai, claude, ollama"
    )

    # --- OpenAI Configuration ---
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API key (required if llm_provider=openai)"
    )
    openai_model: str = Field(
        default="gpt-4-turbo-preview",
        description="OpenAI model name. Options: gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo"
    )
    openai_temperature: float = Field(
        default=0.7,
        ge=0.0,  # Greater than or equal to 0
        le=2.0,  # Less than or equal to 2
        description="Temperature for response randomness (0=deterministic, 2=very random)"
    )
    openai_max_tokens: int = Field(
        default=1000,
        gt=0,  # Greater than 0
        description="Maximum tokens in response"
    )

    # --- Anthropic (Claude) Configuration ---
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key (required if llm_provider=claude)"
    )
    anthropic_model: str = Field(
        default="claude-3-sonnet-20240229",
        description="Claude model. Options: claude-3-opus, claude-3-sonnet, claude-3-haiku"
    )
    anthropic_temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Temperature for Claude (0-1)"
    )
    anthropic_max_tokens: int = Field(
        default=1000,
        gt=0,
        description="Maximum tokens in Claude response"
    )

    # --- Ollama (Local) Configuration ---
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="Ollama server URL (for local models)"
    )
    ollama_model: str = Field(
        default="llama2",
        description="Ollama model name. Options: llama2, mistral, codellama"
    )
    ollama_temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperature for Ollama"
    )

    # ==========================================
    # Medical API Settings
    # ==========================================
    medical_api_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for medical backend API"
    )
    medical_api_timeout: int = Field(
        default=30,
        gt=0,
        description="HTTP request timeout in seconds"
    )

    # ==========================================
    # Agent Configuration
    # ==========================================
    agent_max_iterations: int = Field(
        default=5,
        gt=0,
        le=10,
        description="Max iterations to prevent infinite loops"
    )
    agent_verbose: bool = Field(
        default=True,
        description="Show agent thinking process (useful for debugging)"
    )
    agent_require_confirmation: bool = Field(
        default=True,
        description="Ask for confirmation before critical operations"
    )

    # ==========================================
    # Memory Configuration
    # ==========================================
    session_ttl: int = Field(
        default=3600,
        gt=0,
        description="Session timeout in seconds (default: 1 hour)"
    )
    memory_max_messages: int = Field(
        default=20,
        gt=0,
        description="Maximum messages to keep in conversation memory"
    )

    # ==========================================
    # Server Configuration
    # ==========================================
    host: str = Field(
        default="0.0.0.0",
        description="Server host"
    )
    port: int = Field(
        default=8001,
        gt=0,
        lt=65536,
        description="Server port"
    )
    reload: bool = Field(
        default=True,
        description="Auto-reload on code changes (development only)"
    )

    # ==========================================
    # Security Configuration
    # ==========================================
    allowed_roles: str = Field(
        default="admin,doctor",
        description="Comma-separated list of roles that can access agent"
    )
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated list of allowed CORS origins"
    )

    # ==========================================
    # Logging Configuration
    # ==========================================
    log_level: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL"
    )

    # ==========================================
    # Pydantic Settings Configuration
    # ==========================================
    model_config = SettingsConfigDict(
        # Look for .env file in current directory
        env_file=".env",
        # Don't fail if .env doesn't exist
        env_file_encoding="utf-8",
        # Case-insensitive environment variable names
        case_sensitive=False,
        # Allow extra fields in environment (won't cause errors)
        extra="ignore"
    )

    # ==========================================
    # Custom Validators
    # ==========================================

    @field_validator("llm_provider")
    @classmethod
    def validate_llm_provider(cls, v: str) -> str:
        """
        Validate LLM provider choice.

        Educational Note:
        - @field_validator is a Pydantic decorator
        - Runs after type validation
        - Can transform or validate field values
        - Raise ValueError to fail validation
        """
        valid_providers = ["openai", "claude", "ollama"]
        if v not in valid_providers:
            raise ValueError(f"llm_provider must be one of: {valid_providers}")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level choice"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"log_level must be one of: {valid_levels}")
        return v_upper

    # ==========================================
    # Helper Methods
    # ==========================================

    def get_allowed_roles_list(self) -> list[str]:
        """
        Convert comma-separated roles string to list.

        Example: "admin,doctor" -> ["admin", "doctor"]
        """
        return [role.strip() for role in self.allowed_roles.split(",")]

    def get_cors_origins_list(self) -> list[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    def validate_llm_config(self) -> None:
        """
        Validate that required API keys are present for selected provider.

        Educational Note:
        - This is called after settings are loaded
        - Ensures we have the API key we need
        - Raises ValueError if configuration is invalid
        """
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is required when llm_provider=openai. "
                "Set it in your .env file or environment variables."
            )

        if self.llm_provider == "claude" and not self.anthropic_api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is required when llm_provider=claude. "
                "Set it in your .env file or environment variables."
            )

        # Ollama doesn't need API key, but warn if URL seems wrong
        if self.llm_provider == "ollama":
            if not self.ollama_base_url.startswith("http"):
                raise ValueError(
                    f"OLLAMA_BASE_URL should start with http:// or https://. "
                    f"Got: {self.ollama_base_url}"
                )

    def get_llm_config(self) -> dict:
        """
        Get LLM configuration for the selected provider.

        Returns a dict with provider-specific settings.
        This makes it easy to pass config to LLM provider factory.
        """
        if self.llm_provider == "openai":
            return {
                "provider": "openai",
                "api_key": self.openai_api_key,
                "model": self.openai_model,
                "temperature": self.openai_temperature,
                "max_tokens": self.openai_max_tokens,
            }

        elif self.llm_provider == "claude":
            return {
                "provider": "claude",
                "api_key": self.anthropic_api_key,
                "model": self.anthropic_model,
                "temperature": self.anthropic_temperature,
                "max_tokens": self.anthropic_max_tokens,
            }

        elif self.llm_provider == "ollama":
            return {
                "provider": "ollama",
                "base_url": self.ollama_base_url,
                "model": self.ollama_model,
                "temperature": self.ollama_temperature,
            }

        else:
            raise ValueError(f"Unknown LLM provider: {self.llm_provider}")


# ==========================================
# Global Settings Instance
# ==========================================

# Singleton pattern: Create one settings instance for the entire app
# This is loaded when the module is imported
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Get or create the global settings instance.

    Educational Note:
    - Singleton pattern: Only one Settings object exists
    - First call loads from .env file
    - Subsequent calls return the same instance
    - This is efficient and ensures consistency

    Usage:
        from app.config import get_settings

        settings = get_settings()
        print(settings.llm_provider)  # e.g., "openai"
    """
    global _settings

    if _settings is None:
        # Load settings from environment/.env file
        _settings = Settings()

        # Validate LLM configuration
        _settings.validate_llm_config()

    return _settings


def reload_settings() -> Settings:
    """
    Force reload settings from environment.

    Useful for:
    - Testing with different configurations
    - Reloading after changing .env file
    """
    global _settings
    _settings = None
    return get_settings()


# ==========================================
# Usage Examples (for learning)
# ==========================================

if __name__ == "__main__":
    """
    Test the configuration system.

    Run this to see how settings work:
        cd prescription-management/agent
        python -m app.config
    """

    print("Loading configuration...")
    print("=" * 60)

    try:
        settings = get_settings()

        print(f"✅ Configuration loaded successfully!")
        print()
        print(f"LLM Provider: {settings.llm_provider}")
        print(f"Medical API: {settings.medical_api_url}")
        print(f"Server Port: {settings.port}")
        print(f"Verbose Mode: {settings.agent_verbose}")
        print()
        print(f"LLM Config: {settings.get_llm_config()}")
        print()
        print(f"Allowed Roles: {settings.get_allowed_roles_list()}")
        print(f"CORS Origins: {settings.get_cors_origins_list()}")

    except Exception as e:
        print(f"❌ Configuration error: {e}")
        print()
        print("Make sure you have created a .env file with required settings.")
        print("Copy .env.example to .env and fill in your API keys.")
