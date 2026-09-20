---
name: Kanoox guest-only access
description: Durable product decision that the public Kanoon AI website must not expose accounts or authentication.
---

The public Kanoon AI website is strictly guest-only. Do not reintroduce account creation, login, signup, dashboard, auth callback, or authenticated document UI. Document generation, payment, and PDF delivery must continue through the guest endpoints.

**Why:** The product owner explicitly requires that the website have no sign-up or login system.

**How to apply:** Keep public navigation, legal copy, document generation, and payment flows account-free. Treat backend auth code as legacy/internal unless the product owner explicitly changes this requirement.