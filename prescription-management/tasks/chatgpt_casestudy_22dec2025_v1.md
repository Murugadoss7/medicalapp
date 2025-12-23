# Phase 5: ChatGPT Case Study Generation
**Date**: December 22, 2025
**Version**: 1.0
**Status**: ✅ IMPLEMENTATION COMPLETE

---

## Overview
Implement GPT-5-nano integration for generating AI-powered dental case study reports.

---

## API Configuration (OpenAI GPT-5-nano)

### Model Details
| Property | Value |
|----------|-------|
| **Model ID** | `gpt-5-nano` |
| **Snapshot** | `gpt-5-nano-2025-08-07` |
| **API Endpoint** | `https://api.openai.com/v1/chat/completions` |
| **Input Cost** | $0.05 / 1M tokens |
| **Output Cost** | $0.40 / 1M tokens |
| **Features** | Streaming, Function Calling, Structured Outputs |

### Python SDK Example
```python
from openai import OpenAI

client = OpenAI(api_key="YOUR_OPENAI_API_KEY")

response = client.chat.completions.create(
    model="gpt-5-nano",
    messages=[
        {"role": "system", "content": "You are a dental case study assistant..."},
        {"role": "user", "content": "Generate case study for..."}
    ],
    temperature=0.7,
    max_tokens=4000
)

print(response.choices[0].message.content)
```

### Environment Variables
```bash
# Add to backend/.env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5-nano
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7
```

---

## Todo List

### 1. Configuration Setup
- [x] Update `config.py` - change model to `gpt-5-nano`
- [x] Create `.env.example` with OpenAI settings
- [x] Install openai package in requirements.txt

### 2. Backend AI Service
- [x] Create `backend/app/services/ai_case_study_service.py`
  - [x] Dental system prompt with terminology
  - [x] `generate_case_study()` function
  - [x] Cost estimation helper
  - [x] Error handling (no key, rate limit)

### 3. Backend API Endpoint
- [x] Create `backend/app/api/v1/endpoints/case_studies.py`
  - [x] POST `/case-studies/generate` endpoint
  - [x] Request schema (patient, observations, procedures, images)
  - [x] Response schema (generated content)
  - [x] Register router in __init__.py

### 4. Frontend Integration
- [x] Update `CaseStudyView.tsx`
  - [x] Enable "Generate Case Study" button
  - [x] Call backend API with selected data
  - [x] Show loading spinner during generation
  - [x] Display generated content in dialog
  - [x] Collapsible sections for easy reading

### 5. Testing & Validation
- [ ] Test with real patient data (requires OPENAI_API_KEY)
- [ ] Verify generated content quality
- [ ] Test error scenarios

---

## Case Study Report Structure

Based on `case_study.py` model:

```
┌─────────────────────────────────────────────┐
│           CASE STUDY REPORT                 │
├─────────────────────────────────────────────┤
│ 1. PRE-TREATMENT ASSESSMENT                 │
│    - pre_treatment_summary                  │
│    - initial_diagnosis                      │
│    - treatment_goals                        │
├─────────────────────────────────────────────┤
│ 2. TREATMENT TIMELINE                       │
│    - treatment_summary                      │
│    - procedures_performed                   │
├─────────────────────────────────────────────┤
│ 3. POST-TREATMENT OUTCOME                   │
│    - outcome_summary                        │
│    - success_metrics                        │
│    - patient_feedback                       │
├─────────────────────────────────────────────┤
│ 4. FULL NARRATIVE                           │
│    - full_narrative (complete case study)   │
└─────────────────────────────────────────────┘
```

---

## System Prompt Design

```
You are a dental case study assistant helping doctors create professional
clinical documentation. Generate comprehensive case studies based on:

DENTAL TERMINOLOGY:
- RCT: Root Canal Treatment
- Pulpectomy: Removal of pulp tissue
- Obturation: Filling root canals
- Composite: Tooth-colored filling material
- Crown: Prosthetic covering for tooth
- Extraction: Tooth removal
- Scaling: Professional cleaning
- Periodontal: Related to gums/supporting structures

OUTPUT FORMAT:
Generate the case study in the following sections:
1. Pre-Treatment Summary (patient's initial condition)
2. Initial Diagnosis (clinical findings)
3. Treatment Goals (objectives)
4. Treatment Summary (what was performed)
5. Procedures Performed (detailed list)
6. Outcome Summary (results achieved)
7. Success Metrics (measurable outcomes)
8. Full Narrative (complete professional case study)

GUIDELINES:
- Use professional medical terminology
- Be concise but thorough
- Focus on clinical relevance
- Include timeline references
- Mention before/after observations
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `backend/app/services/ai_case_study_service.py` | AI generation logic |
| `backend/.env.example` | Sample environment config |

### Modify
| File | Changes |
|------|---------|
| `backend/app/core/config.py` | Update OPENAI_MODEL to gpt-5-nano |
| `backend/app/api/v1/endpoints/case_studies.py` | Add generate endpoint |
| `frontend/src/components/treatments/CaseStudyView.tsx` | Enable generate button, add API call |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CASE STUDY GENERATION FLOW               │
└─────────────────────────────────────────────────────────────┘

Doctor selects visits & images in Case Study tab
                    │
                    ▼
Frontend builds request payload:
  - patient info
  - selected observations
  - selected procedures
  - selected images (URLs)
  - title, chief complaint
                    │
                    ▼
POST /api/v1/case-studies/generate
                    │
                    ▼
Backend AI Service:
  1. Build system prompt (dental context)
  2. Build user prompt (patient data)
  3. Call OpenAI GPT-5-nano
  4. Parse response into sections
  5. Calculate token usage/cost
  6. Save to database
                    │
                    ▼
Return generated case study to frontend
                    │
                    ▼
Doctor reviews, edits if needed, saves
```

---

## Cost Estimation

| Scenario | Input Tokens | Output Tokens | Cost |
|----------|-------------|---------------|------|
| Simple case (1-2 visits) | ~1,500 | ~2,000 | ~$0.001 |
| Medium case (3-5 visits) | ~3,000 | ~3,000 | ~$0.002 |
| Complex case (6+ visits) | ~5,000 | ~4,000 | ~$0.002 |

**Average cost per case study: ~$0.002** (very affordable)

---

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| No API key | "AI service not configured" | Show setup instructions |
| Rate limit | "Too many requests, try again" | Retry with backoff |
| Timeout | "Generation took too long" | Retry or simplify input |
| Invalid response | "Failed to generate" | Log error, show retry |

---

## Sources

- [OpenAI GPT-5 nano Documentation](https://platform.openai.com/docs/models/gpt-5-nano)
- [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat)
- [GPT-5 Developer Announcement](https://openai.com/index/introducing-gpt-5-for-developers/)

---

## Review Section

### Changes Made

#### Backend (4 files modified/created)
| File | Change |
|------|--------|
| `backend/app/core/config.py` | Updated OPENAI_MODEL to `gpt-5-nano` |
| `backend/.env.example` | Added OpenAI configuration section |
| `backend/requirements.txt` | Added `openai>=1.0.0` |
| `backend/app/services/ai_case_study_service.py` | **NEW** - AI generation service with dental system prompt |
| `backend/app/api/v1/endpoints/case_studies.py` | **NEW** - Case study CRUD and generate endpoint |
| `backend/app/api/v1/__init__.py` | Added case_studies router |

#### Frontend (1 file modified)
| File | Change |
|------|--------|
| `frontend/src/components/treatments/CaseStudyView.tsx` | Enabled generate button, added API call, result dialog |

### Implementation Highlights
1. **Dental-specific system prompt** with terminology (RCT, Pulpectomy, etc.)
2. **Structured JSON output** from GPT-5-nano for consistent parsing
3. **Cost tracking** - displays tokens used and estimated cost
4. **Error handling** for missing API key, rate limits, timeouts
5. **Collapsible sections** in result dialog for easy reading
6. **Section regeneration** endpoint for refining specific parts

### To Test
1. Add `OPENAI_API_KEY=sk-xxx` to `backend/.env`
2. Install openai: `pip install openai`
3. Restart backend server
4. Go to Treatment Dashboard → Patient → Case Study tab
5. Select visits and click "Generate Case Study with AI"

### Known Limitations
- PDF export not implemented (future phase)
- Image analysis not included in prompt (text-only for now)
- No edit-in-place for generated content (view-only dialog)
