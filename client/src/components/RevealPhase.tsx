import { useGameStore } from "../store/gameStore";
import { motion } from "framer-motion";

export default function RevealPhase() {
  const { votes, players, setPhase, setVotes, tallyVotes } = useGameStore();

  // Auto-tally on mount if votes data isn't loaded yet
  if (!votes) {
    tallyVotes();
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const eliminatedPlayer = votes.eliminated
    ? players.find((p) => p.id === votes.eliminated?.userId)
    : null;

  const isMask = votes.eliminated?.role?.roleType === "mask";

  const handleContinue = () => {
    setVotes(null);
    setPhase("scoreboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Votes Revealed!</h2>

        {/* Vote breakdown */}
        <div className="space-y-2 mb-6">
          {votes.votes.map((v, i) => {
            const voter = players.find((p) => p.id === v.voterId);
            const target = players.find((p) => p.id === v.targetId);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg text-sm"
              >
                <span className="text-zinc-400">{voter?.username}</span>
                <span className="text-zinc-600">→</span>
                <span className="font-semibold">{target?.username}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Eliminated player */}
        {eliminatedPlayer ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`p-6 rounded-xl text-center mb-6 ${
              isMask
                ? "bg-green-900/30 border-2 border-green-500"
                : "bg-red-900/30 border-2 border-red-500"
            }`}
          >
            <p className="text-sm text-zinc-300 mb-2">
              {eliminatedPlayer.username} was eliminated!
            </p>
            <p className="text-3xl mb-2">{isMask ? "🎭" : "🔍"}</p>
            <p className="text-xl font-bold mb-2">{isMask ? "The Mask" : "Investigator"}</p>
            <p className={isMask ? "text-green-400" : "text-red-400"}>
              {isMask
                ? "The Mask has been caught! Investigators win this round!"
                : "An Investigator was wrongfully eliminated! The Mask survives!"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl text-center mb-6 bg-zinc-800 border border-zinc-700"
          >
            <p className="text-xl text-zinc-300">No one was eliminated (tie)</p>
            <p className="text-sm text-zinc-500 mt-2">Votes were evenly split</p>
          </motion.div>
        )}

        {votes.tiebreak && (
          <p className="text-xs text-yellow-400 text-center mb-4">⚡ Tie was broken randomly</p>
        )}

        <button
          onClick={handleContinue}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
