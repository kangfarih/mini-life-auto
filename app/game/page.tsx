"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ViewerStats } from "@/components/GameCanvas";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 16px",
  borderBottom: "1px solid #26303b",
  background: "#11161d",
  flexWrap: "wrap"
};

const pill: React.CSSProperties = {
  border: "1px solid #26303b",
  borderRadius: 999,
  padding: "2px 10px",
  fontSize: 13
};

const btn: React.CSSProperties = {
  border: "1px solid #26303b",
  borderRadius: 8,
  padding: "4px 12px",
  background: "#1a222c",
  color: "#e6edf3",
  cursor: "pointer",
  fontSize: 13
};

export default function GamePage() {
  const [stats, setStats] = useState<ViewerStats>({
    status: "starting…",
    chunkCount: 0,
    updatedAt: "—"
  });
  const [auto, setAuto] = useState(true);
  const [token, setToken] = useState(0);
  const onStats = useCallback((s: ViewerStats) => setStats(s), []);

  const live = stats.status === "live";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={bar}>
        <Link href="/" style={{ textDecoration: "none" }}>← Home</Link>
        <strong>World viewer</strong>
        <span style={pill}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 4,
              marginRight: 6,
              background: live ? "#3fb950" : "#d29922"
            }}
          />
          {stats.status}
        </span>
        <span style={pill}>chunks: {stats.chunkCount}</span>
        <span style={pill}>updated: {stats.updatedAt}</span>
        <span style={{ flex: 1 }} />
        <button style={btn} onClick={() => setToken((t) => t + 1)}>
          ↻ Refresh now
        </button>
        <button style={btn} onClick={() => setAuto((a) => !a)}>
          Auto: {auto ? "on (4s)" : "off"}
        </button>
      </header>
      <GameCanvas autoRefresh={auto} refreshToken={token} onStats={onStats} />
    </div>
  );
}
