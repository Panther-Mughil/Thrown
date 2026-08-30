import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { motion } from "framer-motion";

export default function RoleCard() {
  const { myRole, setPhase, roundNumber } = useGameStore();
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setPhase("discussion");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [setPhase]);

  const isMask = myRole?.roleType === "mask";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-zinc-500 mb-6">Round {roundNumber}</p>

        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: isRevealed ? 0 : 180 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={() => setIsRevealed(true)}
          className={`w-64 h-96 rounded-2xl p-6 cursor-pointer flex flex-col items-center justify-center mx-auto select-none ${
            isRevealed
              ? isMask
                ? "bg-gradient-to-br from-red-900 to-red-700 border-2 border-red-500 shadow-lg shadow-red-500/20"
                : "bg-gradient-to-br from-blue-900 to-blue-700 border-2 border-blue-500 shadow-lg shadow-blue-500/20"
              : "bg-zinc-800 border-2 border-zinc-600 hover:border-zinc-500"
          }`}
          style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          {isRevealed ? (
            <div className="text-center backface-hidden">
              <p className="text-sm text-zinc-300 mb-2">You are</p>
              <p className="text-4xl mb-4">{isMask ? "🎭" : "🔍"}</p>
              <p className="text-xl font-bold mb-4">
                {isMask ? "The Mask" : "Investigator"}
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {isMask
                  ? "Blend in and survive the vote. Don't get caught!"
                  : "Find the hidden Mask before time runs out!"}
              </p>
              {isMask && (
                <p className="text-xs text-red-300 mt-4 italic">
                  You received a decoy clue — use it wisely.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center backface-hidden">
              <p className="text-3xl font-bold mb-2">THROWN</p>
              <p className="text-zinc-400 text-sm">Tap to reveal your role</p>
            </div>
          )}
        </motion.div>

        <p className="text-zinc-500 mt-6">Discussion starts in {countdown}s</p>
      </div>
    </div>
  );
}
