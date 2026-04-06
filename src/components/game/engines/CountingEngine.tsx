import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const countEmoji: Record<string, string> = {
  apples: "🍎",
  stars: "⭐",
  fish: "🐟",
  blocks: "🧱",
  fingers: "☝️",
  coins: "🪙",
  birds: "🐦",
  flowers: "🌸",
  cars: "🚗",
  dots: "●",
  butterflies: "🦋",
  marbles: "🔵",
  default: "⭐",
};

export default function CountingEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.theme || "default");
  const max = Number(game.config.max || 5);
  const answer = Math.max(3, Math.min(max, Math.floor(max * 0.7)));
  const emoji = countEmoji[theme] || countEmoji.default;
  const options = useMemo(() => Array.from(new Set([answer - 1, answer, answer + 1, answer + 2].filter((value) => value > 0))), [answer]);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    if (selected != null) return;
    onInteraction();
    setSelected(value);
    window.setTimeout(() => onComplete(value === answer ? 100 : 50), 500);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-4">Count the items on screen</p>
      <div className="bg-muted rounded-2xl p-6 mb-4">
        <div className="flex justify-center flex-wrap gap-3 mb-6">
          {Array.from({ length: answer }, (_, index) => (
            <span key={index} className="text-4xl">{emoji}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((value) => (
            <button key={value} onClick={() => handleSelect(value)} className="bg-card border-2 border-border rounded-xl p-4 font-bold text-foreground touch-target hover:border-primary transition-colors">
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
