import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Routes>
        <Route path="/" element={<div className="flex items-center justify-center h-screen"><h1 className="text-4xl font-bold">THROWN</h1></div>} />
      </Routes>
    </div>
  );
}
