"""
Agent Tools Package

This package contains all LangChain tools that the agent can use.
Each tool represents a specific capability the agent has.

Educational Note:
- Tools are how agents interact with the world
- Each tool is a function the agent can call
- LangChain's @tool decorator makes functions usable by agents
"""

from app.tools.doctor_tools import create_doctor_tool

__all__ = [
    "create_doctor_tool",
]
