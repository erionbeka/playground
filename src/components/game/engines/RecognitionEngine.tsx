import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const themeTargets: Record<string, { target: string; items: string[] }> = {
  "red things": { target: "Pick the red things", items: ["🍎", "🚗", "🍓", "🔵", "🌹", "🟢"] },
  "blue things": { target: "Pick the blue things", items: ["🫐", "🐟", "🔵", "🍋", "🍎", "🟡"] },
  "round objects": { target: "Pick the round objects", items: ["⚽", "🟡", "🍪", "📘", "🧱", "🔺"] },
  "square objects": { target: "Pick the square objects", items: ["🟦", "⬜", "📦", "⚽", "🍊", "🌙"] },
  "learn animals": { target: "Tap the animals", items: ["🐶", "🚗", "🐱", "🐸", "🎈", "🐰"] },
  "learn emotions": { target: "Tap the faces showing emotions", items: ["😊", "😮", "📘", "😢", "🧩", "😡"] },
  "learn colors": { target: "Tap the color circles", items: ["🔴", "🔵", "🟢", "🍎", "🚗", "🌼"] },
  "learn shapes": { target: "Tap the shapes", items: ["🔺", "🟦", "⭐", "🍎", "🚗", "🌼"] },
  default: { target: "Pick the matching items", items: ["⭐", "⭐", "🎈", "🧩", "⭐", "🎨"] },
};

export default function RecognitionEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.theme || "default");
  const data = themeTargets[theme] || themeTargets.default;
  const correctToken = data.items[0];
  const pool = useMemo(() => [...data.items].sort(() => Math.random() - 0.5), [data.items]);
  const totalCorrect = pool.filter((item) => item === correctToken).length;
  const [selected, setSelected] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);

  const handlePick = (index: number, value: string) => {
    if (selected.includes(index)) return;

    onInteraction();
    const nextSelected = [...selected, index];
    const nextCorrect = correct + (value === correctToken ? 1 : 0);

    setSelected(nextSelected);
    setCorrect(nextCorrect);

    if (nextSelected.length >= pool.length) {
      onComplete(Math.round((nextCorrect / totalCorrect) * 100));
    }
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-4 text-sm text-muted-foreground">{data.target}</p>
      <div className="grid grid-cols-3 gap-3">
        {pool.map((item, index) => (
          <button
            key={`${item}-${index}`}
            onClick={() => handlePick(index, item)}
            className={`touch-target rounded-2xl border-2 p-5 text-4xl transition-colors ${
              selected.includes(index) ? "border-secondary bg-secondary/20" : "border-border bg-card hover:border-primary"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
