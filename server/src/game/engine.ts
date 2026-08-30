import type { Match, Round, Role, Vote, RevealResult } from "@shared/types";

// In-memory storage for prototype
const matches = new Map<string, MatchState>();

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
  roles.forEach((r) => (r.roundId = round.id));
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

export function tallyVotes(matchId: string, roundId: string): RevealResult | null {
  const state = matches.get(matchId);
  if (!state) return null;

  const votes = state.votes.get(roundId) || [];
  const roles = state.roles.get(roundId) || [];

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

  // Match win check: first side to reach majority wins
  const winThreshold = Math.ceil(state.match.bestOf / 2);
  if (state.investigatorWins >= winThreshold) {
    state.matchWinner = "investigators";
  } else if (state.maskWins >= winThreshold) {
    state.matchWinner = "masks";
  }

  return {
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
}

export function getMatchState(matchId: string): MatchState | null {
  return matches.get(matchId) || null;
}

/**
 * Sanitized sync payload for a single client.
 * Exposes counts/aggregates only — never other players' roles or vote contents.
 */
export function toSyncPayload(state: MatchState, userId: string) {
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
    votesSubmitted: state.currentRound ? (state.votes.get(state.currentRound.id)?.length ?? 0) : 0,
    votesRequired: state.players.length,
    myRole:
      (state.currentRound ? (state.roles.get(state.currentRound.id) ?? []) : []).find(
        (r) => r.userId === userId,
      ) ?? null,
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
  return state;
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
