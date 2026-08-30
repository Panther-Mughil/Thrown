import { create } from "zustand";
// Types imported from shared package
type GameEdition = "core" | "extended" | "chaos";
type GamePhase =
  | "idle"
  | "assignment"
  | "discussion"
  | "vote"
  | "tiebreak"
  | "reveal"
  | "scoreboard"
  | "match_end";
type MatchStatus = "lobby" | "starting" | "in_progress" | "completed";
type RoleType = "mask" | "special_investigator" | "investigator";
type CharacterName =
  | "the_artist"
  | "victor"
  | "nova_reyes"
  | "mikaela"
  | "kate"
  | "tamara"
  | "dmw"
  | "auditor"
  | "lucky_charm"
  | "volta_agent";

interface Match {
  id: string;
  hostId: string;
  roomCode: string;
  edition: GameEdition;
  maxPlayers: number;
  bestOf: 5 | 10;
  status: MatchStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface Round {
  id: string;
  matchId: string;
  roundNumber: number;
  status: GamePhase;
  discussionTimer: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface Role {
  id: string;
  roundId: string;
  userId: string;
  roleType: RoleType;
  characterName: CharacterName;
  hasStrongClue: boolean;
  hasWeakClue: boolean;
  abilityUsed: boolean;
}

interface VoteResult {
  voterId: string;
  targetId: string;
  weight: number;
}

interface RevealResult {
  votes: VoteResult[];
  eliminated?: { userId: string; role: Role };
  tiebreak: boolean;
  tiebreakWinner?: string;
  roundWinner?: "investigators" | "masks";
  matchWinner?: "investigators" | "masks";
  investigatorWins?: number;
  maskWins?: number;
}

const API = "/api";

// ── Identity persistence (localStorage) ──────────────────
const IDENTITY_KEY = "thrown_identity";

interface StoredIdentity {
  playerId: string;
  playerName: string;
  matchId: string;
  roomCode: string;
}

function saveIdentity(id: StoredIdentity) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
  } catch {
    // storage unavailable — non-fatal for prototype
  }
}

function clearIdentityStorage() {
  try {
    localStorage.removeItem(IDENTITY_KEY);
  } catch {
    // ignore
  }
}

export function loadIdentity(): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredIdentity;
    return parsed.playerId && parsed.matchId ? parsed : null;
  } catch {
    return null;
  }
}

interface Player {
  id: string;
  username: string;
  isHost: boolean;
}

interface GameState {
  matchId: string | null;
  roomCode: string | null;
  playerId: string;
  playerName: string;
  players: Player[];
  match: Match | null;
  currentRound: Round | null;
  myRole: Role | null;
  allRoles: Role[];
  phase: string;
  timeRemaining: number;
  votes: RevealResult | null;
  hasVoted: boolean;
  scores: Record<string, number>;
  roundNumber: number;
  bestOf: number;
  matchWinner: "investigators" | "masks" | null;
  investigatorWins: number;
  maskWins: number;
  votesSubmitted: number;
  votesRequired: number;

  // Actions
  setPlayer: (id: string, name: string) => void;
  setPhase: (phase: string) => void;
  setVotes: (votes: RevealResult | null) => void;
  createRoom: (maxPlayers: number, bestOf: 5 | 10) => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitVote: (targetId: string) => Promise<void>;
  tallyVotes: () => Promise<void>;
  nextRound: () => Promise<void>;
  sync: () => Promise<void>;
  rejoinFromStorage: () => StoredIdentity | null;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  matchId: null,
  roomCode: null,
  playerId: "",
  playerName: "",
  players: [],
  match: null,
  currentRound: null,
  myRole: null,
  allRoles: [],
  phase: "idle",
  timeRemaining: 0,
  votes: null,
  hasVoted: false,
  scores: {},
  roundNumber: 1,
  bestOf: 5,
  matchWinner: null,
  investigatorWins: 0,
  maskWins: 0,
  votesSubmitted: 0,
  votesRequired: 0,

  setPlayer: (id, name) => set({ playerId: id, playerName: name }),
  setPhase: (phase) => set({ phase }),
  setVotes: (votes) => set({ votes }),

  rejoinFromStorage: () => loadIdentity(),

  resetGame: () => {
    clearIdentityStorage();
    set({
      matchId: null,
      roomCode: null,
      players: [],
      match: null,
      currentRound: null,
      myRole: null,
      allRoles: [],
      phase: "idle",
      timeRemaining: 0,
      votes: null,
      hasVoted: false,
      scores: {},
      roundNumber: 1,
      matchWinner: null,
      investigatorWins: 0,
      maskWins: 0,
      votesSubmitted: 0,
      votesRequired: 0,
    });
  },

  createRoom: async (maxPlayers, bestOf) => {
    const state = get();
    const res = await fetch(`${API}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: state.playerId,
        hostUsername: state.playerName,
        maxPlayers,
        bestOf,
      }),
    });
    const data = await res.json();
    if (data.success) {
      set({
        matchId: data.data.match.id,
        roomCode: data.data.roomCode,
        match: data.data.match,
        bestOf,
        players: [{ id: state.playerId, username: state.playerName, isHost: true }],
        phase: "lobby",
      });
      saveIdentity({
        playerId: state.playerId,
        playerName: state.playerName,
        matchId: data.data.match.id,
        roomCode: data.data.roomCode,
      });
    }
  },

  joinRoom: async (roomCode) => {
    const state = get();
    const res = await fetch(`${API}/matches/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode,
        playerId: state.playerId,
        username: state.playerName,
      }),
    });
    const data = await res.json();
    if (data.success) {
      set({
        matchId: data.data.match.id,
        roomCode,
        match: data.data.match,
        players: data.data.players.map((p: { id: string; username: string; isHost: boolean }) => ({
          id: p.id,
          username: p.username,
          isHost: p.isHost,
        })),
        phase: "lobby",
      });
      saveIdentity({
        playerId: state.playerId,
        playerName: state.playerName,
        matchId: data.data.match.id,
        roomCode,
      });
    }
  },

  startGame: async () => {
    const state = get();
    const res = await fetch(`${API}/matches/${state.matchId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId: state.playerId }),
    });
    const data = await res.json();
    if (data.success) {
      const roles: Role[] = data.data.roles;
      const myRole = roles.find((r) => r.userId === state.playerId) || null;
      set({
        currentRound: data.data.currentRound,
        allRoles: roles,
        myRole,
        phase: "assignment",
        timeRemaining: 5,
        roundNumber: 1,
        votes: null,
        hasVoted: false,
      });
    }
  },

  submitVote: async (targetId) => {
    const state = get();
    const res = await fetch(`${API}/matches/${state.matchId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roundId: state.currentRound?.id,
        voterId: state.playerId,
        targetId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      // Mark locally that we've voted; the server still owns the phase.
      set({ hasVoted: true });
      // Immediately sync to pick up the server's vote count / possible auto-reveal.
      await get().sync();
    }
  },

  tallyVotes: async () => {
    // Manual force-reveal fallback (host). Results come from sync, not local math.
    const state = get();
    await fetch(`${API}/matches/${state.matchId}/tally`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: state.currentRound?.id }),
    });
    await get().sync();
  },

  nextRound: async () => {
    const state = get();
    const res = await fetch(`${API}/matches/${state.matchId}/next-round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      const roles: Role[] = data.data.roles;
      const myRole = roles.find((r) => r.userId === state.playerId) || null;
      set({
        currentRound: data.data.round,
        allRoles: roles,
        myRole,
        votes: null,
        hasVoted: false,
        phase: "assignment",
        timeRemaining: 5,
        roundNumber: state.roundNumber + 1,
      });
      await get().sync();
    }
  },

  sync: async () => {
    const state = get();
    if (!state.matchId || !state.playerId) return;
    try {
      const res = await fetch(`${API}/matches/${state.matchId}/sync?userId=${state.playerId}`);
      const data = await res.json();
      if (!data.success) return;
      const s = data.data;

      const updates: Partial<GameState> = {
        match: s.match,
        players: s.players,
        scores: s.scores,
        investigatorWins: s.investigatorWins,
        maskWins: s.maskWins,
        matchWinner: s.matchWinner,
        votesSubmitted: s.votesSubmitted,
        votesRequired: s.votesRequired,
        timeRemaining: s.timeRemaining,
        hasVoted: s.hasVoted,
        // Reveal result (null until server resolves the round)
        votes: s.reveal,
      };

      // Server-authoritative phase (server wins over local state)
      updates.phase = s.match.status === "completed" ? "match_end" : s.phase;

      // Round changed (start or next round created server-side)
      if (s.currentRound) {
        if (state.currentRound?.id !== s.currentRound.id) {
          updates.currentRound = s.currentRound;
          updates.roundNumber = s.currentRound.roundNumber;
          updates.votes = null;
          updates.hasVoted = false;
        }
        if (s.myRole && (!state.myRole || state.myRole.id !== s.myRole.id)) {
          updates.myRole = s.myRole;
        }
      } else if (state.currentRound) {
        updates.currentRound = null;
      }

      set(updates);
    } catch {
      // transient network error — next poll retries
    }
  },
}));
