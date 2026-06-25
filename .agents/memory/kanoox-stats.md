---
name: Kanoox Stats Canonical
description: The one source of truth for all stats shown across the Kanoox AI site
---

## Canonical Numbers (always use these)
| Metric | Value |
|---|---|
| Documents Generated | 47,000+ |
| Happy Customers | 12,000+ |
| Indian States Served | 28 |
| Avg Generation Time | <60 seconds |
| Star Rating | 4.9★ |
| Review Count | 1,247 |
| Monthly subscribers badge | "83 people subscribed this month" |
| Daily docs badge | "247 docs today" |
| Savings vs lawyer | 98% / "Save ₹49,000+" |

## Files that must stay in sync
- `src/pages/Home.tsx` — STATS array, hero floating card, final CTA
- `src/pages/documents/Index.tsx` — hero stats row
- `src/pages/Login.tsx` — stats grid + trust badge
- `src/pages/seo/DocumentPage.tsx` — meta description + trust line
- `src/pages/documents/Download.tsx` — rating social proof
- `src/hooks/use-seo.ts` — DEFAULT_DESCRIPTION
- `src/components/layout/Footer.tsx` — brand description
- `src/components/layout/UrgencyBar.tsx` — message copy

**Why:** Inconsistent numbers destroy trust. Always grep for old numbers when updating.
