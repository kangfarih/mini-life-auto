import WarriorDemo from "@/components/WarriorDemo";

export default function DemoWarriorPage() {
  return (
    <main>
      <h1>Warrior demo: search vs generate</h1>
      <p>
        Same job — a side-view walk cycle on HTML canvas. Left: a searched CC0
        sprite strip. Right: an AI-generated “4-frame sheet” cut into 4 equal cells.
      </p>
      <WarriorDemo />
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
