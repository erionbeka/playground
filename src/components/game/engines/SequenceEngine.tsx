import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { emojiFor, LetterMedal } from "@/lib/gameAssets";
import { speak } from "@/lib/speech";
import { useHintLadder } from "@/hooks/useHintLadder";
import TokenStrip from "../TokenStrip";
import { BurstLayer, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

type SequenceStep = {
  key: string;
  label: string;
  clue: string;
};

const makeSteps = (theme: string, entries: [string, string][]): SequenceStep[] =>
  entries.map(([label, clue], index) => ({ key: `${theme}-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`, label, clue }));

const themeSymbols: Record<string, SequenceStep[]> = {
  colors: makeSteps("colors", [["Red", "start color"], ["Blue", "second color"], ["Yellow", "third color"], ["Green", "fourth color"]]),
  shapes: makeSteps("shapes", [["Triangle", "3 sides"], ["Square", "4 sides"], ["Circle", "round"], ["Star", "points"]]),
  sounds: makeSteps("sounds", [["Clap", "hands"], ["Tap", "table"], ["Hum", "voice"], ["Ring", "bell"]]),
  animals: makeSteps("animals", [["Dog", "bark"], ["Cat", "meow"], ["Rabbit", "hop"], ["Frog", "jump"]]),
  numbers: makeSteps("numbers", [["One", "first"], ["Two", "second"], ["Three", "third"], ["Four", "fourth"]]),
  patterns: makeSteps("patterns", [["Sun", "bright"], ["Moon", "night"], ["Sun", "repeat"], ["Moon", "repeat"]]),
  "dance moves": makeSteps("dance", [["Step", "feet"], ["Clap", "hands"], ["Turn", "body"], ["Reach", "arms"]]),
  "musical notes": makeSteps("music", [["Note", "sing"], ["Drum", "beat"], ["Bell", "ring"], ["Rest", "quiet"]]),
  emotions: makeSteps("emotions", [["Happy", "smile"], ["Surprised", "wide eyes"], ["Sad", "down face"], ["Calm", "slow breath"]]),
  actions: makeSteps("actions", [["Run", "fast feet"], ["Jump", "up"], ["Roll", "turn"], ["Walk", "steady"]]),
  vehicles: makeSteps("vehicles", [["Car", "road"], ["Bike", "pedal"], ["Train", "track"], ["Rocket", "sky"]]),
  foods: makeSteps("foods", [["Apple", "fruit"], ["Banana", "fruit"], ["Berry", "small"], ["Carrot", "vegetable"]]),
  seasons: makeSteps("seasons", [["Spring", "flowers"], ["Summer", "sun"], ["Autumn", "leaves"], ["Winter", "snow"]]),
  "daily routine": makeSteps("daily", [["Wake", "open eyes"], ["Wash", "clean"], ["Dress", "clothes"], ["Eat", "meal"]]),
  "story order": makeSteps("story", [["Start", "who and where"], ["Problem", "what changed"], ["Try", "action"], ["End", "solution"]]),
  "morning routine": makeSteps("morning", [["Wake", "open eyes"], ["Bathroom", "wash"], ["Dress", "clothes"], ["Breakfast", "eat"]]),
  "getting dressed": makeSteps("dressed", [["Shirt", "top"], ["Pants", "bottom"], ["Socks", "feet"], ["Shoes", "outside"]]),
  "brushing teeth": makeSteps("teeth", [["Brush", "tool"], ["Paste", "tiny bit"], ["Brush Teeth", "circles"], ["Rinse", "finish"]]),
  "eating meals": makeSteps("meals", [["Sit", "chair"], ["Look", "plate"], ["Bite", "small"], ["Clean", "finish"]]),
  "washing hands": makeSteps("hands", [["Water", "turn on"], ["Soap", "rub"], ["Rinse", "water"], ["Dry", "towel"]]),
  "bedtime steps": makeSteps("bedtime", [["Pajamas", "clothes"], ["Teeth", "brush"], ["Story", "quiet"], ["Sleep", "rest"]]),
  "packing a bag": makeSteps("bag", [["Bag", "open"], ["Book", "pack"], ["Snack", "pack"], ["Zip", "close"]]),
  "setting the table": makeSteps("table", [["Plate", "place"], ["Cup", "place"], ["Fork", "place"], ["Napkin", "finish"]]),
  "tidying up": makeSteps("tidy", [["Look", "find items"], ["Pick Up", "hands"], ["Sort", "home spot"], ["Check", "all done"]]),
  "going shopping": makeSteps("shop", [["List", "plan"], ["Cart", "push"], ["Choose", "items"], ["Pay", "finish"]]),
  froebel: makeSteps("froebel", [["Sphere", "round and soft"], ["Cube", "steady sides"], ["Cylinder", "rolls and stacks"], ["Pyramid", "point to the sky"]]),
  "crossing the street": makeSteps("street", [["Stop", "at the curb"], ["Look", "left, then right"], ["Listen", "for cars"], ["Hold hands", "with a grown-up"], ["Walk", "straight across"]]),
  "school morning": makeSteps("morning2", [["Wake up", "stretch big"], ["Dress", "pick clothes"], ["Breakfast", "fuel up"], ["Brush teeth", "sparkle"], ["Backpack", "pack and go"]]),
  "cleaning a spill": makeSteps("spill", [["See", "notice the spill"], ["Towel", "grab one"], ["Wipe", "press down"], ["Check", "all dry?"], ["Bin", "towel in"]]),
  "answering the phone": makeSteps("phone", [["Ring", "it rings"], ["Breathe", "stay calm"], ["Hello", "say hello"], ["Talk", "or get a grown-up"], ["Bye", "hang up gently"]]),
  default: makeSteps("pattern", [["Red", "start"], ["Blue", "next"], ["Yellow", "next"], ["Green", "finish"]]),
};

function StepVisual({ step }: { step: SequenceStep }) {
  const emoji = emojiFor(step.label);
  return (
    <>
      {emoji ? (
        <span aria-hidden="true" className="block text-3xl leading-none">{emoji}</span>
      ) : (
        <LetterMedal label={step.label} className="mx-auto h-9 w-9 text-lg" />
      )}
      <span className="block text-base font-black text-foreground">{step.label}</span>
      <span className="block text-xs text-muted-foreground">{step.clue}</span>
    </>
  );
}

const STEP_FREQS = [523.25, 659.25, 783.99, 1046.5];

export default function SequenceEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel } = getAdaptiveGameConfig(game);
  const length = Number(game.config.length || game.config.steps || 4);
  const theme = String(game.config.theme || "default");
  const base = themeSymbols[theme] || themeSymbols.default;
  const sequence = useMemo(() => Array.from({ length }, (_, index) => base[index % base.length]), [base, length]);
  const [phase, setPhase] = useState<"watch" | "repeat">("watch");
  const [progress, setProgress] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [feedback, setFeedback] = useState("Watch the order from left to right.");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { playTone, playHitSound, playMissSound, playFanfare } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  useEffect(() => {
    setPhase("watch");
    setProgress(0);
    setMistakes(0);
    setFlashIndex(0);
    setFeedback("Watch the order from left to right.");
    speak(`Watch the ${theme} order.`);
  }, [theme, length]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high" && phase === "repeat" && mistakes >= 1, delayMs: 4000, resetKey: progress });

  useEffect(() => {
    if (phase !== "watch") return;
    if (flashIndex >= sequence.length) {
      const timer = window.setTimeout(() => {
        setPhase("repeat");
        setFeedback("Now repeat the same order. One step at a time is enough.");
        speak("Now repeat the same order.");
        rec.mark();
      }, 500);
      return () => window.clearTimeout(timer);
    }

    speak(sequence[flashIndex]?.label || "");
    playTone({ frequency: STEP_FREQS[flashIndex % STEP_FREQS.length], duration: 0.16, volume: 0.045, type: "triangle" });
    const timer = window.setTimeout(() => {
      setFlashIndex((value) => value + 1);
    }, supportLevel === "high" ? 850 : 700);

    return () => window.clearTimeout(timer);
  }, [flashIndex, phase, playTone, rec, sequence, supportLevel]);

  const handlePick = (step: SequenceStep) => {
    if (phase !== "repeat") return;
    onInteraction();

    const expected = sequence[progress];
    const isCorrectStep = step.key === expected.key;
    rec.trial({
      stimulus: expected.label,
      correct: isCorrectStep,
      positionIndex: base.findIndex((entry) => entry.key === step.key),
      choiceCount: base.length,
      prompted: false,
    });
    if (isCorrectStep) {
      playTone({ frequency: STEP_FREQS[progress % STEP_FREQS.length], duration: 0.16, volume: 0.05, type: "triangle" });
      playHitSound(progress + 1);
      const next = progress + 1;
      setFeedback(next >= sequence.length ? "Pattern complete." : `Correct. Next comes step ${next + 1}.`);
      speak(next >= sequence.length ? "Pattern complete!" : "Correct!");
      if (next >= sequence.length) {
        fireBurst(50, 40, "🌟");
        const score = Math.max(40, 100 - mistakes * 15);
playFanfare();
                onComplete(score, undefined, withTrace(rec, buildCompletionMetrics({
          trials: sequence.length + mistakes,
          correctTrials: sequence.length,
          errors: mistakes,
          masteryThreshold: masteryForSupport(supportLevel),
          promptsNeeded: mistakes,
          attemptsBySkill: { sequencing: sequence.length + mistakes, "error-correction": mistakes },
          observations: [`Repeated ${sequence.length} ordered steps with ${mistakes} error${mistakes === 1 ? "" : "s"}.`],
        })));
        return;
      }
      setProgress(next);
      return;
    }

    playMissSound();
    setMistakes((value) => value + 1);
    wobble();
    setFeedback(`Not yet. The next step is ${expected.label}. Try the order again calmly.`);
    speak(`Not yet. Next is ${expected.label}.`);
    setProgress(supportLevel === "high" ? Math.max(0, progress - 1) : 0);
  };

  const hintedKey = hintVisible && sequence[progress] ? sequence[progress].key : "";

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">Pattern and routine sequencing</p>
      <div ref={boardRef} className="rounded-2xl bg-muted p-6 mb-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {phase === "watch" ? "Watch the pattern" : `Repeat the pattern: ${progress}/${sequence.length}`}
          </span>
          <TokenStrip earned={progress} total={sequence.length} token="🎵" />
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{feedback}</p>
        <div className="mb-6 flex min-h-20 flex-wrap justify-center gap-3">
          {sequence.map((step, index) => (
            <motion.div
              key={`${step.key}-${index}`}
              animate={phase === "watch" && index === flashIndex ? { scale: 1.08, opacity: 1 } : { scale: 1, opacity: phase === "watch" && index > flashIndex ? 0.3 : 0.85 }}
              className="min-w-20 rounded-2xl border-2 border-primary/25 bg-card px-3 py-2 shadow-sm"
            >
              <span className="block text-lg font-black text-foreground">{phase === "watch" || index < progress || supportLevel === "high" ? step.label : "..."}</span>
              <span className="block text-xs text-muted-foreground">{phase === "watch" || index < progress || supportLevel === "high" ? step.clue : "hidden"}</span>
            </motion.div>
          ))}
        </div>

        {phase === "repeat" && (
          <motion.div animate={controls} className="relative">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {base.map((step) => (
                <button
                  key={step.key}
                  onClick={() => handlePick(step)}
                  className={`touch-target rounded-xl border-2 bg-card p-3 text-left transition-colors hover:border-primary ${
                    step.key === hintedKey ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60" : "border-border"
                  }`}
                >
                  <StepVisual step={step} />
                </button>
              ))}
            </div>
            <BurstLayer bursts={bursts} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
