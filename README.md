# Leak Check Bot

A Telegram bot that lets users check whether **their own** email address has appeared in known data breaches.

Ownership of the email is verified with a one-time code before any lookup, so the bot can't be used to check or monitor other people's addresses.

> **Status:** work in progress. The bot skeleton, database layer and email verification logic are implemented. Breach lookup, payments and monitoring are on the roadmap (see below).

## Features

**Implemented**

- Telegram bot built with [grammY](https://grammy.dev) (`/start` command, global error handler)
- Relational data model (User, Email, VerificationCode) with Prisma and SQLite
- Email normalization and validation (trim, lowercase, format check, 254-char limit)
- One-time verification codes:
  - 6-digit codes generated with `crypto.randomInt` (cryptographically secure)
  - stored only as **HMAC-SHA256** hashes with a server-side secret, so a leaked database alone does not expose usable codes
  - constant-time comparison with `timingSafeEqual`
  - 10-minute expiry
- Abuse protection when requesting codes:
  - at most 1 code per address per minute
  - at most 5 codes per user per hour
  - at most 3 codes per target address per hour across all users (prevents using the bot to spam a third party)

**In progress**

- Code confirmation with attempt limit (5 attempts, atomic counter)
- Sending verification emails (Resend / SMTP)

## Roadmap

- [ ] Breach lookup via the Have I Been Pwned API v3
- [ ] Free tier: number of breaches; paid tier: breach details and recommendations
- [ ] Payments with Telegram Stars
- [ ] Scheduled monitoring with notifications about new breaches
- [ ] Data deletion command and privacy policy
- [ ] Cleanup job for expired codes
- [ ] Optional admin dashboard (Next.js)

## Tech stack

- Node.js, TypeScript (ES modules)
- grammY
- Prisma 6 + SQLite (PostgreSQL planned for production)
- tsx for running TypeScript directly

## Project structure

```
prisma/
  schema.prisma        # User, Email, VerificationCode models
src/
  index.ts             # bot entry point
  db.ts                # Prisma client
  verification.ts      # normalizeEmail, generateCode, hashCode, verifyCode
  emailFlow.ts         # startVerification (rate limits, code creation)
```

## Getting started

Requirements: Node.js 18+ and a bot token from [@BotFather](https://t.me/BotFather).

```bash
git clone https://github.com/<your-username>/bot-leak.git
cd bot-leak
npm install
```

Create a `.env` file (see `.env.example`):

```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL="file:./dev.db"
CODE_SECRET=long_random_string
```

Generate a secret for `CODE_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Apply the database migrations and run the bot:

```bash
npx prisma migrate dev
npx tsx src/index.ts
```

## Security and privacy notes

- Only the user's own, verified email addresses are checked.
- Verification codes are never stored in plain text.
- Secrets live in environment variables and are excluded from version control.
- Rate limits are checked before a code is created; they are not yet atomic under heavy concurrent load (a transaction or Redis counter is planned).

## License

MIT
