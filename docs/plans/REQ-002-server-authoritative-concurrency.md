# THROWN — Server-Authoritative Concurrency Fix

**Date:** 2025-08-30
**Status:** Approved for immediate implementation (urgent)

---

## Problem

Joiners never leave the lobby while the host plays normally.

### Root causes

1. **`sync()` never merges `match`** into client state (`gameStore.ts`).
   - `updates` object omits `match` → joiner's `match.status` stays `"lobby"`.
   - GamePage transition requires `match.status === "in_progress"` → never fires for joiners.
   - Host advances locally (direct `set` in `startGame`) → only host moves on.

2. **Phase machine is client-driven, not server-driven** — no true concurrency.
   - Each browser runs its own local 45s discussion timer and calls `setPhase("vote")`.
   - Voting/reveal/scoring/next-round are triggered by whichever client happens to act.
   - `tallyVotes` computes scores client-side from `allRoles` (rejoining clients lack it).

## Fix: Server is the single source of truth

Server owns: timers, phase transitions, tally, scoring, win conditions. Clients render only what `/sync` returns. Polling stays (1.5s) — no WebSocket this pass.

### Server — `engine.ts`

1. Add to `Round` (or `MatchState`): `phaseStartedAt: number` (ms epoch) per phase change.

2. Timer durations (constants):
   - assignment → 5s
   - discussion → `getDiscussionTimer(playerCount)` (45/60/75)
   - vote → 20s OR all votes submitted (whichever first)
   - reveal → 6s
   - scoreboard → 10s (auto next round) unless match over → `match_end`

3. `advanceTimedPhases(state)` — lazy poll-driven transition:
   - Compute elapsed = `now - phaseStartedAt`.
   - assignment expired → `setPhase('discussion')` (reset `phaseStartedAt`).
   - discussion expired → `setPhase('vote')`.
   - vote expired OR `votes.length === players.length` → run **server-side `resolveRound(state)`**:
     - count votes, tiebreak, determine eliminated + round winner
     - update `scores`, `investigatorWins`, `maskWins`, `matchWinner`
     - **store** result: `state.lastReveal[round.id] = RevealResult`
     - `setPhase('reveal')`
   - reveal expired → `setPhase('scoreboard')`.
   - scoreboard expired → if `matchWinner` → `match.status='completed'`, phase `match_end`; else `createNextRound(state)` (phase assignment).

4. `createNextRound` — also reset `lastReveal`, `phaseStartedAt`.

5. `toSyncPayload` extends:
   - `phase` — server-authoritative (from current round / match status)
   - `timeRemaining` — seconds left in current phase (from `phaseStartedAt`)
   - `reveal` — `lastReveal[currentRound.id] ?? null` (full results incl. scores, votes, eliminated, winner)
   - `match`, `players`, `currentRound`, `scores`, `wins`, `matchWinner`, `votesSubmitted/required`, `myRole` (existing)
   - **Remove** `votesSubmitted`/`votesRequired` client-triggered auto-reveal logic (server owns it now) — keep counts for UI "Waiting for 2 more votes…" display only.

6. All POST handlers (`vote`, `tally`, `next-round`) call `advanceTimedPhases(state)` first so an idle match still progresses, and re-set `phaseStartedAt` when appropriate (e.g., vote submitted doesn't reset; `next-round` sets it).

### Client — `gameStore.ts`

1. `sync()` merges **everything**: add `match: s.match`, `phase: s.phase`, `timeRemaining: s.timeRemaining`, `reveal: s.reveal`.
   - If `currentRound` id changed → reset `votes=null`, `myRole=s.myRole`.
   - If `s.phase !== state.phase` → update phase (server wins over local).
   - If phase changes to `match_end` → keep scores/wins, phase `match_end`.

2. Remove client-driven transitions:
   - `tallyVotes()` replaced by server flow — keep a `revealNow()` that POSTs `/matches/:id/tally` (host fallback) but the response is ignored; sync provides results.
   - `submitVote` — keep POST + set local `hasVoted=true` flag (new state) for "Waiting…" UI; do **not** set `phase='waiting'` from server's perspective — vote phase renders from server `phase` + local `hasVoted`.
   - `nextRound` — keep POST (host or anyone) — server transitions.

### Client — components (render server state, no local transitions)

1. `GamePage.tsx`:
   - Remove auto phase-transition effect + `votedRef` tally trigger.
   - Render purely from store `phase` (`lobby/assignment/discussion/vote/reveal/scoreboard/match_end`).
   - Keep polling (1.5s) + rejoin logic.
   - `match_end` → render a MatchEnd view (winner + scores + "Play Again" → `resetGame()` + navigate `/`).

2. `RoleCard.tsx` — remove local 5s auto-transition; rely on server `phase`; keep flip animation; sync's `timeRemaining` not needed here.

3. `DiscussionPhase.tsx` —
    - Remove local countdown `setInterval` that calls `setPhase('vote')`.
    - Use `timeRemaining` from store; tick locally with `useEffect` on `timeRemaining` to animate, but **never** transition.
    - Messages stay local (prototype).

4. `VotePhase.tsx` — render from server phase; if `hasVoted` show "Waiting for N more votes…" using `votesRequired - votesSubmitted`; submit → `submitVote(target)`.

5. `RevealPhase.tsx` — remove `tallyVotes()` on mount + `tallyingRef`. Render from `store.reveal` (votes, eliminated, winner, scores). "Continue" → POST `next-round` (or a `scoreboard-ack`? keep simple: POST next-round) — server decides.

6. `Scoreboard.tsx` — render `scores`, `investigatorWins`, `maskWins`, `matchWinner` from sync. "Next Round" → POST next-round. Auto-advance handled server-side.

## Files touched

- `server/src/game/engine.ts` (phaseStartedAt, advanceTimedPhases, resolveRound, lastReveal, toSyncPayload)
- `server/src/routes/match.ts` (call advanceTimedPhases; sync returns phase/timeRemaining/reveal)
- `client/src/store/gameStore.ts` (merge match/phase/timeRemaining/reveal; hasVoted; remove client transitions)
- `client/src/pages/GamePage.tsx` (render-only, match_end)
- `client/src/components/RoleCard.tsx`, `DiscussionPhase.tsx`, `VotePhase.tsx`, `RevealPhase.tsx`, `Scoreboard.tsx`

## Success criteria

- [ ] All clients leave lobby together when host starts (within 1.5s poll)
- [ ] Discussion/vote/reveal/scoreboard phases advance in lockstep for every client
- [ ] Tally + scores come from server — identical on all screens
- [ ] Refresh mid-game re-attaches and shows current server phase
- [ ] Vote content stays hidden until server reveal
- [ ] `npm run build` passes; works via `thrown.mughil.fyi` with multiple browsers
