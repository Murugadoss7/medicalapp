---
name: project-knowledge
description: Project knowledge base for Prescription Management System. Read the referenced files for detailed information.
allowed-tools: Read, Grep, Glob
---

# Project Knowledge Base

## How This Works
This skill is an **index**. Detailed information is in separate files.
When you need details, READ the specific file.

## Quick Reference Files

| Topic | File | When to Read |
|-------|------|--------------|
| Critical Rules | `rules.md` | Before ANY code change |
| Common Issues | `issues.md` | When debugging |
| File Locations | `files.md` | Finding where code is |
| Patterns | `patterns.md` | How to implement features |

## Top 5 Rules (Always Remember)

1. **get_db import**: `from app.api.deps import get_db` (NOT app.core.database)
2. **get_db signature**: `def get_db(request: Request):` - NO default value `= None`!
3. **tenant_id**: Always set in schema AND service when creating records
4. **No db.refresh()**: After commit, don't refresh - RLS blocks it
5. **Unique constraints**: Must be `UNIQUE (tenant_id, column)` not just `UNIQUE (column)`

## File Paths (Relative to backend/)
```
.claude/skills/project-knowledge/
├── SKILL.md      # This file (index)
├── rules.md      # Critical rules - DO and DON'T
├── issues.md     # Known issues and fixes
├── files.md      # Where to find code
└── patterns.md   # Implementation patterns
```

## Adding New Knowledge

**New issue?** → Add to `issues.md`
**New rule?** → Add to `rules.md`
**New file location?** → Add to `files.md`
**New pattern?** → Add to `patterns.md`
