import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
const PRESET_MESSAGES = [
  "I'm suspicious!",
  "Trust me!",
  "Who has a clue?",
  "Vote wisely!",
  "I'm an Investigator!",
  "Check the clues!",
  "Don't vote me out!",
  "Something's off...",
  "I have info!",
  "Let's discuss!",
] as const;

export default function DiscussionPhase() {
  const { players, playerId, timeRemaining, currentRound } = useGameStore();
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [displayTime, setDisplayTime] = useState(timeRemaining || 45);

  // Animate a local countdown from the server-provided time. Never transition —
  // the server is the only authority for phase changes.
  useEffect(() => {
    setDisplayTime(timeRemaining || 45);
  }, [timeRemaining]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPlayer = players.find((p) => p.id === playerId);
  const sendMessage = (msg: string) => {
    setMessages((prev) => [...prev, { sender: currentPlayer?.username || "You", text: msg }]);
  };

  const totalTime = currentRound?.discussionTimer || 45;
  const progress = displayTime / totalTime;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-zinc-900 px-6 py-3 rounded-full border border-zinc-800">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" role="img" aria-label="Timer">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-zinc-800"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-purple-500"
                  strokeDasharray={`${progress * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                {displayTime}
              </span>
            </div>
            <span className="text-zinc-400 hidden sm:inline">Discussion Phase</span>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {players.map((p) => (
            <div
              key={p.id}
              className={`bg-zinc-900 p-4 rounded-xl border flex items-center gap-3 ${p.id === playerId ? "border-purple-500/50" : "border-zinc-800"}`}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                {p.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {p.username}
                  {p.id === playerId ? " (You)" : ""}
                </p>
                <p className="text-xs text-zinc-500">Discussing...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-4 max-h-48 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="bg-zinc-800 px-3 py-2 rounded-lg text-sm">
                <span className="text-purple-400 font-semibold">{msg.sender}: </span>
                <span className="text-zinc-300">{msg.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preset Messages */}
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <p className="text-zinc-500 text-xs mb-3">Quick Messages</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => sendMessage(msg)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
