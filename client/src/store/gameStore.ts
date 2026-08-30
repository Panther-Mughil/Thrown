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
  votes: RevealResult | null;
  scores: Record<string, number>;
  roundNumber: number;
  bestOf: number;
  matchWinner: "investigators" | "masks" | null;
  investigatorWins: number;
  maskWins: number;

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
  votes: null,
  scores: {},
  roundNumber: 1,
  bestOf: 5,
  matchWinner: null,
  investigatorWins: 0,
  maskWins: 0,

  setPlayer: (id, name) => set({ playerId: id, playerName: name }),
  setPhase: (phase) => set({ phase }),
  setVotes: (votes) => set({ votes }),

  resetGame: () =>
    set({
      matchId: null,
      roomCode: null,
      players: [],
      match: null,
      currentRound: null,
      myRole: null,
      allRoles: [],
      phase: "idle",
      votes: null,
      scores: {},
      roundNumber: 1,
      matchWinner: null,
      investigatorWins: 0,
      maskWins: 0,
    }),

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
        roundNumber: 1,
      });
    }
  },

  submitVote: async (targetId) => {
    const state = get();
    await fetch(`${API}/matches/${state.matchId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roundId: state.currentRound?.id,
        voterId: state.playerId,
        targetId,
      }),
    });
    set({ phase: "waiting" });
  },

  tallyVotes: async () => {
    const state = get();
    const res = await fetch(`${API}/matches/${state.matchId}/tally`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: state.currentRound?.id }),
    });
    const data = await res.json();
    if (data.success) {
      // Update scores
      const newScores = { ...state.scores };
      if (data.data.eliminated) {
        if (data.data.eliminated.role?.roleType === "mask") {
          // Investigators win
          for (const role of state.allRoles) {
            if (role.roleType === "investigator") {
              newScores[role.userId] = (newScores[role.userId] || 0) + 150;
            }
          }
        } else {
          // Mask survives
          const maskRole = state.allRoles.find((r) => r.roleType === "mask");
          if (maskRole) {
            newScores[maskRole.userId] = (newScores[maskRole.userId] || 0) + 200;
          }
        }
      }
      set({
        votes: data.data,
        scores: newScores,
        matchWinner: data.data.matchWinner ?? null,
        investigatorWins: data.data.investigatorWins ?? state.investigatorWins,
        maskWins: data.data.maskWins ?? state.maskWins,
        phase: "reveal",
      });
    }
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
        phase: "assignment",
        roundNumber: state.roundNumber + 1,
      });
    }
  },
}));
