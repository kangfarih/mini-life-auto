"use client";

import { useEffect, useRef } from "react";
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

export type ViewerStats = {
  status: string;
  chunkCount: number;
  updatedAt: string;
};

const TILE = 28;
const GAP = 6;

export default function GameCanvas({
  autoRefresh,
  refreshToken,
  onStats
}: {
  autoRefresh: boolean;
  refreshToken: number;
  onStats?: (s: ViewerStats) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Chunk[]>([]);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    let alive = true;
    let app: PIXI.Application | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    function draw() {
      if (!app || !alive) return;
      const chunks = cacheRef.current;
      app.stage.removeChildren();
      const cols = Math.max(1, Math.floor((app.screen.width + GAP) / (TILE + GAP)));
      chunks.forEach((c, i) => {
        const g = new PIXI.Graphics();
        g.rect((i % cols) * (TILE + GAP), Math.floor(i / cols) * (TILE + GAP), TILE, TILE);
        g.fill({ color: BIOME_COLORS[c.biome] ?? 0x444444 });
        app!.stage.addChild(g);
      });
    }

    function report(status: string) {
      onStatsRef.current?.({
        status,
        chunkCount: cacheRef.current.length,
        updatedAt: new Date().toLocaleTimeString()
      });
    }

    async function load() {
      try {
        const res = await fetch("/api/chunks?world=main", { cache: "no-store" });
        const json = (await res.json()) as { chunks: Chunk[] };
        if (!alive) return;
        cacheRef.current = json.chunks;
        draw();
        report(json.chunks.length === 0 ? "empty world — run db:seed" : "live");
      } catch {
        if (alive) report("api unreachable");
      }
    }

    function onResize() {
      draw();
    }

    async function init() {
      if (!hostRef.current) return;
      app = new PIXI.Application();
      await app.init({ resizeTo: hostRef.current, background: 0x0b0f14 });
      if (!alive) {
        app.destroy(true);
        return;
      }
      app.canvas.style.display = "block";
      hostRef.current.appendChild(app.canvas);
      report("loading…");
      await load();
      if (autoRefresh) timer = setInterval(load, 4000);
      window.addEventListener("resize", onResize);
    }

    init().catch(() => {
      if (alive) report("pixi failed to start");
    });

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      if (timer) clearInterval(timer);
      app?.destroy(true);
      app = null;
    };
  }, [autoRefresh, refreshToken]);

  return <div ref={hostRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />;
}
