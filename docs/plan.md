# THROWN — Implementation Plan

**Version:** 2.0 (Deduction Rework)
**Date:** 2025-01-15
**Project Lead:** Mughil Sankar N
**Deadline:** Oct 2 Test-Build (Core Edition)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Implementation Phases](#3-implementation-phases)
4. [Phase 1: Foundation & Infrastructure](#phase-1-foundation--infrastructure)
5. [Phase 2: Core Game Logic](#phase-2-core-game-logic)
6. [Phase 3: Real-Time Layer](#phase-3-real-time-layer)
7. [Phase 4: Frontend & UI](#phase-4-frontend--ui)
8. [Phase 5: Social Features](#phase-5-social-features)
9. [Phase 6: Economy & Marketplace](#phase-6-economy--marketplace)
10. [Phase 7: Polish & Launch](#phase-7-polish--launch)
11. [Team Responsibilities](#4-team-responsibilities)
12. [Cross-Team Dependencies](#5-cross-team-dependencies)
13. [Risk Assessment](#6-risk-assessment)
14. [Milestones & Deliverables](#7-milestones--deliverables)

---

## 1. Project Overview

**THROWN** is a competitive, real-time, voting-based social deduction game set in the Volta Chronicles universe. Players are secretly assigned roles each round — most are Investigators, one or two are hidden Masks — and must use discussion, clue tokens, and majority voting to identify and eliminate the Mask(s) before a fixed round limit runs out.

### Core Gameplay Loop

1. **Assignment Phase** (5 sec): Server assigns roles + clue tokens secretly
2. **Discussion Phase** (45-75 sec): Players talk, share/withhold clues, bluff
3. **Vote Phase** (20 sec): Hidden simultaneous voting
4. **Tie Resolution** (Instant): Server-side tiebreak
5. **Reveal & Elimination** (Instant): Role revealed, scores updated
6. **Scoreboard** (Between rounds): Ad slot may trigger

### Win Conditions

- **Investigators win** if all Mask(s) are voted out within the round limit
- **Masks win** if the round limit is reached while at least one Mask survives
- At 6-8 players, catching only one of two Masks is NOT a win — both must be caught

### Match Length

- Fixed at lobby creation: **Best of 5** or **Best of 10** rounds

---

## 2. Technical Architecture

### Tech Stack

| Layer | Technology | Purpose |
| ------- | ------------ | --------- |
| Frontend | React.js + Framer Motion | UI, animations, PWA |
| Backend | Node.js + Express | API, match orchestration, role/vote logic |
| Real-Time | Socket.io | Discussion timer, hidden vote sync, simultaneous reveal, tiebreak broadcast |
| Database | Supabase (PostgreSQL) | Accounts, stats, SD$, friends, match/round/vote history |
| Cache/Sessions | Redis (via Supabase or Railway) | Live sessions, matchmaking queue, active rooms |
| Auth | Supabase Auth | Google + Apple + Email sign-in |
| Media | Cloudinary | Cosmetic asset delivery, DP images |
| Frontend Hosting | Vercel | Free tier to start |
| Backend Hosting | Railway | Free tier to start |

### Project Structure

```text
thrown/
├── client/                    # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-based pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React Context providers
│   │   ├── services/          # API client, socket service
│   │   ├── store/             # State management (Redux/Zustand)
│   │   ├── utils/             # Helper functions
│   │   ├── styles/            # Global styles, themes
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── api/               # REST API routes
│   │   ├── socket/            # Socket.io event handlers
│   │   ├── game/              # Core game logic
│   │   │   ├── stateMachine.js
│   │   │   ├── roleAssignment.js
│   │   │   ├── clueSystem.js
│   │   │   ├── votingSystem.js
│   │   │   └── scoringSystem.js
│   │   ├── matchmaking/       # Matchmaking queue logic
│   │   ├── economy/           # SD$ economy, marketplace
│   │   ├── auth/              # Authentication middleware
│   │   ├── models/            # Database models/schemas
│   │   └── utils/             # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Seed data
├── shared/                    # Shared types/constants
│   └── types.ts
└── docs/
    ├── PRD.pdf
    └── plan.md
```

---

## 3. Implementation Phases

### Phase 1: Foundation & Infrastructure

**Duration:** Week 1-2
**Goal:** Project setup, database schema, auth, basic API

#### Tasks

- [ ] Initialize monorepo structure (client + server)
- [ ] Set up Vite + React.js + TypeScript frontend
- [ ] Set up Node.js + Express + TypeScript backend
- [ ] Configure ESLint, Prettier, Husky pre-commit hooks
- [ ] Set up Supabase project and configure environment variables
- [ ] Design and implement database schema:
  - `users` (id, username, email, provider, avatar_url, bio, sd_balance, loser_tag, created_at)
  - `matches` (id, host_id, room_code, edition, max_players, best_of, status, created_at)
  - `match_players` (match_id, user_id, is_host, confirmed, joined_at)
  - `rounds` (id, match_id, round_number, status, discussion_timer, created_at)
  - `roles` (id, round_id, user_id, role_type, character_name, has_strong_clue, has_weak_clue)
  - `votes` (id, round_id, voter_id, target_id, is_valid)
  - `clue_tokens` (id, round_id, user_id, token_type, content, is_decoy)
  - `scores` (id, match_id, user_id, total_sd_earned, rounds_won, correct_votes, times_mask)
  - `friendships` (id, user_id, friend_id, status, created_at)
  - `items` (id, user_id, item_type, rarity, name, image_url, acquired_at)
  - `auctions` (id, seller_id, item_id, floor_price, current_bid, highest_bidder, ends_at)
  - `transactions` (id, user_id, type, amount, reference_id, created_at)
- [ ] Set up Supabase Auth (Google, Apple, Email/Password)
- [ ] Implement auth middleware (JWT verification)
- [ ] Create basic API routes:
  - POST /auth/signup
  - POST /auth/login
  - POST /auth/logout
  - GET /users/me
  - PATCH /users/me
- [ ] Set up Redis for session/cache management
- [ ] Configure Vercel deployment (frontend)
- [ ] Configure Railway deployment (backend)

#### Deliverables

- Working project structure
- Database schema deployed to Supabase
- Authentication flow functional
- Basic API endpoints working
- Deployment pipeline configured

---

### Phase 2: Core Game Logic

**Duration:** Week 2-4
**Goal:** Round state machine, role assignment, clue system, voting

#### Tasks

- [ ] Implement Round State Machine:

  ```text
  States: IDLE → ASSIGNMENT → DISCUSSION → VOTE → TIEBREAK → REVEAL → SCOREBOARD → (next round or END)
  ```

  - [ ] State transitions with guards (e.g., can't vote before discussion ends)
  - [ ] Event emitter for state changes (for Socket.io integration)
  - [ ] Timer management for each phase
- [ ] Implement Role Assignment Algorithm:
  - [ ] Server-authoritative randomization (never trust client)
  - [ ] Special role capping (1 special at 3-5 players, 2 at 6-8 players)
  - [ ] Role distribution logic:
    - 3-5 players: 1 Mask (The Artist)
    - 6-8 players: 2 Masks (The Artist + Victor/Puppeteer)
  - [ ] Special investigator roles:
    - Nova Reyes (Lead Investigator) - check clue strength
    - Mikaela (Protector) - grant immunity
    - Kate (Mediator) - extend discussion +20s
    - Tamara (Anchor) - vote counts as 2
    - D.M.W. (Unshakeable Boss) - immune Round 1
    - Auditor - sees vote breakdown
    - Lucky Charm - bonus on elimination
    - Vanilla (default, no ability)
- [ ] Implement Clue Token System:
  - [ ] Generate clue tokens per round (Strong/Weak)
  - [ ] Artist receives decoy clue (looks identical to normal)
  - [ ] Token distribution logic
  - [ ] Token display rules (who sees what)
- [ ] Implement Voting System:
  - [ ] Hidden vote submission (server-side only)
  - [ ] Simultaneous reveal broadcast
  - [ ] Tie resolution (random server-side tiebreak)
  - [ ] Vote validation (can't vote for self, can't vote twice)
  - [ ] Anchor's double-vote logic
  - [ ] Protector's immunity check
- [ ] Implement Scoring System:
  - [ ] Round scoring:
    - Investigator correct vote: +150 SD$
    - Investigator incorrect vote: +0 SD$
    - Mask survives round: +200 SD$
    - Mask caught: +0 SD$
  - [ ] Match bonus: +500 SD$ split among winning side
  - [ ] Lucky Charm bonus on elimination
- [ ] Implement Win Condition Checks:
  - [ ] Best of 5 / Best of 10 tracking
  - [ ] Investigator win: all masks voted out
  - [ ] Mask win: at least one mask survives to round limit
  - [ ] 6-8 player rule: both masks must be caught

#### Deliverables

- Complete round state machine
- Role assignment working correctly
- Clue system functional
- Voting system with hidden votes and simultaneous reveal
- Scoring system implemented
- Win conditions properly checked

---

### Phase 3: Real-Time Layer

**Duration:** Week 4-5
**Goal:** Socket.io events, matchmaking, live game session

#### Tasks

- [ ] Set up Socket.io server with Express
- [ ] Implement Socket.io events:
  - [ ] `match:create` - Create new match lobby
  - [ ] `match:join` - Join by room code
  - [ ] `match:leave` - Leave lobby
  - [ ] `match:confirm` - Confirm readiness
  - [ ] `match:start` - Host starts match
  - [ ] `match:cancel` - Cancel before start
  - [ ] `game:phase-change` - Broadcast phase transitions
  - [ ] `game:discussion-message` - Chat during discussion
  - [ ] `game:use-ability` - Special role abilities
  - [ ] `game:vote` - Submit hidden vote
  - [ ] `game:reveal` - Broadcast reveal results
  - [ ] `game:scoreboard` - Broadcast scoreboard
  - [ ] `game:match-end` - Match complete
- [ ] Implement Discussion Timer:
  - [ ] Server-authoritative timer (not client)
  - [ ] Sync timer to all clients
  - [ ] Mediator extend ability (+20s)
  - [ ] Timer scaling:
    - 3-4 players: 45 sec
    - 5-6 players: 60 sec
    - 7-8 players: 75 sec
- [ ] Implement Hidden Vote Sync:
  - [ ] Votes stored server-side only
  - [ ] No client can see others' votes early
  - [ ] Simultaneous reveal broadcast
- [ ] Implement Matchmaking Queue:
  - [ ] Random matchmaking (3-8 players)
  - [ ] Cancel before match starts
  - [ ] Queue management (join/leave)
- [ ] Implement Room System:
  - [ ] Room code generation (SDT-XXXX format)
  - [ ] Host controls (player cap 3-8, match length)
  - [ ] Join by code
  - [ ] Player cap enforcement
- [ ] Implement Reconnect/Disconnect Handling:
  - [ ] Player drops during Discussion phase
  - [ ] Player drops during Vote phase
  - [ ] Timeout handling (auto-eliminate if needed)
  - [ ] Rejoin logic

#### Deliverables

- Socket.io server configured
- All game events implemented
- Matchmaking queue working
- Room system functional
- Timer sync working
- Reconnect/disconnect handling

---

### Phase 4: Frontend & UI

**Duration:** Week 3-7 (overlaps with Phase 2-3)
**Goal:** Complete UI implementation

#### Tasks

- [ ] Set up React Router for navigation
- [ ] Implement UI Components:
  - [ ] **Entry Gate & Age Verification**
    - [ ] Age gate modal ("Are you 18 or older?")
    - [ ] Rules & Regulations page (full scroll required)
    - [ ] Accept button (enabled after scroll)
  - [ ] **Authentication Pages**
    - [ ] Login page (Google, Apple, Email)
    - [ ] Signup page
    - [ ] Password reset
  - [ ] **Profile & Settings**
    - [ ] User profile view/edit
    - [ ] DP (avatar) collection
    - [ ] Settings page
  - [ ] **Lobby UI**
    - [ ] Create Room screen
    - [ ] Join Room screen
    - [ ] Lobby members list
    - [ ] Pre-match screen (profiles, stats, Loser Tag)
    - [ ] Confirm/Ready button
    - [ ] Edition vote UI
  - [ ] **Game UI**
    - [ ] Role card display (Mask/Investigator/special roles)
    - [ ] Clue token display
    - [ ] Discussion phase UI:
      - [ ] Scaled timer (45-75 sec)
      - [ ] Chat panel (preset messages for randoms, free text for friends)
      - [ ] Mediator extend action button
    - [ ] Voting UI:
      - [ ] Hidden selection interface
      - [ ] Simultaneous reveal animation
      - [ ] Tiebreak result display
    - [ ] Scoreboard screen
    - [ ] Match-end results screen
  - [ ] **Shop UI**
    - [ ] Lootbox store (Common/Good/Legendary/Mythical)
    - [ ] Theme shop
    - [ ] Ad Box (voluntary ad watch)
  - [ ] **Social UI**
    - [ ] Friends list
    - [ ] Friend requests
    - [ ] Leaderboard (Global + Friends tabs)
    - [ ] Notifications panel
  - [ ] **Marketplace UI**
    - [ ] DP Marketplace
    - [ ] Auction House (24hr timer, bid interface)
    - [ ] Trade interface
- [ ] Implement Framer Motion Animations:
  - [ ] Card-flip reveals (Balatro-inspired)
  - [ ] Phase transition animations
  - [ ] Vote reveal animation
  - [ ] Scoreboard animations
  - [ ] Lootbox opening animation
- [ ] Implement Theme System:
  - [ ] Balatro-inspired visual identity
  - [ ] Deep dark backgrounds
  - [ ] Neon accents
  - [ ] Card-flip reveals
  - [ ] Theme switching (Default + purchasable themes)
- [ ] Implement Responsive Design:
  - [ ] Mobile-first approach
  - [ ] Tablet optimization
  - [ ] Desktop layout
- [ ] Implement PWA Features:
  - [ ] Service worker
  - [ ] Offline support (basic)
  - [ ] Install prompt

#### Deliverables

- Complete UI for all screens
- Framer Motion animations working
- Theme system functional
- Responsive design implemented
- PWA configured

---

### Phase 5: Social Features

**Duration:** Week 6-7
**Goal:** Friends, chat, leaderboard, notifications

#### Tasks

- [ ] **Friends System**
  - [ ] Unique friend code per account
  - [ ] Friend request flow (send/accept/reject)
  - [ ] Mutual-accept system
  - [ ] Online/offline status
  - [ ] Direct challenge (if online)
  - [ ] No friend limit
  - [ ] Unfriend functionality
- [ ] **Chat System**
  - [ ] Discussion Phase - Randoms: Preset messages only
  - [ ] Discussion Phase - Friends-only lobby: Free text, wordlist filtered
  - [ ] Post-match: Free text, wordlist filtered
  - [ ] Friends chat (outside match): Free text, wordlist filtered, number-pattern blocked
  - [ ] Wordlist filter implementation
  - [ ] Report system for inappropriate messages
- [ ] **Leaderboard System**
  - [ ] Board types:
    - [ ] SD$ Rich (highest balance)
    - [ ] Investigator Accuracy (highest correct-vote rate)
    - [ ] Mask Survivor (most rounds survived as Mask)
    - [ ] DP Rarity (rarest avatar owned)
  - [ ] Real-time updates
  - [ ] No seasonal reset
  - [ ] Global + Friends tabs
  - [ ] Guests can view but not place
- [ ] **Notification System**
  - [ ] In-app notifications only
  - [ ] Individually toggleable
  - [ ] Notification types:
    - [ ] Friend online
    - [ ] Challenge/match found
    - [ ] Vote phase starting
    - [ ] Round result
    - [ ] Loser Tag placed
    - [ ] Friend requests
    - [ ] Trades
    - [ ] Marketplace activity (bid/outbid/snipe warning/auction end)
- [ ] **Loser Tag System**
  - [ ] Applied when:
    - [ ] Account deletion with in-progress matches
    - [ ] Forfeit mid-match
  - [ ] Visible on profile
  - [ ] Removable with SD$ (100 SD$)

#### Deliverables

- Friends system working
- Chat with wordlist filtering
- Leaderboard with multiple boards
- Notification system functional
- Loser Tag system implemented

---

### Phase 6: Economy & Marketplace

**Duration:** Week 7-8
**Goal:** SD$ economy, marketplace, auction house

#### Tasks

- [ ] **SD$ Economy Backend**
  - [ ] Scoring payouts (Section 6.1)
  - [ ] Additional earning:
    - [ ] Scrapping duplicate DP (random 100-2,000 SD$)
    - [ ] Selling DP to friend/auction (seller-set price, above floor)
  - [ ] Spending SD$:
    - [ ] Common Lootbox (1,000 SD$)
    - [ ] Good Lootbox (5,000 SD$)
    - [ ] Legendary Lootbox (10,000 SD$)
    - [ ] Mythical Lootbox (50,000 SD$)
    - [ ] Remove Loser Tag (100 SD$)
    - [ ] Theme Shop items (variable)
- [ ] **Lootbox System**
  - [ ] Pull rates:
    - [ ] Common: 85%
    - [ ] Good: 12%
    - [ ] Legendary: 2.5%
    - [ ] Mythical: 0.5%
  - [ ] Animation for opening
  - [ ] Duplicate handling
- [ ] **Ad Box System**
  - [ ] Voluntary ad watch
  - [ ] Reward: 1 free cosmetic lootbox spin
  - [ ] Same pull rates as purchased lootbox
  - [ ] Ad provider integration (Google AdMob or similar)
- [ ] **DP Marketplace**
  - [ ] Friends Trade:
    - [ ] Direct trade at seller-set price
    - [ ] Above SDT floor price
  - [ ] Floor Price System:
    - [ ] Every DP has SDT-defined floor price
    - [ ] Prevents scalping/deflation
  - [ ] Scrapping DPs:
    - [ ] Sell duplicate for random 100-2,000 SD$
- [ ] **Auction House**
  - [ ] 24-hour timer
  - [ ] Escrowed bids
  - [ ] Friends limited to 1 bid each
  - [ ] 5-minute snipe warning with NO extension
  - [ ] Auction end notification

#### Deliverables

- SD$ economy working
- Lootbox system functional
- Ad Box system integrated
- DP Marketplace working
- Auction House functional

---

### Phase 7: Polish & Launch

**Duration:** Week 8-9
**Goal:** Testing, optimization, launch prep

#### Tasks

- [ ] **Testing**
  - [ ] Unit tests for game logic
  - [ ] Integration tests for API
  - [ ] E2E tests for critical flows
  - [ ] Load testing (concurrent matches)
  - [ ] Security audit
- [ ] **Performance Optimization**
  - [ ] Bundle size optimization
  - [ ] Image optimization (Cloudinary)
  - [ ] Database query optimization
  - [ ] Redis caching strategy
  - [ ] Socket.io connection optimization
- [ ] **Bug Fixes**
  - [ ] Address all known issues
  - [ ] Edge case handling
  - [ ] Error handling improvements
- [ ] **Documentation**
  - [ ] API documentation
  - [ ] User guide
  - [ ] Developer setup guide
- [ ] **Launch Prep**
  - [ ] Production environment setup
  - [ ] Monitoring & logging
  - [ ] Backup strategy
  - [ ] Rollback plan
  - [ ] Marketing assets

#### Deliverables

- All tests passing
- Performance optimized
- Documentation complete
- Production ready

---

## 4. Team Responsibilities

### Mughil — Project Lead + Core Game Logic

- [ ] Own the overall THROWN architecture and integration between all systems
- [ ] Build the core round-state machine: Assignment → Discussion → Vote → Tiebreak → Reveal → Scoreboard
- [ ] Implement role/clue assignment algorithm (server-authoritative randomization, special-role capping per player count)
- [ ] Implement scoring logic (Section 6.1) and win-condition checks (Section 5.6)
- [ ] Run sprint check-ins with Niranjan, Akthas, and Madur
- [ ] Sign off on each milestone before merge
- [ ] Own final PRD updates and QA pass before the Oct 2 test-build deadline

### Niranjan — Real-Time Layer & Database

- [ ] Socket.io events: discussion timer sync, hidden vote submission, simultaneous reveal broadcast, tiebreak resolution broadcast
- [ ] Supabase schema: matches, rounds, votes, roles-per-round, clue tokens, scores
- [ ] Ensure votes stay hidden server-side until reveal (no client can see others' votes early)
- [ ] Reconnect/disconnect handling mid-round (player drops during Discussion or Vote phase)

### Akthas — Backend Match Orchestration & Economy

- [ ] Lobby creation/join flow, room codes, matchmaking queue, player-cap enforcement (3-8)
- [ ] Anti-cheat safeguards: role/clue data never transmitted to non-owning clients
- [ ] SD$ economy backend: scoring payouts, lootbox pull-rate logic, Ad Box reward validation
- [ ] Marketplace backend: auction escrow, floor price enforcement, snipe-window logic

### Madur — Frontend & UI

- [ ] Role card UI (Mask/Investigator/special roles) and clue token display
- [ ] Discussion Phase UI (scaled timer, chat, Mediator extend action)
- [ ] Voting UI (hidden selection, simultaneous reveal animation, tiebreak result display)
- [ ] Scoreboard and match-end results screens
- [ ] Cosmetic shop UI (lootboxes, theme shop, Ad Box) and theme system rendering

---

## 5. Cross-Team Dependencies

| Dependency | Blocks | Resolution |
| ------------ | -------- | ------------ |
| Mughil's role/vote state machine | Niranjan's Socket.io events need the state machine's event contracts first | Define event contracts early, implement state machine first |
| Niranjan's Supabase schema | Akthas's economy backend needs match/round tables to log payouts against | Design schema together, implement DB first |
| Akthas's anti-cheat role delivery | Madur's role card UI can't render real data until this is in place | Implement anti-cheat role delivery early, mock data for UI development |

---

## 6. Risk Assessment

| Risk | Impact | Probability | Mitigation |
| ------ | -------- | ------------- | ------------ |
| Socket.io complexity | High | Medium | Start with basic events, iterate |
| Real-time sync issues | High | Medium | Extensive testing, server-authoritative design |
| Anti-cheat vulnerabilities | Critical | Low | Server-side validation, never trust client |
| Performance at scale | High | Medium | Load testing early, optimize queries |
| Scope creep | High | High | Strict adherence to PRD, defer Chaos Mode |
| Team coordination | Medium | Medium | Daily standups, clear documentation |

---

## 7. Milestones & Deliverables

### Milestone 1: Foundation (Week 2)

- [ ] Project structure complete
- [ ] Database schema deployed
- [ ] Authentication working
- [ ] Basic API endpoints functional

### Milestone 2: Core Game (Week 4)

- [ ] Round state machine working
- [ ] Role assignment functional
- [ ] Clue system implemented
- [ ] Voting system working
- [ ] Scoring system implemented

### Milestone 3: Real-Time (Week 5)

- [ ] Socket.io events working
- [ ] Matchmaking functional
- [ ] Room system working
- [ ] Timer sync working

### Milestone 4: UI (Week 7)

- [ ] All screens implemented
- [ ] Animations working
- [ ] Theme system functional
- [ ] Responsive design complete

### Milestone 5: Social (Week 7)

- [ ] Friends system working
- [ ] Chat functional
- [ ] Leaderboard working
- [ ] Notifications working

### Milestone 6: Economy (Week 8)

- [ ] SD$ economy working
- [ ] Lootbox system functional
- [ ] Marketplace working
- [ ] Auction House functional

### Milestone 7: Launch (Week 9)

- [ ] All tests passing
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Production deployed

---

## 8. Open Questions (from PRD)

1. **Chaos Mode modifier list** — needs a dedicated brainstorm before scoping
   - *Decision: Defer to post-launch*
2. **Voice chat built-in for Discussion Phase, or assume external call/in-person?**
   - *Decision: Assume external call/in-person for v1.0; voice chat is a post-launch feature*
3. **Can eliminated Investigators spectate later rounds, or fully exit the session?**
   - *Decision: Eliminated Investigators can spectate but not participate*
4. **Does the Oct 2 test-build deadline target Core edition only, or Core + Extended?**
   - *Decision: Core edition only for Oct 2; Extended edition post-launch*

---

## 9. Editions

| Edition | Player Range | Masks | Feel |
| --------- | -------------- | ------- | ------ |
| Core | 3-5 | 1 | Fast, easy to learn, classic deduction |
| Extended | 6-8 | 2 | Higher variance, harder Investigator coordination |
| Chaos Mode | 6-8 | 2 + rotating modifier each match | Highest variance — for experienced groups |

**Oct 2 Deadline:** Core edition only

---

## 10. Character & Role Assignments

### The Mask Roles (hidden, win by surviving the vote)

| Character | Role | Player Count | Ability |
|-----------|------|--------------|---------|
| The Artist | Primary Mask | 3-8 (always present) | Receives a decoy clue token that reads identically to a normal Investigator clue |
| Victor (Puppeteer) | Second Mask | 6-8 only | Once per match, may secretly redirect one vote after seeing the live tally trend |

### Special Investigator Roles (randomly assigned, capped per match)

| Character | Role Name | Ability |
| ----------- | ----------- | --------- |
| Nova Reyes | Lead Investigator | Once per match, may privately check whether one other player's clue is Strong or Weak |
| Mikaela (Mileb) | Protector | Once per match, may grant one player immunity from that round's elimination vote |
| Kate (Madam Volta) | Mediator | Once per match, may extend the Discussion Phase timer by +20 seconds |
| Tamara (Golden Star) | Anchor | Once per match, her vote counts as 2 votes toward the elimination tally |
| D.M.W. | Unshakeable Boss | Cannot be selected as the elimination target during Round 1 of the match |
| Auditor | Vanilla | Sees the numeric vote-count breakdown (not who voted for whom) moments before reveal |
| Lucky Charm | Vanilla | If voted out and revealed as an Investigator, all remaining Investigators receive a small bonus |

### Standard Role

**Volta Agent** — the default Investigator skin with no special ability. Fills all remaining seats not assigned to a Mask or special role.

---

## Appendix A: Database Schema (Detailed)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(16) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  provider VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  sd_balance INTEGER DEFAULT 0,
  loser_tag BOOLEAN DEFAULT FALSE,
  friend_code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id),
  room_code VARCHAR(10) UNIQUE,
  edition VARCHAR(50) DEFAULT 'core',
  max_players INTEGER CHECK (max_players BETWEEN 3 AND 8),
  best_of INTEGER CHECK (best_of IN (5, 10)),
  status VARCHAR(20) DEFAULT 'lobby',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Match Players table
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  is_host BOOLEAN DEFAULT FALSE,
  confirmed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'assignment',
  discussion_timer INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role_type VARCHAR(50) NOT NULL,
  character_name VARCHAR(100),
  has_strong_clue BOOLEAN DEFAULT FALSE,
  has_weak_clue BOOLEAN DEFAULT FALSE,
  ability_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

-- Clue Tokens table
CREATE TABLE clue_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  token_type VARCHAR(20) NOT NULL,
  content TEXT,
  is_decoy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  target_id UUID REFERENCES users(id),
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, voter_id)
);

-- Scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  total_sd_earned INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  correct_votes INTEGER DEFAULT 0,
  times_mask INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Items table (DPs, themes, etc.)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  rarity VARCHAR(20),
  name VARCHAR(100),
  image_url TEXT,
  floor_price INTEGER,
  acquired_at TIMESTAMP DEFAULT NOW()
);

-- Auctions table
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  floor_price INTEGER NOT NULL,
  current_bid INTEGER,
  highest_bidder_id UUID REFERENCES users(id),
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_user ON match_players(user_id);
CREATE INDEX idx_rounds_match ON rounds(match_id);
CREATE INDEX idx_roles_round ON roles(round_id);
CREATE INDEX idx_votes_round ON votes(round_id);
CREATE INDEX idx_scores_match ON scores(match_id);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_auctions_ends ON auctions(ends_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

---

## Appendix B: Socket.io Event Contracts

```typescript
// Client → Server Events
interface ClientEvents {
  'match:create': (data: { maxPlayers: number; bestOf: 5 | 10; edition: string }) => void;
  'match:join': (data: { roomCode: string }) => void;
  'match:leave': () => void;
  'match:confirm': () => void;
  'match:start': () => void;
  'match:cancel': () => void;
  'game:discussion-message': (data: { message: string }) => void;
  'game:use-ability': (data: { abilityType: string; targetId?: string }) => void;
  'game:vote': (data: { targetId: string }) => void;
}

// Server → Client Events
interface ServerEvents {
  'match:created': (data: { matchId: string; roomCode: string }) => void;
  'match:joined': (data: { matchId: string; players: Player[] }) => void;
  'match:player-joined': (data: { player: Player }) => void;
  'match:player-left': (data: { playerId: string }) => void;
  'match:player-confirmed': (data: { playerId: string }) => void;
  'match:started': (data: { matchId: string }) => void;
  'match:cancelled': () => void;
  'game:phase-change': (data: { phase: GamePhase; timer?: number }) => void;
  'game:role-assigned': (data: { role: Role; clue: ClueToken }) => void;
  'game:discussion-message': (data: { playerId: string; message: string }) => void;
  'game:timer-update': (data: { timeRemaining: number }) => void;
  'game:vote-received': () => void;
  'game:reveal': (data: { votes: VoteResult[]; eliminated?: Player; tiebreak?: boolean }) => void;
  'game:scoreboard': (data: { scores: Score[] }) => void;
  'game:match-end': (data: { winner: 'investigators' | 'masks'; finalScores: Score[] }) => void;
  'error': (data: { message: string; code: string }) => void;
}
```

---

## Appendix C: Role Assignment Algorithm

```typescript
function assignRoles(players: Player[], edition: 'core' | 'extended' | 'chaos'): RoleAssignment[] {
  const assignments: RoleAssignment[] = [];
  const shuffledPlayers = shuffle(players);
  
  // Determine number of masks based on player count
  const maskCount = players.length >= 6 ? 2 : 1;
  
  // Assign masks
  const maskCharacters = ['the-artist'];
  if (players.length >= 6) {
    maskCharacters.push('victor');
  }
  
  for (let i = 0; i < maskCount; i++) {
    assignments.push({
      userId: shuffledPlayers[i].id,
      roleType: 'mask',
      characterName: maskCharacters[i],
      hasStrongClue: false,
      hasWeakClue: false
    });
  }
  
  // Determine number of special investigators
  const specialCount = players.length >= 6 ? 2 : 1;
  const specialRoles = ['nova-reyes', 'mikaela', 'kate', 'tamara', 'dmw', 'auditor', 'lucky-charm'];
  const shuffledSpecials = shuffle(specialRoles).slice(0, specialCount);
  
  // Assign special investigators
  for (let i = 0; i < specialCount; i++) {
    assignments.push({
      userId: shuffledPlayers[maskCount + i].id,
      roleType: 'special-investigator',
      characterName: shuffledSpecials[i],
      hasStrongClue: true,
      hasWeakClue: false
    });
  }
  
  // Assign vanilla investigators to remaining players
  for (let i = maskCount + specialCount; i < players.length; i++) {
    assignments.push({
      userId: shuffledPlayers[i].id,
      roleType: 'investigator',
      characterName: 'volta-agent',
      hasStrongClue: Math.random() > 0.5,
      hasWeakClue: Math.random() > 0.5
    });
  }
  
  // Assign decoy clue to Artist
  const artistAssignment = assignments.find(a => a.characterName === 'the-artist');
  if (artistAssignment) {
    artistAssignment.hasStrongClue = true; // Decoy clue (looks like strong)
  }
  
  return assignments;
}
```

---

## Appendix D: Environment Variables

```env
# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# Backend
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## Appendix F: API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Send password reset email

### Users

- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `DELETE /api/users/me` - Delete account
- `GET /api/users/:id` - Get user profile by ID
- `GET /api/users/leaderboard/:board` - Get leaderboard

### Matches

- `POST /api/matches` - Create match (also creates room code)
- `GET /api/matches/:id` - Get match details
- `POST /api/matches/:id/join` - Join match by room code
- `POST /api/matches/:id/leave` - Leave match
- `POST /api/matches/:id/confirm` - Confirm readiness
- `POST /api/matches/:id/start` - Start match (host only)

### Rounds

- `GET /api/matches/:matchId/rounds/:roundId` - Get round details
- `GET /api/matches/:matchId/rounds/:roundId/roles` - Get player's role (private)
- `GET /api/matches/:matchId/rounds/:roundId/clues` - Get player's clues (private)

### Economy

- `GET /api/economy/balance` - Get SD$ balance
- `POST /api/economy/lootbox/open` - Open lootbox
- `POST /api/economy/ad-box/watch` - Watch ad for reward

### Items

- `GET /api/items` - Get user's items
- `POST /api/items/:id/scrap` - Scrap item for SD$
- `POST /api/items/:id/list` - List item on marketplace

### Auctions

- `GET /api/auctions` - Get active auctions
- `POST /api/auctions` - Create auction
- `POST /api/auctions/:id/bid` - Place bid
- `GET /api/auctions/:id` - Get auction details

### Friends

- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `DELETE /api/friends/:id` - Remove friend

### Notifications

- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

---

*Document Version: 1.0*
*Last Updated: 2025-01-15*
*Author: Mughil Sankar N*
