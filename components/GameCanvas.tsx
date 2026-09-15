"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

const BIOME_COLORS: Record<string, number> = {
  plains: 0x3f7d3a,
  forest: 0x2a5d34,
  water: 0x2b5f8a,
  village: 0x8a7648
};

type Chunk = {
  id: number;
  x: number;
  y: number;
  biome: string;
};

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("starting…");
  const [chunkCount, setChunkCount] = useState(0);

  useEffect(() => {
    let destroyed = false;
    let app: PIXI.Application | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const res = await fetch("/api/chunks?world=main", { cache: "no-store" });
        const json = (await res.json()) as { chunks: Chunk[] };
        if (destroyed) return;
        setChunkCount(json.chunks.length);
        setStatus(json.chunks.length === 0 ? "empty world — run db:seed" : "live");
        if (!app) return;
        app.stage.removeChildren();
        const size = 28;
        json.chunks.forEach((c, i) => {
          const g = new PIXI.Graphics();
          g.rect((i % 8) * (size + 6), Math.floor(i / 8) * (size + 6), size, size);
          g.fill({ color: BIOME_COLORS[c.biome] ?? 0x444444 });
          app!.stage.addChild(g);
        });
      } catch {
        if (!destroyed) setStatus("api unreachable");
      }
    }

    async function init() {
      if (!hostRef.current) return;
      app = new PIXI.Application();
      await app.init({ width: 640, height: 360, background: 0x0b0f14 });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      hostRef.current.appendChild(app.canvas);
      await load();
      timer = setInterval(load, 4000);
    }

    init().catch(() => {
      if (!destroyed) setStatus("pixi failed to start");
    });

    return () => {
      destroyed = true;
      if (timer) clearInterval(timer);
      app?.destroy(true);
      app = null;
    };
  }, []);

  return (
    <div>
      <p>
        status: <code>{status}</code> · chunks: <code>{chunkCount}</code>
      </p>
      <div ref={hostRef} style={{ border: "1px solid #26303b", borderRadius: 12, overflow: "hidden" }} />
    </div>
  );
}
