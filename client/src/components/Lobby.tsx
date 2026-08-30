import { useGameStore } from "../store/gameStore";

export default function Lobby() {
  const { roomCode, players, match, startGame, playerId } = useGameStore();
  const isHost = match?.hostId === playerId;
  const canStart = players.length >= 3 && isHost;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Lobby</h2>

        <div className="bg-zinc-800 p-4 rounded-lg mb-6 text-center">
          <p className="text-zinc-400 text-sm mb-1">Room Code</p>
          <p className="text-3xl font-mono font-bold text-purple-400 tracking-wider">{roomCode}</p>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-zinc-400 text-sm">Players ({players.length}/{match?.maxPlayers || 5})</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {p.username[0].toUpperCase()}
              </div>
              <span className="flex-1">{p.username}</span>
              {p.isHost && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">Host</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full p-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
          >
            {canStart ? "Start Game" : `Need ${Math.max(0, 3 - players.length)} more player(s)`}
          </button>
        ) : (
          <p className="text-center text-zinc-400 py-3">Waiting for host to start...</p>
        )}
      </div>
    </div>
  );
}
