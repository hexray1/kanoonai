---
name: Kanoox AI Architecture
description: Core tech stack, document system, payment flow, and key file locations.
---

## Stack
- Frontend: React + Vite + Tailwind + Framer Motion (`artifacts/kanoon-ai`)
- Backend: Express + Node + Postgres + Drizzle (`artifacts/api-server`)
- AI: NVIDIA Nemotron 70B via `https://integrate.api.nvidia.com/v1` (NVIDIA_API_KEY secret)
- Payments: Razorpay (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET secrets)
- Auth: Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET secrets), JWT in localStorage

## Document System
- `constants.ts`: DOCUMENTS object — 25 docs with { category, name, nameHi, price, fields[] }
- `fieldConfig.ts`: FIELD_CONFIG record — FieldConfig objects per field key; getFieldConfig(key) fallback
- `aiGenerator.ts`: exhaustive clause-by-clause prompts per doc type; exports DOCUMENT_PRICES
- `payments.ts`: server-side price lookup (ignores client amount), GST server-side, idempotency

## Key paths
- `/documents/generate/:type` — public wizard → streaming → locked → payment → download
- Pending doc stored in `kanoox_pending_doc` localStorage key
- Post-login redirect: `kanoon_redirect_after_login` in sessionStorage

**Why:** Server-side price lookup prevents client-side price manipulation attacks.
