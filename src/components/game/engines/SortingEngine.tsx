import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const itemMap: Record<string, string[]> = {
  farm: ["🐄", "🐑", "🐓", "🚜"],
  city: ["🏙️", "🚕", "🚦", "🏢"],
  hot: ["☀️", "🔥", "♨️", "🌶️"],
  cold: ["🧊", "❄️", "🥶", "⛄"],
  big: ["🐘", "🚌", "🏠", "🌳"],
  small: ["🐭", "🍓", "🔑", "🪙"],
  living: ["🌳", "🐶", "🦋", "🌻"],
  "non-living": ["🚗", "🪑", "⚽", "📘"],
  day: ["☀️", "🕶️", "🌤️", "🌼"],
  night: ["🌙", "⭐", "🛌", "🦉"],
  healthy: ["🍎", "🥕", "🥦", "💧"],
  unhealthy: ["🍩", "🍟", "🍬", "🥤"],
  land: ["🐘", "🚗", "🌳", "🏠"],
  water: ["🐠", "⛵", "🐳", "🪸"],
  loud: ["🥁", "📣", "🚨", "🦁"],
  quiet: ["🤫", "📚", "🌙", "🕊️"],
  soft: ["🧸", "☁️", "🧣", "🐇"],
  hard: ["🪨", "🔨", "🧱", "🥥"],
  fast: ["🚀", "🏎️", "🐆", "⚡"],
  slow: ["🐢", "🐌", "🕰️", "🚶"],
  indoor: ["🛋️", "🛏️", "📺", "🪴"],
  outdoor: ["🌳", "🛝", "⚽", "🌤️"],
  happy: ["😊", "😄", "🥳", "😁"],
  sad: ["😢", "☔", "😞", "💧"],
  sink: ["🪨", "🔑", "🧱", "🥄"],
  float: ["🛟", "🪵", "🎈", "🧽"],
  wild: ["🦁", "🐘", "🦊", "🐻"],
  domestic: ["🐶", "🐱", "🐔", "🐹"],
  fruits: ["🍎", "🍌", "🍓", "🍇"],
  vegetables: ["🥕", "🥦", "🌽", "🍅"],
};

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export default function SortingEngine({ game, onInteraction, onComplete }: Props) {
  const categories = (game.config.categories as string[] | undefined) || ["Group A", "Group B"];
  const normalized = categories.map(normalizeCategory);
  const items = useMemo(
    () => normalized.flatMap((category, categoryIndex) => (itemMap[category] || ["⭐", "🎈", "🧩", "🎨"]).map((emoji) => ({ emoji, categoryIndex }))).sort(() => Math.random() - 0.5),
    [normalized]
  );

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);

  const current = items[index];

  const handleChoice = (choice: number) => {
    if (!current) return;
    onInteraction();
    const nextCorrect = correct + (choice === current.categoryIndex ? 1 : 0);
    const nextIndex = index + 1;

    if (nextIndex >= items.length) {
      onComplete(Math.round((nextCorrect / items.length) * 100));
      return;
    }

    setCorrect(nextCorrect);
    setIndex(nextIndex);
  };

  if (!current) return null;

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-4">Sort item {index + 1} of {items.length}</p>
      <div className="bg-muted rounded-2xl p-8 mb-4">
        <div className="text-7xl mb-5">{current.emoji}</div>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((label, categoryIndex) => (
            <button key={label} onClick={() => handleChoice(categoryIndex)} className="bg-card border-2 border-border rounded-xl p-4 font-semibold text-foreground touch-target hover:border-primary transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
