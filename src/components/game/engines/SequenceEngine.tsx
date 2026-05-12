import { useEffect, useMemo, useState } from "react";
import { GameConfig } from "@/data/games";
import { motion } from "framer-motion";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const themeSymbols: Record<string, string[]> = {
  colors: ["🔴", "🔵", "🟡", "🟢"],
  shapes: ["🔺", "🟦", "🟡", "⭐"],
  sounds: ["🎵", "🥁", "🎶", "🎺"],
  animals: ["🐶", "🐱", "🐰", "🐸"],
  numbers: ["1", "2", "3", "4"],
  patterns: ["🌟", "🌙", "☀️", "🌈"],
  "dance moves": ["💃", "🕺", "👏", "🙌"],
  "musical notes": ["🎵", "🎶", "🎼", "🎤"],
  emotions: ["😊", "😮", "😢", "😄"],
  actions: ["🏃", "🪂", "🤸", "🚶"],
  vehicles: ["🚗", "🚲", "🚂", "🚀"],
  foods: ["🍎", "🍌", "🍓", "🥕"],
  seasons: ["🌷", "☀️", "🍂", "❄️"],
  "daily routine": ["🛏️", "🪥", "👕", "🍽️"],
  "story order": ["📖", "🧠", "✨", "🏁"],
  default: ["🔴", "🔵", "🟡", "🟢"],
};

export default function SequenceEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const length = Number(game.config.length || game.config.steps || 4);
  const theme = String(game.config.theme || "default");
  const base = themeSymbols[theme] || themeSymbols.default;
  const sequence = useMemo(() => Array.from({ length }, (_, index) => base[index % base.length]), [base, length]);
  const [phase, setPhase] = useState<"watch" | "repeat">("watch");
  const [progress, setProgress] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);

  useEffect(() => {
    if (phase !== "watch") return;
    if (flashIndex >= sequence.length) {
      const timer = window.setTimeout(() => setPhase("repeat"), 500);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setFlashIndex((value) => value + 1);
    }, supportLevel === "high" ? 850 : 700);

    return () => window.clearTimeout(timer);
  }, [flashIndex, phase, sequence.length, supportLevel]);

  const handlePick = (symbol: string) => {
    if (phase !== "repeat") return;
    onInteraction();

    if (symbol === sequence[progress]) {
      const next = progress + 1;
      if (next >= sequence.length) {
        const score = Math.max(40, 100 - mistakes * 15);
        onComplete(score);
        return;
      }
      setProgress(next);
      return;
    }

    setMistakes((value) => value + 1);
    setProgress(supportLevel === "high" ? Math.max(0, progress - 1) : 0);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-3">
        {phase === "watch" ? "Watch the pattern" : `Repeat the pattern: ${progress}/${sequence.length}`}
      </p>
      <p className="text-xs text-muted-foreground mb-4">Support: {supportLevel} · Stage: {readinessStage}</p>

      <div className="bg-muted rounded-2xl p-6 mb-4">
        <div className="flex justify-center gap-3 flex-wrap mb-6 min-h-16">
          {sequence.map((symbol, index) => (
            <motion.div
              key={`${symbol}-${index}`}
              animate={phase === "watch" && index === flashIndex ? { scale: 1.2, opacity: 1 } : { scale: 1, opacity: phase === "watch" && index > flashIndex ? 0.3 : 0.8 }}
              className="text-4xl"
            >
              {phase === "watch" || index < progress || supportLevel === "high" ? symbol : "•"}
            </motion.div>
          ))}
        </div>

        {phase === "repeat" && (
          <div className="grid grid-cols-4 gap-3">
            {base.map((symbol) => (
              <button key={symbol} onClick={() => handlePick(symbol)} className="bg-card border-2 border-border rounded-xl p-4 text-3xl touch-target hover:border-primary transition-colors">
                {symbol}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
