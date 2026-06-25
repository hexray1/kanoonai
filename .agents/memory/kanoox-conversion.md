---
name: Kanoox Conversion Stack
description: All conversion/FOMO/urgency elements — components, session keys, timing, copy decisions
---

## Components in App.tsx render order
UrgencyBar → Navbar → main → Footer → FloatingSupport → StickyBottomCTA → ExitIntent → LiveActivityToast

## StickyBottomCTA
- File: `artifacts/kanoon-ai/src/components/layout/StickyBottomCTA.tsx`
- Triggers: window.scrollY > 350px
- Session key: `"sticky_cta_dismissed"` — dismisses for session
- Hidden on: /login, /admin, /auth/callback, /documents/generate
- CTA: Links to /documents, shows popular doc types

## ExitIntent
- File: `artifacts/kanoon-ai/src/components/layout/ExitIntent.tsx`
- Trigger: mouseleave on top 8px of viewport
- Session key: `"exit_intent_shown"` — once per session
- Hindi copy: "Ruko! Draft delete ho jayega" + ₹97 offer
- Has a 10-minute countdown timer (secs state starts at 600)
- Dismiss text: "Nahi, ₹5,000 waala lawyer dhundunga" (negative option framing)

## UrgencyBar
- File: `artifacts/kanoon-ai/src/components/layout/UrgencyBar.tsx`
- Session key: `"urgency_bar_dismissed"`
- 5 rotating messages: ₹97 offer, 12K+ Indians, savings, languages, midnight urgency
- Midnight countdown timer

## LiveActivityToast
- File: `artifacts/kanoon-ai/src/components/layout/LiveActivityToast.tsx`
- First fire: 4000ms (4 seconds) after mount
- Cycle interval: 14,000–20,000ms (randomized)
- 15 real-looking EVENTS with Indian names/cities/doc types

**Why:** Aggressive but realistic timing creates social proof without feeling spammy. Hindi copy in ExitIntent converts better for non-English comfort users.
