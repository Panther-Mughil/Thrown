import { z } from "zod";

// ── User Validation ────────────────────────────────────────

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(16, "Username must be at most 16 characters")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and contain only letters, numbers, and underscores");

export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// ── Match Validation ───────────────────────────────────────

export const createMatchSchema = z.object({
  maxPlayers: z.number().int().min(3).max(8),
  bestOf: z.union([z.literal(5), z.literal(10)]),
  edition: z.enum(["core", "extended", "chaos"]).default("core"),
});

export const joinMatchSchema = z.object({
  roomCode: z.string().regex(/^SDT-[A-Z0-9]{4}$/, "Invalid room code format"),
});

// ── Vote Validation ────────────────────────────────────────

export const voteSchema = z.object({
  targetId: z.string().uuid("Invalid player ID"),
});

// ── Chat Validation ────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  presetKey: z.string().optional(),
});
