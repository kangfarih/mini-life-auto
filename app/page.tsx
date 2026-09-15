import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>mini-life-auto</h1>
      <p>Self-growing 2D RPG world. The browser is only a viewer; Neon is the source of truth.</p>
      <div className="card">
        <Link href="/game">Open world viewer</Link>
      </div>
      <div className="card">
        <p>APIs:</p>
        <ul>
          <li>
            <code>GET /api/chunks?world=main</code>
          </li>
          <li>
            <code>GET /api/events?world=main</code>
          </li>
          <li>
            <code>GET /api/state?world=main</code>
          </li>
        </ul>
      </div>
    </main>
  );
}
