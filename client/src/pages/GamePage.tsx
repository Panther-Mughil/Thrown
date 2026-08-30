import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import Lobby from "../components/Lobby";
import RoleCard from "../components/RoleCard";
import DiscussionPhase from "../components/DiscussionPhase";
import VotePhase from "../components/VotePhase";
import RevealPhase from "../components/RevealPhase";
import Scoreboard from "../components/Scoreboard";

export default function GamePage() {
  const navigate = useNavigate();
  const {
    phase,
    setPhase,
    playerId,
    matchId,
    currentRound,
    votes,
    votesSubmitted,
    votesRequired,
    tallyVotes,
  } = useGameStore();

  const rejoinRef = useRef(false);
  const votedRef = useRef(false);

  // Rejoin from localStorage on mount if we have no identity in memory
  useEffect(() => {
    const identity = useGameStore.getState().rejoinFromStorage();
    if (!playerId || !matchId) {
      if (identity && !rejoinRef.current) {
        rejoinRef.current = true;
        useGameStore.setState({
          playerId: identity.playerId,
          playerName: identity.playerName,
          matchId: identity.matchId,
          roomCode: identity.roomCode,
          phase: "lobby",
        });
      } else {
        navigate("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, matchId]);

  // Polling loop — keeps all clients in sync (players joining, phase changes)
  useEffect(() => {
    if (!matchId || !playerId) return;
    const interval = setInterval(async () => {
      await useGameStore.getState().sync();
    }, 1500);
    return () => clearInterval(interval);
  }, [matchId, playerId]);

  // Auto phase transitions derived from synced server state
  useEffect(() => {
    const store = useGameStore.getState();
    const st = store;

    // Auth check (identity vanished)
    if (!st.playerId || !st.matchId) {
      navigate("/");
      return;
    }

    // Lobby → game started by host: switch to assignment
    if (st.phase === "lobby" && st.match?.status === "in_progress" && st.currentRound) {
      st.setPhase("assignment");
      return;
    }

    // Round changed (start or next round propagated via poll)
    if (st.currentRound && currentRound && st.currentRound.id !== currentRound.id) {
      setPhase("assignment");
      return;
    }

    // Auto-reveal once everyone has voted
    if (
      (st.phase === "waiting" || st.phase === "vote") &&
      st.votes === null &&
      st.votesSubmitted >= st.votesRequired &&
      st.votesRequired > 0 &&
      !votedRef.current
    ) {
      votedRef.current = true;
      tallyVotes().finally(() => {
        votedRef.current = false;
      });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentRound, votes, votesSubmitted, votesRequired]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {phase === "lobby" && <Lobby />}
      {phase === "assignment" && <RoleCard />}
      {phase === "discussion" && <DiscussionPhase />}
      {phase === "vote" && <VotePhase />}
      {phase === "waiting" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6" />
            <p className="text-xl text-zinc-300 mb-2">Waiting for other players...</p>
            <p className="text-sm text-zinc-500 mb-6">
              Your vote has been submitted. Once everyone has voted, the results reveal
              automatically.
            </p>
            <button
              onClick={tallyVotes}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Reveal Votes
            </button>
          </div>
        </div>
      )}
      {phase === "reveal" && <RevealPhase />}
      {phase === "scoreboard" && <Scoreboard />}
    </div>
  );
}
