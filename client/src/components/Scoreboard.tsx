import { useGameStore } from "../store/gameStore";
import { motion } from "framer-motion";

export default function Scoreboard() {
  const { players, scores, match, playerId, nextRound, resetGame, matchWinner } = useGameStore();

  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const bestOf = match?.bestOf || 5;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {matchWinner ? "🏆 Match Over!" : "Scoreboard"}
        </h2>

        {matchWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6 p-4 rounded-xl border"
          >
            <p className="text-3xl mb-1">🏆</p>
            <p className="text-lg font-bold">
              {matchWinner === "investigators"
                ? "Investigators win the match!"
                : "The Mask wins the match!"}
            </p>
          </motion.div>
        )}

        <div className="space-y-3 mb-6">
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                p.id === playerId ? "bg-purple-900/20 border border-purple-500/30" : "bg-zinc-800"
              }`}
            >
              <span className="text-2xl font-bold text-zinc-600 w-8 text-center">{i + 1}</span>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {p.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {p.username}
                  {p.id === playerId && <span className="text-xs text-purple-400 ml-2">(You)</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{scores[p.id] || 0}</p>
                <p className="text-xs text-zinc-500">SD$</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center text-zinc-500 text-sm mb-6">
          Best of {bestOf} &bull; First side to win {Math.ceil(bestOf / 2)} rounds takes the match
        </div>

        <div className="space-y-3">
          {matchWinner ? (
            <button
              onClick={resetGame}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          ) : (
            <button
              onClick={nextRound}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Next Round
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
