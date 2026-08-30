import { Router } from "express";
import {
  createMatch,
  joinMatch,
  startMatch,
  getMatchState,
  getMatchByRoomCode,
  submitVote,
  tallyVotes,
  createNextRound,
  toSyncPayload,
} from "../game/engine.js";

const router = Router();

// Create match
router.post("/matches", (req, res) => {
  const { hostId, hostUsername, maxPlayers, bestOf } = req.body;
  const state = createMatch(hostId, hostUsername, maxPlayers || 5, bestOf || 5);
  res.json({ success: true, data: { match: state.match, roomCode: state.match.roomCode } });
});

// Join match by room code
router.post("/matches/join", (req, res) => {
  const { roomCode, playerId, username } = req.body;
  const state = getMatchByRoomCode(roomCode);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });

  const updated = joinMatch(state.match.id, playerId, username);
  if (!updated) return res.status(400).json({ success: false, error: "Cannot join match" });

  res.json({ success: true, data: { match: updated.match, players: updated.players } });
});

// Get match state
router.get("/matches/:id", (req, res) => {
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  res.json({ success: true, data: state });
});

// Sync endpoint — sanitized state for polling clients (anti-cheat)
router.get("/matches/:id/sync", (req, res) => {
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  const userId = String(req.query.userId || "");
  res.json({ success: true, data: toSyncPayload(state, userId) });
});

// Start match
router.post("/matches/:id/start", (req, res) => {
  const { hostId } = req.body;
  const state = startMatch(req.params.id, hostId);
  if (!state) return res.status(400).json({ success: false, error: "Cannot start match" });
  res.json({
    success: true,
    data: {
      match: state.match,
      currentRound: state.currentRound,
      roles: state.roles.get(state.currentRound?.id || "") || [],
    },
  });
});

// Submit vote
router.post("/matches/:id/vote", (req, res) => {
  const { roundId, voterId, targetId } = req.body;
  const success = submitVote(req.params.id, roundId, voterId, targetId);
  if (!success) return res.status(400).json({ success: false, error: "Cannot vote" });
  res.json({ success: true });
});

// Tally votes and get results
router.post("/matches/:id/tally", (req, res) => {
  const { roundId } = req.body;
  const result = tallyVotes(req.params.id, roundId);
  if (!result) return res.status(400).json({ success: false, error: "Cannot tally" });
  res.json({ success: true, data: result });
});

// Create next round
router.post("/matches/:id/next-round", (req, res) => {
  const state = createNextRound(req.params.id);
  if (!state) return res.status(400).json({ success: false, error: "Cannot create next round" });
  res.json({
    success: true,
    data: { round: state.currentRound, roles: state.roles.get(state.currentRound?.id || "") || [] },
  });
});

export default router;
