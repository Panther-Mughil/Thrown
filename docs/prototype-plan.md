# THROWN Prototype Plan

**Goal:** Build a working prototype of the core deduction game loop
**Scope:** Core Edition only (3-5 players, 1 Mask)
**Timeline:** Single session implementation

---

## Prototype Scope

### What We're Building

A minimal but functional version of THROWN that demonstrates:

- Room creation and joining
- Role assignment (server-authoritative)
- Discussion phase with timer
- Hidden voting with simultaneous reveal
- Basic scoring and win conditions

### What We're NOT Building (Yet)

- Real-time Socket.io (use polling/local state for now)
- User authentication
- SD$ economy
- Marketplace/Auctions
- Multiple editions
- Special investigator abilities (simplified to vanilla)
- Chat system
- Friend system

---

## Architecture

### Simplified Tech Stack

```
client/     → React + Vite + TypeScript + Tailwind
server/     → Express + TypeScript (minimal)
game/       → Core game logic (role assignment, voting, scoring)
```

### Data Flow

```
1. Player creates/joins room → Server stores room state
2. Host starts game → Server assigns roles
3. Players see their role → Discussion phase begins
4. Players vote → Server tallies votes
5. Result revealed → Score updated → Next round or match end
```

---

## Implementation Steps

### Step 1: Server Game Engine (`server/src/game/`)

Create the core game engine with these files:

#### `server/src/game/types.ts`

```typescript
export type GamePhase =
  "lobby" | "assignment" | "discussion" | "vote" | "reveal" | "scoreboard" | "ended";
export type RoleType = "mask" | "investigator";
export type CharacterName = "the-artist" | "volta-agent";

export interface Player {
  id: string;
  username: string;
  isHost: boolean;
  confirmed: boolean;
}

export interface RoleAssignment {
  playerId: string;
  roleType: RoleType;
  characterName: CharacterName;
  hasClue: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface Round {
  roundNumber: number;
  phase: GamePhase;
  roles: RoleAssignment[];
  votes: Vote[];
  eliminated?: string;
  discussionTimer: number;
}

export interface Match {
  id: string;
  roomCode: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  bestOf: 5 | 10;
  currentRound: number;
  rounds: Round[];
  scores: Record<string, number>;
  wins: Record<string, number>;
  status: "lobby" | "in-progress" | "ended";
}
```

#### `server/src/game/engine.ts`

```typescript
// Core game logic functions:
// - createMatch(hostId, maxPlayers, bestOf)
// - joinMatch(matchId, playerId)
// - startMatch(matchId)
// - assignRoles(matchId)
// - submitVote(matchId, voterId, targetId)
// - tallyVotes(matchId)
// - checkWinCondition(matchId)
// - getMatchState(matchId)
```

#### `server/src/game/roles.ts`

```typescript
// Role assignment algorithm:
// - 3-5 players → 1 Mask (The Artist)
// - 6-8 players → 2 Masks (The Artist + Victor)
// - Special roles capped per player count
// - Server-authoritative randomization
```

### Step 2: API Routes (`server/src/routes/`)

#### `server/src/routes/match.ts`

```
POST   /api/matches           → Create match
GET    /api/matches/:id       → Get match state
POST   /api/matches/:id/join  → Join match
POST   /api/matches/:id/start → Start match (host only)
POST   /api/matches/:id/vote  → Submit vote
GET    /api/matches/:id/result → Get round result
```

### Step 3: Client Game State (`client/src/`)

#### `client/src/store/gameStore.ts`

```typescript
// Zustand store for game state:
// - match: current match data
// - player: current player info
// - phase: current game phase
// - actions: joinMatch, startGame, submitVote, etc.
```

#### `client/src/pages/GamePage.tsx`

```typescript
// Main game page that renders:
// - Lobby (before game starts)
// - RoleCard (shows your role)
// - DiscussionPhase (timer + chat placeholder)
// - VotePhase (voting interface)
// - RevealPhase (results)
// - Scoreboard (scores)
```

### Step 4: UI Components (`client/src/components/`)

#### `client/src/components/Lobby.tsx`

- Player list with ready status
- Host controls (start button)
- Room code display

#### `client/src/components/RoleCard.tsx`

- Card flip animation (Framer Motion)
- Shows role (Mask/Investigator)
- Shows clue (if has one)
- "You are the Mask!" or "Find the Mask!"

#### `client/src/components/DiscussionPhase.tsx`

- Countdown timer (45 sec for 3-5 players)
- Player avatars in circle
- Chat placeholder (presets only for prototype)

#### `client/src/components/VotePhase.tsx`

- Click to select target
- Submit vote button
- "Waiting for others..." state

#### `client/src/components/RevealPhase.tsx`

- Animated reveal of votes
- Show who voted for whom
- Highlight eliminated player
- Role reveal animation

#### `client/src/components/Scoreboard.tsx`

- Current scores
- Rounds won
- Match progress (Best of X)

---

## File Structure (New Files Only)

```
thrown/
├── server/
│   └── src/
│       ├── index.ts              # Express + Socket.io server
│       ├── routes/
│       │   └── match.ts          # Match API routes
│       └── game/
│           ├── types.ts          # Game type definitions
│           ├── engine.ts         # Core game logic
│           └── roles.ts          # Role assignment
├── client/
│   └── src/
│       ├── App.tsx               # Router setup
│       ├── main.tsx              # Entry point
│       ├── store/
│       │   └── gameStore.ts      # Zustand game state
│       ├── pages/
│       │   ├── HomePage.tsx      # Landing page
│       │   └── GamePage.tsx      # Main game page
│       ├── components/
│       │   ├── Lobby.tsx
│       │   ├── RoleCard.tsx
│       │   ├── DiscussionPhase.tsx
│       │   ├── VotePhase.tsx
│       │   ├── RevealPhase.tsx
│       │   └── Scoreboard.tsx
│       └── utils/
│           └── socket.ts        # Socket.io client (for later)
└── shared/
    └── types.ts                  # Shared type definitions
```

---

## Key Features

### 1. Room System

- Create room → Get room code (SDT-XXXX)
- Join by code
- 3-5 players for prototype

### 2. Role Assignment

- Server assigns roles secretly
- 1 Mask (The Artist) in 3-5 player game
- Others are Volta Agents (Investigators)
- Each player gets a clue (Mask gets decoy)

### 3. Discussion Phase

- 45 second timer
- Visual indicator of time remaining
- Player avatars shown
- Chat placeholder (preset messages)

### 4. Voting

- Click player to select
- Confirm vote
- Votes hidden until all submit
- Server tallies votes

### 5. Reveal

- Animated reveal
- Show vote counts
- Eliminated player's role revealed
- If Mask → Investigators win round
- If Investigator → Mask survives

### 6. Scoring

- Investigators correct vote: +150 SD$
- Mask survives: +200 SD$
- First to 3 round wins (Best of 5) wins match

---

## Testing Strategy

### Manual Testing Flow

1. Open two browser tabs
2. Tab 1: Create room
3. Tab 2: Join room
4. Tab 1: Start game
5. Both: See roles
6. Both: Wait for discussion timer
7. Both: Vote
8. Both: See reveal
9. Repeat until match ends

---

## Success Criteria

- [ ] Room creation and joining works
- [ ] Roles assigned correctly (1 Mask per 3-5 players)
- [ ] Discussion timer counts down
- [ ] Voting works (hidden until reveal)
- [ ] Reveal shows results
- [ ] Score tracking works
- [ ] Win condition detected
- [ ] UI is responsive and animated

---

_This prototype demonstrates the core deduction loop. Real-time sync, auth, and economy come later._
