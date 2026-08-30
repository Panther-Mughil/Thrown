import { useGameStore } from "../store/gameStore";
import Lobby from "../components/Lobby";
import RoleCard from "../components/RoleCard";
import DiscussionPhase from "../components/DiscussionPhase";
import VotePhase from "../components/VotePhase";
import RevealPhase from "../components/RevealPhase";
import Scoreboard from "../components/Scoreboard";

export default function GamePage() {
  const { phase } = useGameStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {phase === "lobby" && <Lobby />}
      {phase === "assignment" && <RoleCard />}
      {phase === "discussion" && <DiscussionPhase />}
      {phase === "vote" && <VotePhase />}
      {phase === "waiting" && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xl text-zinc-400">Waiting for other players...</p>
          </div>
        </div>
      )}
      {phase === "reveal" && <RevealPhase />}
      {phase === "scoreboard" && <Scoreboard />}
    </div>
  );
}
