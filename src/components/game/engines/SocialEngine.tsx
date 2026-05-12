import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore: number) => void;
}

interface Scenario {
  situation: string;
  options: { text: string; emoji: string; points: number; social: number }[];
}

const scenarioBank: Record<string, Scenario[]> = {
  greetings: [
    { situation: "You see your friend at school. What do you do?", options: [{ text: "Wave and say hi", emoji: "W", points: 25, social: 3 }, { text: "Smile at them", emoji: ":)", points: 20, social: 2 }, { text: "Walk over and hug", emoji: "H", points: 25, social: 3 }, { text: "Keep walking", emoji: ">", points: 5, social: 0 }] },
    { situation: "A new kid joins your class. What do you do?", options: [{ text: "Introduce yourself", emoji: "I", points: 25, social: 3 }, { text: "Smile warmly", emoji: ":)", points: 20, social: 2 }, { text: "Show them around", emoji: "A", points: 25, social: 3 }, { text: "Wait for them to talk", emoji: ".", points: 10, social: 1 }] },
  ],
  sharing: [
    { situation: "You have extra snacks at lunch. What do you do?", options: [{ text: "Offer to share", emoji: "S", points: 25, social: 3 }, { text: "Ask who wants some", emoji: "?", points: 25, social: 3 }, { text: "Eat them yourself", emoji: "E", points: 5, social: 0 }, { text: "Save for later", emoji: "B", points: 10, social: 1 }] },
    { situation: "Your friend wants to play with your toy. What do you do?", options: [{ text: "Let them play", emoji: "Y", points: 25, social: 3 }, { text: "Take turns", emoji: "T", points: 25, social: 3 }, { text: "Play together", emoji: "P", points: 25, social: 3 }, { text: "Say no", emoji: "N", points: 5, social: 0 }] },
  ],
  default: [
    { situation: "Someone drops their books. What do you do?", options: [{ text: "Help pick them up", emoji: "B", points: 25, social: 3 }, { text: "Ask if they are OK", emoji: "?", points: 20, social: 2 }, { text: "Both help and ask", emoji: "*", points: 25, social: 3 }, { text: "Walk past", emoji: ">", points: 5, social: 0 }] },
    { situation: "Your friend looks sad. What do you do?", options: [{ text: "Ask what's wrong", emoji: "?", points: 25, social: 3 }, { text: "Sit with them", emoji: "C", points: 25, social: 3 }, { text: "Give them a drawing", emoji: "D", points: 20, social: 2 }, { text: "Leave them alone", emoji: "-", points: 10, social: 1 }] },
  ],
};

export default function SocialEngine({ game, onInteraction, onComplete }: Props) {
  const { difficulty, supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const theme = String(game.config.theme || "default");
  const allScenarios = scenarioBank[theme] || scenarioBank.default;
  const scenarioCount = difficulty === "easy" || supportLevel === "high" ? 2 : Math.min(3, allScenarios.length);
  const scenarios = useMemo(() => allScenarios.slice(0, scenarioCount), [allScenarios, scenarioCount]);
  const [current, setCurrent] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalSocial, setTotalSocial] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const scenario = scenarios[current];
  const visibleOptions = useMemo(
    () => (difficulty === "easy" || supportLevel === "high" ? scenario.options.filter((option) => option.social >= 1) : scenario.options),
    [difficulty, scenario?.options, supportLevel]
  );

  const handleChoice = (option: { points: number; social: number }) => {
    onInteraction();
    const nextScore = totalScore + option.points;
    const nextSocial = totalSocial + option.social;

    setTotalScore(nextScore);
    setTotalSocial(nextSocial);
    setFeedback(option.social >= 2 ? "Great choice!" : option.social >= 1 ? "Good try!" : "Try a kinder choice.");

    window.setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= scenarios.length) {
        const pct = Math.round((nextScore / (scenarios.length * 25)) * 100);
        const socialPct = Math.round((nextSocial / (scenarios.length * 3)) * 10);
        onComplete(pct, socialPct);
      } else {
        setCurrent((value) => value + 1);
      }
    }, supportLevel === "high" ? 1800 : 1500);
  };

  if (!scenario) return null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2 text-center">
        <p className="text-xs text-muted-foreground">
          {current + 1} of {scenarios.length} · Support {supportLevel} · Stage {readinessStage}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-center font-display text-xl font-bold text-foreground">{scenario.situation}</p>
      </div>

      {feedback ? (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
          <p className="text-2xl font-semibold text-foreground">{feedback}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visibleOptions.map((option) => (
            <motion.button
              key={`${scenario.situation}-${option.text}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChoice(option)}
              className="touch-target rounded-xl border-2 border-border bg-card p-4 text-center transition-colors hover:border-primary"
            >
              <span className="mb-2 block text-3xl">{option.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{option.text}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
