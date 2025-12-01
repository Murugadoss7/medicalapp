#!/bin/bash

# Setup alias for easy server startup
# Run this once: ./setup-alias.sh

SCRIPT_PATH="/Users/murugadoss/MedicalApp/prescription-management/start-servers.sh"
SHELL_CONFIG=""

# Detect shell configuration file
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    else
        SHELL_CONFIG="$HOME/.bashrc"
    fi
fi

if [ -z "$SHELL_CONFIG" ]; then
    echo "Could not detect shell configuration file"
    exit 1
fi

# Check if alias already exists
if grep -q "alias start-medical=" "$SHELL_CONFIG"; then
    echo "Alias 'start-medical' already exists in $SHELL_CONFIG"
else
    echo "" >> "$SHELL_CONFIG"
    echo "# Prescription Management System - Quick Start" >> "$SHELL_CONFIG"
    echo "alias start-medical='$SCRIPT_PATH'" >> "$SHELL_CONFIG"
    echo "✓ Alias 'start-medical' added to $SHELL_CONFIG"
    echo ""
    echo "Run this to activate the alias now:"
    echo "  source $SHELL_CONFIG"
    echo ""
    echo "Then you can simply run:"
    echo "  start-medical"
    echo ""
    echo "Or restart your terminal."
fi
