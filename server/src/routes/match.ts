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
  advanceTimedPhases,
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

// Get match state (raw — used for debugging; sync is the sanitized endpoint)
router.get("/matches/:id", (req, res) => {
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  advanceTimedPhases(state);
  res.json({ success: true, data: state });
});

// Sync endpoint — sanitized, server-authoritative state for polling clients (anti-cheat)
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
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  advanceTimedPhases(state);

  const { roundId, voterId, targetId } = req.body;
  const success = submitVote(req.params.id, roundId, voterId, targetId);
  if (!success) return res.status(400).json({ success: false, error: "Cannot vote" });

  // After the vote lands, if that completes the round, advance immediately
  advanceTimedPhases(state);
  res.json({ success: true });
});

// Tally votes — manual force-reveal fallback (host)
router.post("/matches/:id/tally", (req, res) => {
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  advanceTimedPhases(state);

  const { roundId } = req.body;
  const result = tallyVotes(req.params.id, roundId);
  if (!result) return res.status(400).json({ success: false, error: "Cannot tally" });
  res.json({ success: true, data: { reveal: result } });
});

// Create next round
router.post("/matches/:id/next-round", (req, res) => {
  const state = getMatchState(req.params.id);
  if (!state) return res.status(404).json({ success: false, error: "Match not found" });
  advanceTimedPhases(state);

  const next = createNextRound(req.params.id);
  if (!next) return res.status(400).json({ success: false, error: "Cannot create next round" });
  res.json({
    success: true,
    data: { round: next.currentRound, roles: next.roles.get(next.currentRound?.id || "") || [] },
  });
});

export default router;
