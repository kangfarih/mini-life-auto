import WarriorDemo from "@/components/WarriorDemo";
import PixelWarrior from "@/components/PixelWarrior";

export default function DemoWarriorPage() {
  return (
    <main>
      <h1>Warrior demo: search vs generate</h1>
      <p>
        Same job — a side-view walk cycle on HTML canvas. Left: a searched CC0
        sprite strip. Right: an AI-generated “4-frame sheet” cut into 4 equal cells.
      </p>
      <WarriorDemo />
      <h2>SVG: own the asset</h2>
      <p>
        Same warrior as 4 string-maps in <code>components/PixelWarrior.tsx</code> —
        no image files, ~2KB as code, infinitely scalable, recolorable via props.
      </p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <figure style={{ margin: 0 }}>
          <PixelWarrior tunic="#3f7d3a" />
          <figcaption>Plains faction (green tunic)</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <PixelWarrior tunic="#2b5f8a" />
          <figcaption>Lake faction (blue tunic, same maps)</figcaption>
        </figure>
      </div>
      <div className="card">
        <p>What to observe:</p>
        <ul>
          <li>Left loops cleanly: same character, same size, feet land on-grid.</li>
          <li>Right wobbles: proportions, sword and feet shift per frame — the model drew 4 pictures, not 4 frames.</li>
          <li>Left cost zero model tokens and is byte-identical forever. Right cost Zen quota and re-runs differently.</li>
        </ul>
      </div>
    </main>
  );
}
