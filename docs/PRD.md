**THROWN**

Product Requirements Document — v2.0 (Deduction Rework)

_Super Duper Techno (SDT) — Confidential — Internal Use Only_

# 1\. Product Overview

THROWN is a competitive, real-time, voting-based social deduction game set in the Volta Chronicles universe, developed and published by Super Duper Techno (SDT). Players are secretly assigned roles each round — most are Investigators, one or two are hidden Masks — and must use discussion, clue tokens, and majority voting to identify and eliminate the Mask(s) before a fixed round limit runs out.

This document supersedes the original v1.0 PRD's core gameplay loop (Rock Paper Scissors \+ dare/challenge system). Account, auth, friends, chat, leaderboard, notification, and technical infrastructure sections carry over from v1.0 with adaptations noted in each section.

| Property        | Detail                                                    |
| :-------------- | :-------------------------------------------------------- |
| Product Name    | THROWN                                                    |
| Studio          | Super Duper Techno (SDT)                                  |
| Platform        | Web (PWA) — Phase 1                                       |
| Target Audience | 12+                                                       |
| Player Count    | 3–8 per match (hard minimum of 3\)                        |
| Monetization    | Ad revenue \+ cosmetic-only SD$ economy — zero pay-to-win |
| Tech Stack      | React.js, Node.js, Socket.io, Supabase, Cloudinary        |
| Hosting         | Vercel (frontend) \+ Railway (backend)                    |
| Project Lead    | Mughil Sankar N                                           |
| Version         | 2.0 — Deduction Rework                                    |

# 2\. Character & Role Assignments

Every role in a match is skinned as a Volta Chronicles character. Role assignment is always random and server-authoritative — never purchasable, never chosen by the player. This preserves the zero pay-to-win rule established for THROWN's economy.

## 2.1 The Mask Roles (hidden, win by surviving the vote)

| Character          | Role         | Player Count         | Ability                                                                                                                           |
| :----------------- | :----------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| The Artist         | Primary Mask | 3–8 (always present) | Receives a decoy clue token that reads identically to a normal Investigator clue, so clue possession alone never confirms a role. |
| Victor (Puppeteer) | Second Mask  | 6–8 only             | Once per match, may secretly redirect one vote after seeing the live tally trend — a subtle nudge, not a guaranteed save.         |

## 2.2 Special Investigator Roles (randomly assigned, capped per match)

1 special Investigator role is assigned at 3–5 players; 2 are assigned at 6–8 players. Remaining seats are filled by the standard Volta Agent (no ability).

| Character            | Role Name         | Ability                                                                                                  |
| :------------------- | :---------------- | :------------------------------------------------------------------------------------------------------- |
| Nova Reyes           | Lead Investigator | Once per match, may privately check whether one other player's clue is Strong or Weak (not its content). |
| Mikaela (Mileb)      | Protector         | Once per match, may grant one player immunity from that round's elimination vote.                        |
| Kate (Madam Volta)   | Mediator          | Once per match, may extend the Discussion Phase timer by \+20 seconds.                                   |
| Tamara (Golden Star) | Anchor            | Once per match, her vote counts as 2 votes toward the elimination tally.                                 |
| D.M.W.               | Unshakeable       | Cannot be selected as the elimination target during Round 1 of the match.                                |
| Boss                 | Auditor           | Sees the numeric vote-count breakdown (not who voted for whom) moments before reveal.                    |
| Vanilla              | Lucky Charm       | If voted out and revealed as an Investigator, all remaining Investigators receive a small bonus.         |

## 2.3 Standard Role

Volta Agent — the default Investigator skin with no special ability. Fills all remaining seats not assigned to a Mask or special role. Every match therefore has at least one standard Volta Agent regardless of lobby size.

# 3\. Entry Gate & Age Verification

Carried over from v1.0 unchanged.

- User lands on site → Age gate ('Are you 18 or older?') → No: blocked page, no further access → Yes: Rules & Regulations page (full scroll required) → Accept → Auth page

- Key rules: no real names/phone numbers in usernames or chat, wordlist-filtered conduct, report system, SDT reserves right to ban

# 4\. Authentication & Account System

Carried over from v1.0 unchanged, since account/profile needs are identical regardless of core game loop.

| Mode    | Features                                                      | Limitations                                                        |
| :------ | :------------------------------------------------------------ | :----------------------------------------------------------------- |
| Guest   | Temp username, random matchmaking, room code join             | No stats saved, no friends, no leaderboard placement, session only |
| Account | Full profile, stats, friends, leaderboard, SD$, DP collection | Requires signup (Google / Apple / Email+Password or OTP)           |

- Username: letters only as first character, max 16 chars, underscore only special char

- Public profile: username, equipped DP, bio, stats (matches won, correct-vote rate, times caught as Mask), Loser Tag if active, DP collection; SD$ balance stays private

- Multi-device: allowed, but active gameplay locks to one device

- Account deletion: must sell/scrap all DPs first; in-progress matches auto-forfeit with Loser Tag applied if applicable

# 5\. Match & Round System

## 5.1 Finding a Match

| Method             | How It Works                                                                                             |
| :----------------- | :------------------------------------------------------------------------------------------------------- |
| Random Matchmaking | Click Find Match — random pairing into a 3–8 player lobby, cancel anytime before match starts            |
| Create Room        | Host generates SDT-XXXX room code; host sets player cap (3–8) and match length (Best of 5 / Best of 10\) |
| Join Room          | Enter room code — anyone with the code can join up to the host's player cap                              |

## 5.2 Pre-Match Screen

All players see each lobby member's profile (username, DP, active Loser Tag, basic stats) before confirming. Any player can back out with no penalty. All must confirm to proceed.

## 5.3 Edition Vote

| Scenario                          | Outcome                                       |
| :-------------------------------- | :-------------------------------------------- |
| All players vote the same edition | That edition is played                        |
| Players split votes               | Random pick weighted among the voted editions |
| Nobody votes                      | Host's default edition (Core) is played       |

## 5.4 Round Structure (repeats each round until match ends)

| Phase                    | Duration                             | What Happens                                                                                                         |
| :----------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| 1\. Assignment           | 5 sec                                | Server secretly assigns roles \+ clue tokens. Never sent to other clients.                                           |
| 2\. Discussion           | 45–75 sec (scales with player count) | Players talk, share/withhold clues, bluff. Mediator may extend \+20s.                                                |
| 3\. Vote                 | 20 sec                               | All players vote simultaneously; hidden until timer ends, then revealed together.                                    |
| 4\. Tie Resolution       | Instant                              | Ties broken by random server-side tiebreak among tied players.                                                       |
| 5\. Reveal & Elimination | Instant                              | Voted-out player's role revealed. Mask eliminated, or Investigator removed from voting (clue history stays visible). |
| 6\. Scoreboard           | Between rounds                       | Scores update; ad slot may trigger here (Section 8). Next round begins automatically.                                |

## 5.5 Discussion Timer Scaling

| Player Count | Discussion Timer |
| :----------- | :--------------- |
| 3–4          | 45 sec           |
| 5–6          | 60 sec           |
| 7–8          | 75 sec           |

## 5.6 Match Length & Win Conditions

- Match length fixed at lobby creation: Best of 5 or Best of 10 rounds

- Investigators win if all Mask(s) are voted out within the round limit

- Mask(s) win if the round limit is reached while at least one Mask survives

- At 6–8 players, catching only one of two Masks is not a win — both must be caught

- Final scoreboard shown at match end with instant rematch (same lobby, roles reshuffled)

# 6\. Scoring & SD$ Economy

SD$ is earned entirely through gameplay and voluntary ad views — never purchased with real money. No mechanic below affects who wins a round; all purchasing/earning is cosmetic or convenience only.

## 6.1 Round & Match Scoring

| Outcome                                             | SD$                                   |
| :-------------------------------------------------- | :------------------------------------ |
| Investigator correctly votes for an eliminated Mask | \+150                                 |
| Investigator votes incorrectly                      | \+0                                   |
| Mask survives a round without being voted out       | \+200                                 |
| Mask is caught                                      | \+0                                   |
| Winning side match bonus                            | \+500 split evenly among winning side |

## 6.2 Additional Earning

| Action                              | SD$ Earned                       |
| :---------------------------------- | :------------------------------- |
| Scrapping a duplicate DP            | Random 100–2,000                 |
| Selling a DP to a friend or auction | Seller-set price (above floor)   |
| Voluntary Ad Box spin               | Indirect — cosmetic DP or reward |

## 6.3 Spending SD$ (cosmetic / convenience only)

| Item                         | Cost         |
| :--------------------------- | :----------- |
| Common Lootbox (cosmetic DP) | 1,000 SD$    |
| Good Lootbox                 | 5,000 SD$    |
| Legendary Lootbox            | 10,000 SD$   |
| Mythical Lootbox             | 50,000 SD$   |
| Remove Loser Tag             | 100 SD$      |
| Theme Shop items             | Variable SD$ |

# 7\. Editions

| Edition    | Player Range | Masks                             | Feel                                              |
| :--------- | :----------- | :-------------------------------- | :------------------------------------------------ |
| Core       | 3–5          | 1                                 | Fast, easy to learn, classic deduction            |
| Extended   | 6–8          | 2                                 | Higher variance, harder Investigator coordination |
| Chaos Mode | 6–8          | 2 \+ rotating modifier each match | Highest variance — for experienced groups         |

Chaos Mode modifiers are an open design track — see Section 12 (Open Questions).

# 8\. Ad System & Monetization Rules

Hard constraint: ads and purchases never touch round outcomes, vote power, clue strength, or Mask/Investigator odds. Every player has identical mechanical power regardless of spend.

| Method                  | Trigger                         | Details                                                                                       |
| :---------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------- |
| Scoreboard Interstitial | Between rounds                  | Shown only at the Scoreboard screen — never during Discussion, Vote, or Reveal                |
| Match-End Interstitial  | After match ends                | Shown on the results screen before rematch/exit                                               |
| Ad Box (voluntary)      | Player chooses to watch anytime | Reward: 1 free cosmetic lootbox spin (85% Common / 12% Good / 2.5% Legendary / 0.5% Mythical) |

Explicitly not permitted: purchasable extra clues, vote immunity, re-rolls, or any mechanic that changes who wins a round.

# 9\. DP Marketplace & Auction House

Carried over from v1.0, cosmetic-only (DPs are profile avatars, purely visual).

- Friends Trade: direct trade at seller-set price, above SDT floor price

- Public Auction House: 24-hour timer, escrowed bids, friends limited to 1 bid each, 5-minute snipe warning with no extension

- Floor Price System: every DP has an SDT-defined floor price to prevent scalping/deflation

# 10\. Friends, Chat, Leaderboard, Notifications, Theme System

Carried over from v1.0 with terminology adapted to the deduction format.

## 10.1 Friends

- Unique Friend Code per account, mutual-accept requests, online/offline status, direct challenge if online, no friend limit

## 10.2 Chat

| Context                               | Mode                                                 |
| :------------------------------------ | :--------------------------------------------------- |
| Discussion Phase — randoms            | Preset messages only                                 |
| Discussion Phase — friends-only lobby | Free text, wordlist filtered                         |
| Post-match                            | Free text, wordlist filtered                         |
| Friends chat (outside match)          | Free text, wordlist filtered, number-pattern blocked |

## 10.3 Leaderboard

| Board                 | Ranks By                       |
| :-------------------- | :----------------------------- |
| SD$ Rich              | Highest SD$ balance            |
| Investigator Accuracy | Highest correct-vote rate      |
| Mask Survivor         | Most rounds survived as a Mask |
| DP Rarity             | Rarest avatar owned            |

Real-time updates, no seasonal reset, Global \+ Friends tabs, guests can view but not place.

## 10.4 Notifications

In-app only, individually toggleable: friend online, challenge/match found, vote phase starting, round result, Loser Tag placed, friend requests, trades, marketplace activity (bid/outbid/snipe warning/auction end).

##

## 10.5 Theme System

Balatro-inspired visual identity carries over unchanged: deep dark backgrounds, neon accents, card-flip reveals. Role cards, vote UI, and reveal animations all skin to the active theme. Default theme free; additional themes purchasable with SD$.

# 11\. Technical Stack

| Layer            | Technology                      | Purpose                                                                     |
| :--------------- | :------------------------------ | :-------------------------------------------------------------------------- |
| Frontend         | React.js \+ Framer Motion       | UI, animations, PWA                                                         |
| Backend          | Node.js \+ Express              | API, match orchestration, role/vote logic                                   |
| Real-Time        | Socket.io                       | Discussion timer, hidden vote sync, simultaneous reveal, tiebreak broadcast |
| Database         | Supabase (PostgreSQL)           | Accounts, stats, SD$, friends, match/round/vote history                     |
| Cache / Sessions | Redis (via Supabase or Railway) | Live sessions, matchmaking queue, active rooms                              |
| Auth             | Supabase Auth                   | Google \+ Apple \+ Email sign-in                                            |
| Media            | Cloudinary                      | Cosmetic asset delivery, DP images                                          |
| Frontend Hosting | Vercel                          | Free tier to start                                                          |
| Backend Hosting  | Railway                         | Free tier to start                                                          |

# 12\. Open Questions

- Chaos Mode modifier list — needs a dedicated brainstorm before scoping

- Voice chat built-in for Discussion Phase, or assume external call/in-person?

- Can eliminated Investigators spectate later rounds, or fully exit the session?

- Does the Oct 2 test-build deadline target Core edition only, or Core \+ Extended?

# 13\. Team Structure & Work Breakdown

Mughil is Project Lead for THROWN, owning overall architecture, the core role/vote/clue game logic, sprint coordination, and final QA sign-off before each milestone. Work below is split by system so each person can build and test their area independently.

## 13.1 Mughil — Project Lead \+ Core Game Logic

- Own the overall THROWN architecture and integration between all systems below

- Build the core round-state machine: Assignment → Discussion → Vote → Tiebreak → Reveal → Scoreboard

- Implement role/clue assignment algorithm (server-authoritative randomization, special-role capping per player count)

- Implement scoring logic (Section 6.1) and win-condition checks (Section 5.6)

- Run sprint check-ins with Niranjan, Akthas, and Madur; sign off on each milestone before merge

- Own final PRD updates and QA pass before the Oct 2 test-build deadline

## 13.2 Niranjan — Real-Time Layer & Database

- Socket.io events: discussion timer sync, hidden vote submission, simultaneous reveal broadcast, tiebreak resolution broadcast

- Supabase schema: matches, rounds, votes, roles-per-round, clue tokens, scores

- Ensure votes stay hidden server-side until reveal (no client can see others' votes early)

- Reconnect/disconnect handling mid-round (player drops during Discussion or Vote phase)

## 13.3 Akthas — Backend Match Orchestration & Economy

- Lobby creation/join flow, room codes, matchmaking queue, player-cap enforcement (3–8)

- Anti-cheat safeguards: role/clue data never transmitted to non-owning clients

- SD$ economy backend: scoring payouts, lootbox pull-rate logic, Ad Box reward validation

- Marketplace backend: auction escrow, floor price enforcement, snipe-window logic

## 13.4 Madur — Frontend & UI

- Role card UI (Mask/Investigator/special roles) and clue token display

- Discussion Phase UI (scaled timer, chat, Mediator extend action)

- Voting UI (hidden selection, simultaneous reveal animation, tiebreak result display)

- Scoreboard and match-end results screens

- Cosmetic shop UI (lootboxes, theme shop, Ad Box) and theme system rendering

## 13.5 Cross-Team Dependencies

| Dependency                        | Blocks                                                                     |
| :-------------------------------- | :------------------------------------------------------------------------- |
| Mughil's role/vote state machine  | Niranjan's Socket.io events need the state machine's event contracts first |
| Niranjan's Supabase schema        | Akthas's economy backend needs match/round tables to log payouts against   |
| Akthas's anti-cheat role delivery | Madur's role card UI can't render real data until this is in place         |
