// ============================================================
// THROWN Shared Types
// Used across client and server for type-safe communication
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export type GameEdition = "core" | "extended" | "chaos";

export type GamePhase =
  | "idle"
  | "assignment"
  | "discussion"
  | "vote"
  | "tiebreak"
  | "reveal"
  | "scoreboard"
  | "match_end";

export type MatchStatus = "lobby" | "starting" | "in_progress" | "completed";

export type RoleType = "mask" | "special_investigator" | "investigator";

// ── Characters ─────────────────────────────────────────────

export type MaskCharacter = "the_artist" | "victor";

export type SpecialInvestigatorCharacter =
  | "nova_reyes"     // Lead Investigator
  | "mikaela"        // Protector
  | "kate"           // Mediator
  | "tamara"         // Anchor
  | "dmw"            // Unshakeable Boss
  | "auditor"        // Sees vote breakdown
  | "lucky_charm";   // Bonus on elimination

export type InvestigatorCharacter = "volta_agent";

export type CharacterName = MaskCharacter | SpecialInvestigatorCharacter | InvestigatorCharacter;

// ── User ───────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email?: string;
  provider?: string;
  avatarUrl?: string;
  bio?: string;
  sdBalance: number;
  loserTag: boolean;
  friendCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  stats: UserStats;
  loserTag: boolean;
  dpCollection: Item[];
}

export interface UserStats {
  matchesWon: number;
  correctVoteRate: number;
  timesCaughtAsMask: number;
}

// ── Match ──────────────────────────────────────────────────

export interface Match {
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

export interface MatchPlayer {
  matchId: string;
  userId: string;
  isHost: boolean;
  confirmed: boolean;
  joinedAt: string;
}

// ── Round ──────────────────────────────────────────────────

export interface Round {
  id: string;
  matchId: string;
  roundNumber: number;
  status: GamePhase;
  discussionTimer: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// ── Role ───────────────────────────────────────────────────

export interface Role {
  id: string;
  roundId: string;
  userId: string;
  roleType: RoleType;
  characterName: CharacterName;
  hasStrongClue: boolean;
  hasWeakClue: boolean;
  abilityUsed: boolean;
}

// ── Clue Token ─────────────────────────────────────────────

export type ClueTokenType = "strong" | "weak";

export interface ClueToken {
  id: string;
  roundId: string;
  userId: string;
  tokenType: ClueTokenType;
  content: string;
  isDecoy: boolean;
}

// ── Vote ───────────────────────────────────────────────────

export interface Vote {
  id: string;
  roundId: string;
  voterId: string;
  targetId: string;
  isValid: boolean;
}

export interface VoteResult {
  voterId: string;
  targetId: string;
  weight: number; // 2 for Anchor, 1 normally
}

export interface RevealResult {
  votes: VoteResult[];
  eliminated?: { userId: string; role: Role };
  tiebreak: boolean;
  tiebreakWinner?: string;
}

// ── Score ──────────────────────────────────────────────────

export interface Score {
  matchId: string;
  userId: string;
  totalSdEarned: number;
  roundsWon: number;
  correctVotes: number;
  timesMask: number;
}

// ── Items & Economy ────────────────────────────────────────

export type ItemType = "dp" | "theme" | "lootbox";

export type ItemRarity = "common" | "good" | "legendary" | "mythical";

export interface Item {
  id: string;
  userId: string;
  itemType: ItemType;
  rarity: ItemRarity;
  name: string;
  imageUrl: string;
  floorPrice: number;
  acquiredAt: string;
}

export type LootboxTier = "common" | "good" | "legendary" | "mythical";

export const LOOTBOX_COSTS: Record<LootboxTier, number> = {
  common: 1000,
  good: 5000,
  legendary: 10000,
  mythical: 50000,
};

export const LOOTBOX_PULL_RATES: Record<ItemRarity, number> = {
  common: 0.85,
  good: 0.12,
  legendary: 0.025,
  mythical: 0.005,
};

// ── Auction ────────────────────────────────────────────────

export interface Auction {
  id: string;
  sellerId: string;
  itemId: string;
  floorPrice: number;
  currentBid?: number;
  highestBidderId?: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "ended" | "cancelled";
}

// ── Friends ────────────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
}

// ── Notifications ──────────────────────────────────────────

export type NotificationType =
  | "friend_online"
  | "challenge_found"
  | "match_found"
  | "vote_starting"
  | "round_result"
  | "loser_tag"
  | "friend_request"
  | "trade"
  | "marketplace_bid"
  | "marketplace_outbid"
  | "marketplace_snipe"
  | "auction_end";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  content: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ── Chat ───────────────────────────────────────────────────

export type ChatMode = "preset" | "free_text";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  presetKey?: string;
  timestamp: string;
}

export const PRESET_MESSAGES = [
  "I'm suspicious!",
  "Trust me!",
  "Who has a clue?",
  "Vote wisely!",
  "I'm an Investigator!",
  "Check the clues!",
  "Don't vote me out!",
  "Something's off...",
  "I have info!",
  "Let's discuss!",
] as const;

// ── Discussion Timer Scaling ───────────────────────────────

export function getDiscussionTimer(playerCount: number): number {
  if (playerCount <= 4) return 45;
  if (playerCount <= 6) return 60;
  return 75;
}

// ── Socket.io Events ───────────────────────────────────────

export interface ClientToServerEvents {
  "match:create": (data: { maxPlayers: number; bestOf: 5 | 10; edition: GameEdition }) => void;
  "match:join": (data: { roomCode: string }) => void;
  "match:leave": () => void;
  "match:confirm": () => void;
  "match:start": () => void;
  "match:cancel": () => void;
  "match:vote-edition": (data: { edition: GameEdition }) => void;
  "game:discussion-message": (data: { message: string; presetKey?: string }) => void;
  "game:use-ability": (data: { targetId?: string }) => void;
  "game:vote": (data: { targetId: string }) => void;
}

export interface ServerToClientEvents {
  "match:created": (data: { matchId: string; roomCode: string }) => void;
  "match:joined": (data: { match: Match; players: MatchPlayer[] }) => void;
  "match:player-joined": (data: { player: MatchPlayer }) => void;
  "match:player-left": (data: { playerId: string }) => void;
  "match:player-confirmed": (data: { playerId: string }) => void;
  "match:started": (data: { matchId: string }) => void;
  "match:cancelled": () => void;
  "game:phase-change": (data: { phase: GamePhase; timer?: number }) => void;
  "game:role-assigned": (data: { role: Role; clue: ClueToken }) => void;
  "game:discussion-message": (data: { playerId: string; message: string; presetKey?: string }) => void;
  "game:timer-update": (data: { timeRemaining: number }) => void;
  "game:vote-received": () => void;
  "game:reveal": (data: RevealResult) => void;
  "game:scoreboard": (data: { scores: Score[]; roundNumber: number }) => void;
  "game:match-end": (data: { winner: "investigators" | "masks"; finalScores: Score[] }) => void;
  "error": (data: { message: string; code: string }) => void;
}

// ── API Responses ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
