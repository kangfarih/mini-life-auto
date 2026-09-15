"use client";

import { useEffect, useRef, useState } from "react";

const SEARCH = { src: "/demo/search-hero-walk.png", frames: 4, fw: 64, fh: 64, scale: 3 };
const GEN = { src: "/demo/gen-warrior.jpg", frames: 4, fw: 128, fh: 128, scale: 2 };
const FRAME_MS = 166;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** JPEG has no alpha: key out near-white background to transparent. */
function chromaKey(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235) px[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function useWarrior(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  spec: typeof SEARCH,
  keyWhite: boolean,
  playing: boolean
) {
  useEffect(() => {
    let raf = 0;
    let alive = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = spec.fw * spec.scale;
    canvas.height = spec.fh * spec.scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    loadImage(spec.src).then((img) => {
      const src: CanvasImageSource = keyWhite ? chromaKey(img) : img;
      const start = performance.now();
      const draw = (now: number) => {
        if (!alive) return;
        const frame = Math.floor((now - start) / FRAME_MS) % spec.frames;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          src,
          frame * spec.fw, 0, spec.fw, spec.fh,
          0, 0, spec.fw * spec.scale, spec.fh * spec.scale
        );
        if (playing) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }).catch(() => {});

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, spec, keyWhite, playing]);
}

export default function WarriorDemo() {
  const searchRef = useRef<HTMLCanvasElement>(null);
  const genRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);

  useWarrior(searchRef, SEARCH, false, playing);
  useWarrior(genRef, GEN, true, playing);

  return (
    <div>
      <button onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
      <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
        <figure style={{ margin: 0 }}>
          <canvas ref={searchRef} style={{ border: "1px solid #26303b", borderRadius: 12, background: "#11161d" }} />
          <figcaption>
            <strong>Search</strong> — “Hero 2D” walk strip by Sengkean, CC0, 1.8KB.
            4 uniform 64×64 frames, transparent.
          </figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <canvas ref={genRef} style={{ border: "1px solid #26303b", borderRadius: 12, background: "#11161d" }} />
          <figcaption>
            <strong>Generate</strong> — Pollinations turbo, seed 42, 7KB JPEG.
            Asked for “4 frames in a row”; sliced into 4 equal 128×128 cells, white keyed out.
            Watch the feet, sword and silhouette jump between frames.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
