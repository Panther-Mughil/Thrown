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
  const { phase, playerId, matchId, matchWinner, scores, players, resetGame } = useGameStore();

  const rejoinRef = useRef(false);

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

  // Polling loop — keeps all clients in sync (players joining, phase changes, scores)
  useEffect(() => {
    if (!matchId || !playerId) return;
    const interval = setInterval(async () => {
      await useGameStore.getState().sync();
    }, 1500);
    return () => clearInterval(interval);
  }, [matchId, playerId]);

  // Match-end screen (server-authoritative phase)
  if (phase === "match_end") {
    const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            {matchWinner === "investigators" ? "🔍 Investigators Win!" : "🎭 Masks Win!"}
          </h2>
          <div className="space-y-2 mb-6">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                <span className="text-zinc-500 w-6">{i + 1}</span>
                <span className="flex-1 text-left">{p.username}</span>
                <span className="font-bold">{scores[p.id] || 0} SD$</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              resetGame();
              navigate("/");
            }}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {phase === "lobby" && <Lobby />}
      {phase === "assignment" && <RoleCard />}
      {phase === "discussion" && <DiscussionPhase />}
      {phase === "vote" && <VotePhase />}
      {phase === "reveal" && <RevealPhase />}
      {phase === "scoreboard" && <Scoreboard />}
    </div>
  );
}
