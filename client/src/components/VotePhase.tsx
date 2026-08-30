import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { motion } from "framer-motion";

export default function VotePhase() {
  const { players, playerId, submitVote } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const otherPlayers = players.filter((p) => p.id !== playerId);

  const handleSubmit = () => {
    if (selected) {
      submitVote(selected);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Vote to Eliminate</h2>
        <p className="text-zinc-400 text-center mb-6 text-sm">Select who you think is the Mask</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {otherPlayers.map((p) => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(p.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selected === p.id
                  ? "border-red-500 bg-red-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${
                  selected === p.id ? "bg-red-600" : "bg-zinc-700"
                }`}
              >
                {p.username[0].toUpperCase()}
              </div>
              <p className="font-semibold text-center text-sm">{p.username}</p>
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full p-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
        >
          {selected ? "Confirm Vote" : "Select a player"}
        </button>
      </div>
    </div>
  );
}
