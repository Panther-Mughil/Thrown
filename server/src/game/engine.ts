import type { Match, Round, Role, Vote, RevealResult } from "@shared/types";

// In-memory storage for prototype
const matches = new Map<string, MatchState>();

// Phase durations (seconds)
const PHASE_DURATIONS = {
  assignment: 5,
  vote: 20,

  reveal: 6,
  scoreboard: 10,
};

export interface MatchState {
  match: Match;
  players: { id: string; username: string; isHost: boolean }[];
  currentRound: Round | null;
  rounds: Round[];
  roles: Map<string, Role[]>; // roundId -> roles
  votes: Map<string, Vote[]>; // roundId -> votes
  scores: Map<string, number>;
  wins: Map<string, number>;
  investigatorWins: number;
  maskWins: number;
  matchWinner: "investigators" | "masks" | null;
  phaseStartedAt: number; // ms epoch when the current phase began
  lastReveal: Map<string, RevealResult>; // roundId -> reveal result (only after resolve)
}

export function createMatch(
  hostId: string,
  hostUsername: string,
  maxPlayers: number,
  bestOf: 5 | 10,
): MatchState {
  const roomCode = generateRoomCode();
  const match: Match = {
    id: crypto.randomUUID(),
    hostId,
    roomCode,
    edition: "core",
    maxPlayers,
    bestOf,
    status: "lobby",
    createdAt: new Date().toISOString(),
  };

  const state: MatchState = {
    match,
    players: [{ id: hostId, username: hostUsername, isHost: true }],
    currentRound: null,
    rounds: [],
    roles: new Map(),
    votes: new Map(),
    scores: new Map(),
    wins: new Map(),
    investigatorWins: 0,
    maskWins: 0,
    matchWinner: null,
    phaseStartedAt: Date.now(),
    lastReveal: new Map(),
  };

  matches.set(match.id, state);
  return state;
}

export function joinMatch(matchId: string, playerId: string, username: string): MatchState | null {
  const state = matches.get(matchId);
  if (!state) return null;
  if (state.players.length >= state.match.maxPlayers) return null;
  if (state.match.status !== "lobby") return null;

  state.players.push({ id: playerId, username, isHost: false });
  return state;
}

export function startMatch(matchId: string, hostId: string): MatchState | null {
  const state = matches.get(matchId);
  if (!state) return null;
  if (state.match.hostId !== hostId) return null;
  if (state.players.length < 3) return null;

  state.match.status = "in_progress";
  state.currentRound = createRound(state, 1);
  state.phaseStartedAt = Date.now();
  return state;
}

function createRound(state: MatchState, roundNumber: number): Round {
  const round: Round = {
    id: crypto.randomUUID(),
    matchId: state.match.id,
    roundNumber,
    status: "assignment",
    discussionTimer: getDiscussionTimer(state.players.length),
    createdAt: new Date().toISOString(),
  };

  // Assign roles
  const roles = assignRoles(state.players);
  // Set roundId for all roles
  for (const r of roles) {
    r.roundId = round.id;
  }
  state.roles.set(round.id, roles);
  state.rounds.push(round);

  return round;
}

function assignRoles(players: { id: string; username: string }[]): Role[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const roles: Role[] = [];

  // 1 Mask (The Artist) for 3-5 players
  roles.push({
    id: crypto.randomUUID(),
    roundId: "",
    userId: shuffled[0].id,
    roleType: "mask",
    characterName: "the_artist",
    hasStrongClue: false,
    hasWeakClue: false,
    abilityUsed: false,
  });

  // Rest are Investigators
  for (let i = 1; i < shuffled.length; i++) {
    roles.push({
      id: crypto.randomUUID(),
      roundId: "",
      userId: shuffled[i].id,
      roleType: "investigator",
      characterName: "volta_agent",
      hasStrongClue: Math.random() > 0.5,
      hasWeakClue: Math.random() > 0.5,
      abilityUsed: false,
    });
  }

  return roles;
}

export function submitVote(
  matchId: string,
  roundId: string,
  voterId: string,
  targetId: string,
): boolean {
  const state = matches.get(matchId);
  if (!state) return false;

  // Do not allow voting outside the vote phase (server-authoritative)
  if (state.currentRound?.status !== "vote") return false;

  const votes = state.votes.get(roundId) || [];
  if (votes.some((v) => v.voterId === voterId)) return false;

  votes.push({
    id: crypto.randomUUID(),
    roundId,
    voterId,
    targetId,
    isValid: true,
  });

  state.votes.set(roundId, votes);
  return true;
}

/**
 * Server-authoritative phase transition. Updates the current round's status
 * and resets the phase clock.
 */
function setPhase(state: MatchState, phase: Round["status"]): void {
  if (state.currentRound) {
    state.currentRound.status = phase;
  }
  state.phaseStartedAt = Date.now();
}

function getPhaseDuration(state: MatchState): number {
  if (!state.currentRound) return 0;
  switch (state.currentRound.status) {
    case "assignment":
      return PHASE_DURATIONS.assignment;
    case "discussion":
      return state.currentRound.discussionTimer;
    case "vote":
      return PHASE_DURATIONS.vote;
    case "reveal":
      return PHASE_DURATIONS.reveal;
    case "scoreboard":
      return PHASE_DURATIONS.scoreboard;
    default:
      return 0;
  }
}

/**
 * Server-side tally. Counts votes, applies tiebreak, updates scores/wins,
 * stores the reveal result, and moves to the reveal phase.
 */
function resolveRound(state: MatchState): void {
  const round = state.currentRound;
  if (!round) return;

  const votes = state.votes.get(round.id) || [];
  const roles = state.roles.get(round.id) || [];

  // Count votes
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) || 0) + 1);
  }

  // Find max votes
  let maxVotes = 0;
  let eliminated: string | null = null;
  let tiebreak = false;

  for (const [playerId, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = playerId;
      tiebreak = false;
    } else if (count === maxVotes) {
      tiebreak = true;
    }
  }

  // Tiebreak: random among tied
  if (tiebreak && eliminated) {
    const tied = Array.from(voteCounts.entries()).flatMap(([playerId, count]) =>
      count === maxVotes ? [playerId] : [],
    );
    eliminated = tied[Math.floor(Math.random() * tied.length)];
    tiebreak = tied.length > 1;
  }

  // Get eliminated player's role
  const eliminatedRole = roles.find((r) => r.userId === eliminated);

  let roundWinner: "investigators" | "masks" | null = null;

  // Update scores + round wins
  if (eliminatedRole) {
    if (eliminatedRole.roleType === "mask") {
      // Investigators win the round
      roundWinner = "investigators";
      state.investigatorWins += 1;
      for (const role of roles) {
        if (role.roleType === "investigator") {
          state.scores.set(role.userId, (state.scores.get(role.userId) || 0) + 150);
        }
      }
    } else {
      // Mask survives → Masks win the round
      roundWinner = "masks";
      state.maskWins += 1;
      const maskRole = roles.find((r) => r.roleType === "mask");
      if (maskRole) {
        state.scores.set(maskRole.userId, (state.scores.get(maskRole.userId) || 0) + 200);
      }
    }
  }

  // Match win check: first side to reach majority wins.
  // NOTE: do NOT mark the match "completed" yet — the reveal and scoreboard
  // phases still need to run. Completion is applied when the scoreboard expires.
  const winThreshold = Math.ceil(state.match.bestOf / 2);
  if (state.investigatorWins >= winThreshold) {
    state.matchWinner = "investigators";
  } else if (state.maskWins >= winThreshold) {
    state.matchWinner = "masks";
  }

  const reveal: RevealResult = {
    votes: votes.map((v) => ({ voterId: v.voterId, targetId: v.targetId, weight: 1 })),
    eliminated:
      eliminated && eliminatedRole ? { userId: eliminated, role: eliminatedRole } : undefined,
    tiebreak,
    tiebreakWinner: tiebreak ? eliminated || undefined : undefined,
    roundWinner: roundWinner ?? undefined,
    matchWinner: state.matchWinner ?? undefined,
    investigatorWins: state.investigatorWins,
    maskWins: state.maskWins,
  };

  state.lastReveal.set(round.id, reveal);
  setPhase(state, "reveal");
}

/**
 * Lazy poll-driven phase progression. Called on every sync/action so the
 * server is always the authority for what phase everyone is in.
 */
export function advanceTimedPhases(state: MatchState): void {
  if (!state.currentRound) return;

  const elapsed = (Date.now() - state.phaseStartedAt) / 1000;
  const phase = state.currentRound.status;
  const votesIn = state.currentRound ? (state.votes.get(state.currentRound.id)?.length ?? 0) : 0;

  if (phase === "assignment" && elapsed >= PHASE_DURATIONS.assignment) {
    setPhase(state, "discussion");
  } else if (phase === "discussion" && elapsed >= state.currentRound.discussionTimer) {
    setPhase(state, "vote");
  } else if (
    phase === "vote" &&
    (elapsed >= PHASE_DURATIONS.vote || votesIn >= state.players.length)
  ) {
    resolveRound(state);
  } else if (phase === "reveal" && elapsed >= PHASE_DURATIONS.reveal) {
    setPhase(state, "scoreboard");
  } else if (phase === "scoreboard" && elapsed >= PHASE_DURATIONS.scoreboard) {
    if (state.matchWinner) {
      state.match.status = "completed";
      // Keep currentRound.status at "scoreboard"; clients map completed → match_end.
    } else {
      createNextRound(state.match.id);
    }
  }
}

export function getMatchState(matchId: string): MatchState | null {
  return matches.get(matchId) || null;
}

/**
 * Sanitized sync payload for a single client.
 * Exposes counts/aggregates only — never other players' roles or vote contents
 * until the reveal phase (where results are public).
 */
export function toSyncPayload(state: MatchState, userId: string) {
  advanceTimedPhases(state);

  let phase: string;
  if (state.currentRound) {
    phase = state.currentRound.status;
  } else if (state.match.status === "completed") {
    phase = "match_end";
  } else {
    phase = "lobby";
  }

  const duration = getPhaseDuration(state);
  const elapsed = (Date.now() - state.phaseStartedAt) / 1000;
  const timeRemaining = duration > 0 ? Math.max(0, Math.ceil(duration - elapsed)) : 0;

  const roundId = state.currentRound?.id;
  const roundRoles = roundId ? (state.roles.get(roundId) ?? []) : [];
  const roundVotes = roundId ? (state.votes.get(roundId) ?? []) : [];

  return {
    match: state.match,
    players: state.players,
    currentRound: state.currentRound
      ? {
          id: state.currentRound.id,
          roundNumber: state.currentRound.roundNumber,
          discussionTimer: state.currentRound.discussionTimer,
          status: state.currentRound.status,
        }
      : null,
    scores: Object.fromEntries(state.scores),
    investigatorWins: state.investigatorWins,
    maskWins: state.maskWins,
    matchWinner: state.matchWinner,
    phase,
    timeRemaining,
    votesSubmitted: roundVotes.length,
    votesRequired: state.players.length,
    hasVoted: roundVotes.some((v) => v.voterId === userId),
    myRole: roundRoles.find((r) => r.userId === userId) ?? null,
    reveal: roundId ? (state.lastReveal.get(roundId) ?? null) : null,
  };
}

export function getMatchByRoomCode(roomCode: string): MatchState | null {
  for (const state of matches.values()) {
    if (state.match.roomCode === roomCode) return state;
  }
  return null;
}

export function createNextRound(matchId: string): MatchState | null {
  const state = matches.get(matchId);
  if (!state) return null;
  if (state.matchWinner) return null;

  const nextRoundNumber = state.rounds.length + 1;
  state.currentRound = createRound(state, nextRoundNumber);
  state.phaseStartedAt = Date.now();
  return state;
}

/**
 * Manual force-reveal fallback (host). Resolves the round immediately and
 * returns the stored result. Used when a client wants to skip the remaining
 * vote timer.
 */
export function tallyVotes(matchId: string, roundId: string): RevealResult | null {
  const state = matches.get(matchId);
  if (!state) return null;
  if (state.currentRound?.id !== roundId) return null;

  // Only allow forcing if we're still in vote phase (results not yet computed)
  if (state.currentRound.status === "vote") {
    resolveRound(state);
  }

  return state.lastReveal.get(roundId) ?? null;
}

// Helper functions
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SDT-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDiscussionTimer(playerCount: number): number {
  if (playerCount <= 4) return 45;
  if (playerCount <= 6) return 60;
  return 75;
}
