import { useMemo, useState } from "react";
import { GameConfig } from "@/data/games";
import { motion } from "framer-motion";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const playgroundThemes: Record<string, { emoji: string; prompt: string }[]> = {
  sandbox: [
    { emoji: "🪣", prompt: "Fill the bucket with sand" },
    { emoji: "🏖️", prompt: "Smooth the sandbox" },
    { emoji: "🏰", prompt: "Build a sand castle" },
    { emoji: "🐚", prompt: "Add shells to decorate" },
  ],
  slide: [
    { emoji: "🛝", prompt: "Climb to the top" },
    { emoji: "🙌", prompt: "Get ready to slide" },
    { emoji: "💨", prompt: "Slide all the way down" },
    { emoji: "😊", prompt: "Celebrate your turn" },
  ],
  bench: [
    { emoji: "🪑", prompt: "Sit beside a friend" },
    { emoji: "👋", prompt: "Say hello kindly" },
    { emoji: "💬", prompt: "Start a short chat" },
    { emoji: "🤝", prompt: "Take turns talking" },
  ],
  default: [
    { emoji: "🌳", prompt: "Explore the playground" },
    { emoji: "🎈", prompt: "Try the next activity" },
    { emoji: "⭐", prompt: "Keep going" },
    { emoji: "🌈", prompt: "Finish the play routine" },
  ],
};

export default function PlaygroundEngine({ game, onInteraction, onComplete }: Props) {
  const steps = useMemo(() => playgroundThemes[game.engine] || playgroundThemes.default, [game.engine]);
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    onInteraction();
    if (current + 1 >= steps.length) {
      onComplete(100);
      return;
    }
    setCurrent((value) => value + 1);
  };

  const step = steps[current];

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-3">Play step {current + 1} of {steps.length}</p>
      <div className="bg-muted rounded-2xl p-8 mb-4">
        <div className="text-7xl mb-4">{step.emoji}</div>
        <p className="font-display text-xl font-bold text-foreground mb-2">{game.name}</p>
        <p className="text-foreground mb-4">{step.prompt}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={handleNext}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold touch-target"
        >
          {current + 1 >= steps.length ? "Finish" : "Do It"}
        </motion.button>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}
