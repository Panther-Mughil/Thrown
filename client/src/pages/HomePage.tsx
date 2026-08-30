import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { setPlayer, createRoom, joinRoom } = useGameStore();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!username.trim()) return;
    setError("");
    const playerId = `player-${Date.now()}`;
    setPlayer(playerId, username.trim());
    setIsCreating(true);
    try {
      await createRoom(5, 5);
      navigate("/game");
    } catch {
      setError("Failed to create room");
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim() || !roomCode.trim()) return;
    setError("");
    const playerId = `player-${Date.now()}`;
    setPlayer(playerId, username.trim());
    try {
      await joinRoom(roomCode.toUpperCase());
      navigate("/game");
    } catch {
      setError("Failed to join room");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-2 text-purple-400 tracking-tight">THROWN</h1>
        <p className="text-zinc-500 text-center mb-8 text-sm">Social Deduction Game</p>

        <input
          type="text"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={16}
          className="w-full p-3 mb-6 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
        />

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCreate}
            disabled={!username.trim() || isCreating}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
          >
            {isCreating ? "Creating..." : "Create Room"}
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="SDT-XXXX"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={!username.trim() || !roomCode.trim()}
              className="p-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        <p className="text-zinc-600 text-xs text-center mt-8">
          3-8 players &bull; Best of 5 or 10 &bull; Find the Mask!
        </p>
      </div>
    </div>
  );
}
