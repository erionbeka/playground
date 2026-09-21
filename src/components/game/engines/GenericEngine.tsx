import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { speak } from "@/lib/speech";
import { BurstLayer, ComboBadge, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

const WORD_PACKS: Record<string, { word: string; emoji: string }[]> = {
  animals: [
    { word: "dog", emoji: "🐶" }, { word: "cat", emoji: "🐱" }, { word: "rabbit", emoji: "🐰" },
    { word: "bird", emoji: "🐦" }, { word: "bear", emoji: "🐻" }, { word: "fish", emoji: "🐟" },
  ],
  colors: [
    { word: "red", emoji: "🔴" }, { word: "blue", emoji: "🔵" }, { word: "green", emoji: "🟢" },
    { word: "yellow", emoji: "🟡" }, { word: "purple", emoji: "🟣" }, { word: "orange", emoji: "🟠" },
  ],
  food: [
    { word: "apple", emoji: "🍎" }, { word: "banana", emoji: "🍌" }, { word: "grapes", emoji: "🍇" },
    { word: "carrot", emoji: "🥕" }, { word: "cheese", emoji: "🧀" }, { word: "bread", emoji: "🍞" },
  ],
  actions: [
    { word: "run", emoji: "🏃" }, { word: "jump", emoji: "🤸" }, { word: "clap", emoji: "👏" },
    { word: "sleep", emoji: "😴" }, { word: "walk", emoji: "🚶" }, { word: "drink", emoji: "🥤" },
  ],
  body: [
    { word: "hand", emoji: "✋" }, { word: "foot", emoji: "🦶" }, { word: "eye", emoji: "👁️" },
    { word: "ear", emoji: "👂" }, { word: "nose", emoji: "👃" }, { word: "mouth", emoji: "👄" },
  ],
  feelings: [
    { word: "happy", emoji: "😊" }, { word: "sad", emoji: "😢" }, { word: "angry", emoji: "😠" },
    { word: "surprised", emoji: "😲" }, { word: "tired", emoji: "😴" }, { word: "excited", emoji: "🤩" },
  ],
  vehicles: [
    { word: "car", emoji: "🚗" }, { word: "bus", emoji: "🚌" }, { word: "train", emoji: "🚂" },
    { word: "bike", emoji: "🚲" }, { word: "boat", emoji: "⛵" }, { word: "plane", emoji: "✈️" },
  ],
};

function packForTheme(theme: string): { word: string; emoji: string }[] {
  const key = theme.toLowerCase();
  if (key.includes("animal")) return WORD_PACKS.animals;
  if (key.includes("color")) return WORD_PACKS.colors;
  if (key.includes("food") || key.includes("eating") || key.includes("meal")) return WORD_PACKS.food;
  if (key.includes("action") || key.includes("verb") || key.includes("movement")) return WORD_PACKS.actions;
  if (key.includes("body") || key.includes("part")) return WORD_PACKS.body;
  if (key.includes("feeling") || key.includes("emotion")) return WORD_PACKS.feelings;
  if (key.includes("vehicle") || key.includes("transport")) return WORD_PACKS.vehicles;
  return [...WORD_PACKS.animals, ...WORD_PACKS.food, ...WORD_PACKS.vehicles];
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

interface Round {
  word: string;
  answerEmoji: string;
  options: { word: string; emoji: string }[];
}

export default function GenericEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel } = getAdaptiveGameConfig(game);
  const topic = useMemo(() => titleCase(String(game.config.theme || game.category || "listening")), [game.category, game.config.theme]);
  const totalRounds = 4;
  const optionCount = supportLevel === "high" ? 3 : game.difficulty === "hard" ? 4 : 3;

  const rounds = useMemo<Round[]>(() => {
    const pack = packForTheme(topic);
    const picked = shuffleItems(pack).slice(0, totalRounds);
    return picked.map((entry) => {
      const decoyPool = shuffleItems(
        pack.filter((candidate) => candidate.word !== entry.word)
      );
      return {
        word: entry.word,
        answerEmoji: entry.emoji,
        options: shuffleItems([
          { word: entry.word, emoji: entry.emoji },
          ...decoyPool.slice(0, optionCount - 1),
        ]),
      };
    });
  }, [optionCount, topic]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Listen closely, then point to the picture.");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef(0);
  const { playHitSound, playMissSound } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const round = rounds[roundIndex];
  const roundWrongRef = useRef(0);

  useEffect(() => {
    if (!round) return;
    setFeedback("Listen closely, then point to the picture.");
    speak(`Find the ${round.word}.`);
    roundWrongRef.current = 0;
    rec.mark();
  }, [rec, round]);

  if (!round) return null;

  const handlePick = (word: string, emoji: string) => {
    onInteraction();
    if (word === round.word) {
      rec.trial({
        stimulus: round.word,
        correct: true,
        positionIndex: round.options.findIndex((option) => option.word === word),
        choiceCount: round.options.length,
        prompted: roundWrongRef.current > 0,
      });
      comboRef.current += 1;
      setCombo(comboRef.current);
      playHitSound(comboRef.current);
      fireBurst(50, 45, emoji);
      speak(`Yes! That is the ${round.word}.`);
      const nextRound = roundIndex + 1;
      if (nextRound >= rounds.length) {
        const score = Math.max(50, 100 - mistakes * 12);
        onComplete(score, undefined, withTrace(rec, buildCompletionMetrics({
          trials: rounds.length + mistakes,
          correctTrials: rounds.length,
          errors: mistakes,
          masteryThreshold: masteryForSupport(supportLevel),
          attemptsBySkill: { listening: rounds.length + mistakes, vocabulary: rounds.length },
          observations: [`Identified ${rounds.length} spoken words with ${mistakes} misses for ${topic}.`],
        })));
        return;
      }
      setRoundIndex(nextRound);
      return;
    }

    roundWrongRef.current += 1;
    rec.trial({
      stimulus: round.word,
      correct: false,
      positionIndex: round.options.findIndex((option) => option.word === word),
      choiceCount: round.options.length,
      prompted: false,
    });
    comboRef.current = 0;
    setCombo(0);
    setMistakes((value) => value + 1);
    wobble();
    playMissSound();
    setFeedback(`That is the ${word}. Listen once more.`);
    speak(`That is the ${word}. Find the ${round.word}.`);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">Listen & choose · {topic}</p>
      <p className="mb-2 text-sm text-muted-foreground">Round {roundIndex + 1} of {rounds.length}</p>

      <div ref={boardRef} className="relative mb-4 rounded-2xl bg-muted p-6">
        <ComboBadge combo={combo} />
        <motion.button
          type="button"
          onClick={() => speak(`Find the ${round.word}.`)}
          whileTap={{ scale: 0.95 }}
          className="mx-auto mb-3 flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm"
        >
          <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
          Play the word again
        </motion.button>
        <p className="mb-5 text-sm font-semibold text-muted-foreground">{feedback} <span className="font-black text-foreground">Find: “{round.word}”</span></p>

        <motion.div animate={controls} className="relative grid grid-cols-3 gap-3">
          {round.options.map((option) => (
            <motion.button
              key={option.word}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => handlePick(option.word, option.emoji)}
              className={`touch-target aspect-square rounded-2xl border-2 bg-card p-2 text-center shadow-sm transition-colors hover:border-primary ${
                option.word === round.word ? "border-primary/40" : "border-border"
              }`}
              aria-label={`${option.word} picture`}
            >
              <span aria-hidden="true" className="grid h-full w-full place-items-center text-5xl drop-shadow-sm">{option.emoji}</span>
            </motion.button>
          ))}
          <BurstLayer bursts={bursts} />
        </motion.div>

        <p className="mt-4 text-xs text-muted-foreground">Tap a picture when you know it. No rush.</p>
      </div>

      <div className="h-3 w-full rounded-full bg-muted">
        <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${((roundIndex + 1) / rounds.length) * 100}%` }} />
      </div>
    </div>
  );
}
