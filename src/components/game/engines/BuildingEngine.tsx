import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const buildPieces: Record<string, string[]> = {
  house: ["🧱", "🚪", "🪟", "🏠"],
  garden: ["🪴", "🌷", "🌳", "🌼"],
  spaceship: ["🔩", "🪟", "🚀", "✨"],
  castle: ["🧱", "🏰", "🚩", "👑"],
  "vehicle puzzle": ["🛞", "🚪", "🚗", "🛣️"],
  "animal puzzle": ["🐾", "🦊", "🌿", "🌟"],
  classroom: ["🪑", "📚", "📝", "🏫"],
  kitchen: ["🍽️", "🥄", "🧃", "🏡"],
  default: ["🧱", "🔨", "⭐", "🏗️"],
};

export default function BuildingEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.scene || "default");
  const pieces = useMemo(() => buildPieces[theme] || buildPieces.default, [theme]);
  const [placed, setPlaced] = useState(0);

  const handlePlace = () => {
    onInteraction();
    const nextPlaced = placed + 1;
    if (nextPlaced >= pieces.length) {
      onComplete(100);
      return;
    }
    setPlaced(nextPlaced);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        Build step {placed + 1} of {pieces.length}
      </p>
      <div className="mb-4 rounded-2xl bg-muted p-8">
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {pieces.map((piece, index) => (
            <span key={`${piece}-${index}`} className={`text-5xl transition-opacity ${index <= placed ? "opacity-100" : "opacity-25"}`}>
              {piece}
            </span>
          ))}
        </div>
        <button onClick={handlePlace} className="touch-target rounded-xl bg-primary px-6 py-3 font-display font-bold text-primary-foreground">
          {placed + 1 >= pieces.length ? "Finish Build" : "Place Piece"}
        </button>
      </div>
    </div>
  );
}
