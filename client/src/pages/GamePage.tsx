import { useGameStore } from "../store/gameStore";
import Lobby from "../components/Lobby";
import RoleCard from "../components/RoleCard";
import DiscussionPhase from "../components/DiscussionPhase";
import VotePhase from "../components/VotePhase";
import RevealPhase from "../components/RevealPhase";
import Scoreboard from "../components/Scoreboard";

export default function GamePage() {
  const { phase, tallyVotes } = useGameStore();

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
              Your vote has been submitted. Once everyone has voted, reveal the results.
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
