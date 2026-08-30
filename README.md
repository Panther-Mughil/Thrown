# THROWN

A competitive, real-time, voting-based social deduction game set in the Volta Chronicles universe.

## Overview

Players are secretly assigned roles each round — most are **Investigators**, one or two are hidden **Masks** — and must use discussion, clue tokens, and majority voting to identify and eliminate the Mask(s) before a fixed round limit runs out.

## Tech Stack

| Layer | Technology |
| ------- | ------------ |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand + React Query |
| Backend | Node.js + Express + TypeScript |
| Real-Time | Socket.io |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Cache | Redis (ioredis) |
| Auth | Custom JWT (expandable to Supabase Auth) |
| Media | Cloudinary |
| Styling | Tailwind CSS |
| Testing | Vitest |
| Monorepo | npm workspaces |

## Project Structure

```
thrown/
├── client/          # React.js frontend (Vite + TypeScript)
├── server/          # Node.js backend (Express + TypeScript)
├── shared/          # Shared types and constants
├── docs/            # PRD and implementation plan
└── package.json     # Root monorepo config
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL (or Supabase account)
- Redis (local or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/Panther-Mughil/Thrown.git
cd Thrown

# Install all dependencies
npm install

# Copy environment files
cp client/.env.example client/.env
cp server/.env.example server/.env

# Start development servers
npm run dev
```

### Development

```bash
# Run client only
npm run dev:client

# Run server only
npm run dev:server

# Run both
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

## Core Gameplay

1. **Assignment Phase** (5 sec) — Server secretly assigns roles + clue tokens
2. **Discussion Phase** (45-75 sec) — Players talk, share/withhold clues, bluff
3. **Vote Phase** (20 sec) — Hidden simultaneous voting
4. **Tie Resolution** (Instant) — Server-side tiebreak
5. **Reveal & Elimination** (Instant) — Role revealed, scores updated
6. **Scoreboard** (Between rounds) — Ad slot may trigger

### Roles

#### Masks (hidden)

- **The Artist** — Always present; receives a decoy clue
- **Victor (Puppeteer)** — 6-8 players; once per match redirects a vote

#### Special Investigators

- **Nova Reyes** (Lead Investigator) — Check clue strength
- **Mikaela** (Protector) — Grant immunity
- **Kate** (Mediator) — Extend discussion +20s
- **Tamara** (Anchor) — Vote counts as 2
- **D.M.W.** (Unshakeable Boss) — Immune Round 1
- **Auditor** — Sees vote breakdown
- **Lucky Charm** — Bonus on elimination

## Documentation

- [PRD (PDF)](docs/PRD.pdf)
- [PRD (Markdown)](docs/PRD.md)
- [Implementation Plan](docs/plan.md)

## Team

- **Mughil Sankar N** — Project Lead + Core Game Logic
- **Niranjan** — Real-Time Layer & Database
- **Akthas** — Backend Match Orchestration & Economy
- **Madur** — Frontend & UI

## License

Proprietary — Super Duper Techno (SDT)
