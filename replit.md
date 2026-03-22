# KanoonAI - AI Legal Document Generator SaaS

## Overview

KanoonAI is a production-ready AI Legal Document Generator SaaS for India. Users can generate professional legal documents in 60 seconds using Claude AI, with phone OTP login, Razorpay payments, and PDF download.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)
- **Payments**: Razorpay
- **Auth**: Phone OTP + JWT
- **PDF**: PDFKit

## Project Structure

```text
artifacts/
├── api-server/         # Express API server (Port 8080, path /api)
│   └── src/
│       ├── routes/     # auth.ts, documents.ts, payments.ts, admin.ts
│       ├── middleware/ # auth.ts (JWT middleware)
│       └── utils/      # aiGenerator.ts, pdfGenerator.ts, otpService.ts
└── kanoon-ai/          # React frontend (Port 20839, path /)
    └── src/
        ├── pages/      # Home, Login, documents/, Dashboard, admin/
        ├── components/ # layout/ (Navbar, Footer)
        ├── hooks/      # use-auth.ts, use-language.ts
        └── lib/        # constants.ts (document types, prices, fields)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas
└── db/
    └── schema/         # users, documents, payments, subscriptions, referrals
```

## Features

1. **Landing Page**: High-converting hero, trust badges, pricing, FAQ
2. **Auth**: Phone OTP login (MSG91 or dev mode), JWT tokens, auto account creation
3. **Document Selection**: 25+ document types across 6 categories
4. **AI Generation**: Claude AI with document-specific prompts, Hindi/English support
5. **Payment**: Razorpay integration, per-document pricing (₹99-₹499), subscription plans
6. **PDF Download**: PDFKit-generated professional PDFs with letterhead
7. **User Dashboard**: Document history, subscription status, referral system
8. **Admin Panel**: Revenue stats, user management, transaction history
9. **Multi-language**: Hindi, English toggle (Marathi, Tamil, Telugu in AI output)

## Document Categories & Prices

- **Rental & Housing**: Rent Agreement ₹199, Leave & License ₹199, NOC ₹99, Eviction ₹99
- **Business & Finance**: Partnership Deed ₹499, MOU ₹499, Business Contract ₹499, NDA ₹299
- **Personal & Family**: Affidavit ₹199, Gift Deed ₹499, Will ₹499
- **Legal Notices**: FIR Draft ₹199, Legal Notice ₹299, RTI ₹99
- **Employment**: Offer Letter ₹99, Employment Contract ₹199, Termination Letter ₹99
- **Government**: Income/Caste/Domicile/Ration Card applications ₹99

## Subscription Plans

- **Basic**: ₹299/month (5 docs)
- **Pro**: ₹699/month (unlimited)
- **Business**: ₹1999/month (team + API)

## Environment Variables Required

- `ANTHROPIC_API_KEY` - For Claude AI document generation
- `RAZORPAY_KEY_ID` - Razorpay payment gateway key
- `RAZORPAY_KEY_SECRET` - Razorpay payment gateway secret
- `JWT_SECRET` - JWT signing secret (already set)
- `MSG91_API_KEY` - For SMS OTP (optional, dev mode shows OTP in response)
- `DATABASE_URL` - PostgreSQL connection (auto-provisioned)

## Development

Without MSG91_API_KEY, the API returns the OTP in the response (dev mode only). This allows testing without real SMS.

Without RAZORPAY keys, a dev order is created and payment verification is auto-approved (for testing).

## Admin Access

To make a user admin, run: `UPDATE users SET is_admin = true WHERE phone = '<phone>';`
Then login with that phone number to access `/admin`.

## Database Tables

- `users` - id, phone, name, plan, referral_code, otp_hash, otp_expiry, is_admin
- `documents` - id, user_id, type, title, content, form_data, pdf_url, paid, language, price
- `payments` - id, user_id, document_id, amount, razorpay_order_id, razorpay_payment_id, status, plan
- `subscriptions` - id, user_id, plan, start_date, end_date, status
- `referrals` - id, referrer_id, referred_id, reward_paid
