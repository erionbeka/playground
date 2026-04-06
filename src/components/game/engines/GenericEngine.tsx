import { useState } from "react";
import { GameConfig } from "@/data/games";
import { motion } from "framer-motion";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

export default function GenericEngine({ game, onInteraction, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const totalSteps = 5;
  const [score, setScore] = useState(0);

  const items = ["⭐", "🌸", "🎈", "🐠", "🌈"];

  const handleTap = () => {
    onInteraction();
    setScore((s) => s + 20);
    if (step + 1 >= totalSteps) {
      onComplete(Math.min(100, score + 20));
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-2">Step {step + 1} of {totalSteps}</p>
      <div className="bg-muted rounded-2xl p-8 mb-4">
        <p className="font-display text-lg font-bold text-foreground mb-4">{game.description}</p>
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleTap}
          className="text-7xl animate-float touch-target"
        >
          {items[step % items.length]}
        </motion.button>
        <p className="text-sm text-muted-foreground mt-4">Tap to continue!</p>
      </div>
      {/* Progress */}
      <div className="w-full bg-muted rounded-full h-3">
        <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>
    </div>
  );
}
