"use client";

import { useEffect, useState } from "react";

// Original pixel-map art (CC0). 16x16 side-view warrior, 4 walk frames.
// Frames differ only in the legs (rows 10-13): stride, gather, stride-mirror, gather.
const BODY = [
  "..........P.....",
  ".....HHHHHH.....",
  ".....HHHHHH.....",
  ".....SSSSS..W...",
  ".....SSSSE..W...",
  ".....SSSSS..W...",
  ".....TTTT..AW...",
  ".....TTTT..AW...",
  ".....TTTT..GGG..",
  ".....BBBBB......"
];

const LEGS = [
  [
    "....NN...LL.....",
    "....NN...LL.....",
    "....NN...LL.....",
    "....DD...DD....."
  ],
  [
    ".....NNLL.......",
    ".....NNLL.......",
    ".....NNLL.......",
    ".....DDDD......."
  ],
  [
    "....LL...NN.....",
    "....LL...NN.....",
    "....LL...NN.....",
    "....DD...DD....."
  ],
  [
    ".....NNLL.......",
    ".....NNLL.......",
    ".....NNLL.......",
    ".....DDDD......."
  ]
];

const EMPTY = "................";

const BASE_PALETTE: Record<string, string> = {
  H: "#9aa5b1", // helmet steel
  P: "#e05252", // plume
  S: "#e0ac69", // skin
  E: "#222222", // eye
  T: "#3f7d3a", // tunic (themable)
  B: "#6b4a2f", // belt
  A: "#e0ac69", // arm
  W: "#d7dde3", // sword blade
  G: "#6b4a2f", // sword guard
  N: "#4a3826", // back leg (dark)
  L: "#5b4636", // front leg
  D: "#2e2117" // boots
};

export default function PixelWarrior({
  tunic = BASE_PALETTE.T,
  size = 192,
  fps = 6
}: {
  tunic?: string;
  size?: number;
  fps?: number;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);

  const palette = { ...BASE_PALETTE, T: tunic };
  const rows = [...BODY, ...LEGS[frame], EMPTY, EMPTY];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Pixel warrior walking"
    >
      {rows.flatMap((row, y) =>
        row.split("").flatMap((ch, x) => {
          if (ch === ".") return [];
          return (
            <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={palette[ch] ?? "#ff00ff"} />
          );
        })
      )}
    </svg>
  );
}
