import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const buildPieces: Record<string, string[]> = {
  house: ["[]", "/\\", "[]", "||"],
  garden: ["[]", "[]", "o", "Y"],
  spaceship: ["[]", "/\\", "||", "*"],
  castle: ["[]", "[]", "[]", "^"],
  farm: ["[]", "Y", "o", "||"],
  city: ["[]", "[]", "=", "||"],
  "ocean scene": ["~", "><>", "o", "^"],
  forest: ["Y", "Y", "[]", "*"],
  "vehicle puzzle": ["o", "[]", "[]", "->"],
  hospital: ["[]", "+", "[]", "||"],
  "fire station": ["[]", "[]", "T", "||"],
  classroom: ["[]", "[]", "=", "A"],
  kitchen: ["[]", "[]", "o", "+"],
  default: ["[]", "/\\", "[]", "*"],
};

interface ShapeBuildConfig {
  scene?: string;
  template?: string[];
  pieceOptions?: string[];
  objective?: string;
  modelLabel?: string;
  supportLevel?: "high" | "moderate" | "light";
}

export function getBuildTemplate(config: ShapeBuildConfig) {
  return config.template || buildPieces[String(config.scene || "default")] || buildPieces.default;
}

export function getBuildPieceOptions(config: ShapeBuildConfig, template: string[]) {
  const defaults = Array.from(new Set([...template, "[]", "/\\", "o", "=", "||", "*", "<>"]));
  return config.pieceOptions || defaults.slice(0, Math.max(defaults.length, template.length + 2));
}

export default function BuildingEngine({ game, onInteraction, onComplete }: Props) {
  const config = game.config as ShapeBuildConfig;
  const { difficulty, supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const template = useMemo(
    () => getBuildTemplate(config),
    [config]
  );
  const pieceOptions = useMemo(() => {
    const options = getBuildPieceOptions(config, template);
    if (supportLevel === "high") {
      return Array.from(new Set([...template.slice(0, Math.min(template.length, 2)), ...options])).slice(0, Math.max(4, template.length));
    }
    if (supportLevel === "light") {
      return Array.from(new Set([...options, "X", "T"]));
    }
    return options;
  }, [config, supportLevel, template]);
  const objective = config.objective || `Build the ${game.name.toLowerCase()}`;
  const modelLabel = config.modelLabel || game.name;
  const [placed, setPlaced] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  const nextExpected = template[placed.length];

  const handleSelectPiece = (piece: string) => {
    onInteraction();
    if (piece === nextExpected) {
      const nextPlaced = [...placed, piece];
      if (nextPlaced.length >= template.length) {
        const score = Math.max(difficulty === "hard" ? 50 : 60, 100 - mistakes * (difficulty === "hard" ? 14 : 12));
        onComplete(score);
        return;
      }
      setPlaced(nextPlaced);
      return;
    }

    setMistakes((current) => current + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 rounded-2xl bg-muted p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Build and Understand</p>
        <p className="mt-1 font-display text-xl font-bold text-foreground">{objective}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the next piece to complete the shape or structure. Step {placed.length + 1} of {template.length}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Support level: {supportLevel} · Stage: {readinessStage}</p>
      </div>

      <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Build From Model</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{modelLabel}</p>
        {supportLevel !== "light" || difficulty === "easy" ? (
          <p className="mt-2 font-mono text-2xl text-foreground">{template.join(" ")}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Look at the model name and build it with fewer visual hints.</p>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {template.map((piece, index) => {
          const isFilled = index < placed.length;
          const isCurrent = index === placed.length;
          return (
            <div
              key={`${piece}-${index}`}
              className={`rounded-2xl border p-5 text-center ${
                isFilled ? "border-primary bg-primary/10 text-foreground" : isCurrent ? "border-amber-300 bg-amber-50 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">{isFilled ? "Placed" : isCurrent ? "Next" : "Later"}</p>
              <p className="mt-3 font-mono text-3xl">{isFilled || supportLevel === "high" || difficulty === "easy" ? piece : "?"}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Pick the next piece</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pieceOptions.map((piece, index) => (
            <button
              key={`${piece}-${index}`}
              onClick={() => handleSelectPiece(piece)}
              className="touch-target rounded-2xl border border-border bg-muted px-4 py-6 font-mono text-3xl font-bold text-foreground transition hover:border-primary hover:bg-primary/10"
              aria-label={`piece ${piece}`}
            >
              {piece}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Try to choose carefully. Mistakes: {mistakes}</p>
      </div>
    </div>
  );
}
