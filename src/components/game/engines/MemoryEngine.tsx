import { useEffect, useMemo, useState } from "react";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const memoryThemes: Record<string, string[]> = {
  faces: ["😀", "😎", "🥳", "🤔"],
  objects: ["🧸", "🎈", "📘", "🪥"],
  words: ["CAT", "SUN", "TREE", "BALL"],
  sounds: ["🎵", "🥁", "🎺", "🎤"],
  positions: ["⬆️", "➡️", "⬇️", "⬅️"],
  stories: ["📖", "🧒", "🌧️", "🏠"],
  sequences: ["1", "2", "3", "4"],
  colors: ["🔴", "🔵", "🟢", "🟡"],
  shapes: ["🔺", "🟦", "⭐", "🟢"],
  animals: ["🐶", "🐱", "🐸", "🦊"],
  default: ["⭐", "🎈", "🧩", "🎨"],
};

export default function MemoryEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.theme || "default");
  const items = useMemo(() => memoryThemes[theme] || memoryThemes.default, [theme]);
  const answer = items[2];
  const [phase, setPhase] = useState<"show" | "quiz">("show");

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("quiz"), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSelect = (item: string) => {
    if (phase !== "quiz") return;
    onInteraction();
    onComplete(item === answer ? 100 : 50);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      {phase === "show" ? (
        <div className="bg-muted rounded-2xl p-8">
          <p className="text-sm text-muted-foreground mb-4">Remember these items</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {items.map((item) => (
              <span key={item} className="text-4xl">{item}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-2xl p-8">
          <p className="text-sm text-muted-foreground mb-4">Which item was third?</p>
          <div className="grid grid-cols-2 gap-3">
            {items.sort(() => Math.random() - 0.5).map((item) => (
              <button key={item} onClick={() => handleSelect(item)} className="bg-card border-2 border-border rounded-xl p-4 text-3xl touch-target hover:border-primary transition-colors">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
