import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

export default function GamePage() {
  return (
    <main>
      <h1>World viewer</h1>
      <p>Polls Neon via API every few seconds. The agent expands the world; this only renders it.</p>
      <GameCanvas />
    </main>
  );
}
