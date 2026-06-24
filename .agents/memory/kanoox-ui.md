---
name: Kanoox UI Conventions
description: Color palette, API base pattern, auth pattern, and component conventions.
---

## Colors
- Background: dark (`bg-background`)
- Primary: yellow/gold `#EAB308` (Tailwind `primary`) — DO NOT change
- Never use blue as primary; always yellow

## API Base
```ts
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
// Usage: fetch(`${BASE}/api/...`)
```

## Auth
- `useAuthStore` (zustand store `kanoon_auth`) — has `token`, `user`
- `authFetch` for authenticated requests
- `getAuthToken()` for raw JWT string

## Conversion / Dark Psychology components (in App.tsx layout)
- `UrgencyBar` — full-width countdown bar, session-dismissed
- `ExitIntent` — mouse leaves viewport (clientY ≤ 8), session-dismissed
- `LiveActivityToast` — "Priya from Mumbai created NDA" fires after 8s, every 22-35s
- `IdlePopup` — embedded in Preview.tsx, fires after 30s idle

**Why:** These conversion components dramatically increase purchase rate; must remain in layout.
