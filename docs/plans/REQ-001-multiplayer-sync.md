# THROWN — Multi-Player Sync Fix Plan

**Date:** 2025-08-30
**Status:** Approved for immediate implementation (urgent)

---

## Problem

1. **Host screen doesn't update when a player joins.**
   - Clients only fetch server state on explicit actions. No polling/sync loop exists in `GamePage.tsx`.
   - Each browser has its own stale Zustand store.

2. **Refreshing the page breaks the app.**
   - All identity (matchId, playerId, role) lives in browser memory only.
   - Player IDs generated with `Date.now()` change on refresh → identity mismatch.

## Fix Design (polling + persistence — no WebSocket in this pass)

### Server changes

1. **New endpoint: `GET /api/matches/:id/sync?userId=X`**
   - Returns sanitized match state for polling clients:
     - match (status, roomCode)
     - players list
     - currentRound (id, roundNumber, discussionTimer — NOT roles)
     - scores, investigatorWins, maskWins, matchWinner
     - `votesSubmitted` + `votesRequired` (counts only — vote content stays hidden)
     - `myRole` for the current round (only the requesting user's role + clue)
   - Keeps votes and other players' roles hidden (anti-cheat).

2. **Helper: `toSyncPayload(state, userId)` in engine or route.**

### Client changes

1. **Persist identity in `localStorage`** (key `thrown_identity`):
   - `{ playerId, playerName, matchId, roomCode }`
   - Saved on create/join; cleared on reset/end.

2. **Player ID generation**: switch from `Date.now()` to `crypto.randomUUID()`.

3. **Add polling to `GamePage.tsx`** (every 1500ms):
   - Calls `GET /api/matches/:id/sync?userId=playerId`
   - Updates: players, scores, wins, matchWinner
   - Phase transitions derived from server state:
     - lobby + match in_progress → phase = "assignment"; recover myRole from sync payload
     - waiting + votesSubmitted >= votesRequired + votes == null → auto-reveal (call tallyVotes)
     - reveal + matchWinner set → show match-end state on scoreboard
   - Keep local role/messages; never import other players' roles.

4. **HomePage**: on mount, if an identity exists in localStorage → show "Rejoin: `<roomCode>`" button → navigates to `/game` and re-attaches via sync.

5. **GamePage on mount with no identity** → redirect to `/`.

## Files touched

- `server/src/game/engine.ts` (+ helper `toSyncPayload`)
- `server/src/routes/match.ts` (+ `/sync` route, keep others hidden)
- `client/src/store/gameStore.ts` (persistence, sync action, UUID ids)
- `client/src/pages/GamePage.tsx` (polling loop + phase derivation)
- `client/src/pages/HomePage.tsx` (rejoin button)

## Success criteria

- [ ] Host sees new players appear in lobby within ~1.5s
- [ ] Joining player sees the same lobby + host's start
- [ ] All clients transition to assignment/discussion/vote together
- [ ] Refreshing mid-lobby or mid-round re-attaches and shows current state
- [ ] Vote content stays hidden until reveal (only counts visible)
- [ ] `npm run build` passes; app runs via `thrown.mughil.fyi`
