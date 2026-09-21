import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { getThemeVisual } from "@/lib/gameAssets";
import { speak } from "@/lib/speech";
import { useHintLadder } from "@/hooks/useHintLadder";
import { BurstLayer, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

export default function CountingEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel, personalized } = getAdaptiveGameConfig(game);
  const theme = String(game.config.theme || "default");
  const max = Number(game.config.max || 5);
  const baseAnswer = Math.max(2, Math.min(max, Math.floor(max * 0.7)));
  const answer =
    personalized && supportLevel === "high"
      ? Math.max(2, baseAnswer - 1)
      : personalized && supportLevel === "light"
        ? Math.min(max, baseAnswer + 1)
        : baseAnswer;
  const mark = getThemeVisual(theme);
  const options = useMemo(
    () => Array.from(new Set([answer - 1, answer, answer + 1, answer + 2].filter((value) => value > 0 && value <= max + 1))),
    [answer, max]
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [countedTo, setCountedTo] = useState(0);
  const [feedbackText, setFeedbackText] = useState("Touch each item to count it, then choose the number.");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { playHitSound, playMissSound, playFanfare } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  useEffect(() => {
    rec.mark();
  }, [answer, rec]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high", delayMs: 7000 });

  useEffect(() => {
    speak(`Count the ${theme}. Touch each one to count with me.`);
  }, [theme]);

  const handleCountTap = (position: number) => {
    if (selected != null || position > countedTo) return;
    onInteraction();
    setCountedTo(position);
    playHitSound(position);
    if (NUMBER_WORDS[position]) speak(NUMBER_WORDS[position]);
  };

  const handleSelect = (value: number) => {
    if (selected != null) return;
    onInteraction();
    setSelected(value);
    const isCorrect = value === answer;
    rec.trial({
      stimulus: `${theme}:${answer}`,
      correct: isCorrect,
      positionIndex: options.indexOf(value),
      choiceCount: options.length,
      options: options.map(String),
      prompted: !isCorrect,
      promptLevel: isCorrect ? "independent" : "model",
    });
    if (isCorrect) {
      playHitSound(3);
      fireBurst(50, 40, mark);
    } else {
      wobble();
      playMissSound();
    }
    speak(isCorrect ? `Yes! There are ${NUMBER_WORDS[answer]} ${theme}.` : `There are ${NUMBER_WORDS[answer]} ${theme}. Let's count them together.`);
    setFeedbackText(isCorrect ? `Yes. There are ${answer} ${theme}.` : `There are ${answer} ${theme}. Count one-by-one and notice the last number.`);
    window.setTimeout(() => {
      if (isCorrect) playFanfare();
      onComplete(isCorrect ? 100 : 70, undefined, withTrace(rec, buildCompletionMetrics({
        trials: 1,
        correctTrials: 1,
        errors: 0,
        promptsNeeded: isCorrect ? 0 : 1,
        masteryThreshold: masteryForSupport(supportLevel),
        attemptsBySkill: { counting: 1, "one-to-one-correspondence": countedTo },
        observations: isCorrect
          ? [`Counted ${answer} ${theme} independently (tapped along ${countedTo}).`]
          : [`Answered with one guiding prompt; correct group of ${answer} shown and counted aloud.`],
      })));
    }, 500);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="mb-4 text-sm text-muted-foreground">Count the {theme} on screen</p>
      <div ref={boardRef} className="bg-muted rounded-2xl p-6 mb-4">
        <p className="mb-4 rounded-xl bg-card/70 p-3 text-sm text-muted-foreground">{feedbackText}</p>
        <motion.div animate={controls} className="relative mb-6 flex justify-center flex-wrap gap-3">
          {Array.from({ length: answer }, (_, index) => {
            const position = index + 1;
            const isCounted = position <= countedTo;
            return (
              <div
                key={index}
                onClick={() => handleCountTap(position)}
                className={`grid h-14 w-14 cursor-pointer place-items-center rounded-2xl bg-card shadow-sm transition-all ${
                  isCounted ? "scale-110 ring-4 ring-emerald-300" : "hover:scale-105"
                }`}
              >
                <span aria-hidden="true" className={`text-3xl transition-transform ${isCounted ? "-translate-y-1" : ""}`}>{mark}</span>
                {isCounted ? <span className="absolute -bottom-2 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] font-black text-white">{position}</span> : null}
              </div>
            );
          })}
          <BurstLayer bursts={bursts} />
        </motion.div>
        <p className="mb-3 text-xs text-muted-foreground">Counted so far: {countedTo}</p>
        <div className="relative grid grid-cols-2 gap-3">
          {options.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`border-2 rounded-xl p-4 font-bold text-foreground touch-target hover:border-primary transition-colors ${
                hintVisible && value === answer
                  ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60"
                  : selected === value
                    ? "border-secondary bg-secondary/20"
                    : "bg-card border-border"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
