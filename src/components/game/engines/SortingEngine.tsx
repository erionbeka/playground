import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { speak } from "@/lib/speech";
import { useHintLadder } from "@/hooks/useHintLadder";
import TokenStrip from "../TokenStrip";
import { BurstLayer, ComboBadge, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
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
  sky: ["🕊️", "✈️", "🎈", "☁️"],
  sweets: ["🍬", "🍩", "🍫", "🍰"],
  pets: ["🐕", "🐈", "🐇", "🐹"],
  summer: ["🏖️", "🍉", "🍦", "⛱️"],
  winter: ["❄️", "⛄", "🧤", "🎄"],
  dry: ["🌵", "📄", "🧦", "🪨"],
  toyset: ["🧸", "⚽", "🎈", "🎲"],
};

const categoryHints: Record<string, string> = {
  farm: "farm animals and farm tools",
  city: "roads, buildings, and traffic",
  hot: "warm or heat-related things",
  cold: "chilly, frozen, or winter things",
  big: "larger objects",
  small: "smaller objects",
  living: "things that grow or breathe",
  "non-living": "things that do not grow",
  day: "daytime routines",
  night: "nighttime routines",
  healthy: "body-helping choices",
  unhealthy: "sometimes-food choices",
  land: "things found on land",
  water: "things found in water",
  loud: "big sounds",
  quiet: "soft or no sounds",
  soft: "gentle textures",
  hard: "firm textures",
  fast: "quick movement",
  slow: "slow movement",
  indoor: "inside places",
  outdoor: "outside places",
  happy: "happy feelings",
  sad: "sad feelings",
  sink: "things that go down in water",
  float: "things that stay on top of water",
  wild: "animals that live in nature",
  domestic: "animals that often live with people",
  fruits: "fruit foods",
  vegetables: "vegetable foods",
  sky: "things that fly or float up in the sky",
  sweets: "sometimes sugary treats",
  pets: "animals that live in our homes",
  summer: "hot sunny day things",
  winter: "cold snowy day things",
  dry: "things that stay dry, no water",
  toyset: "play things for fun",
};

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

type SortItem = { emoji: string; categoryIndex: number };

function createItems(normalizedCategories: string[], perCategory: number) {
  return shuffleItems(
    normalizedCategories.flatMap((category, categoryIndex) =>
      (itemMap[category] || ["⭐", "🎈", "🧩", "🎨"]).slice(0, perCategory).map((emoji) => ({ emoji, categoryIndex }))
    )
  );
}

export default function SortingEngine({ game, onInteraction, onComplete }: Props) {
  const categories = useMemo(() => (game.config.categories as string[] | undefined) || ["Group A", "Group B"], [game.config.categories]);
  const { supportLevel, personalized } = getAdaptiveGameConfig(game);
  const normalized = useMemo(() => categories.map(normalizeCategory), [categories]);
  const categoriesKey = normalized.join("|");
  const configuredItems = Number(game.config.itemsPerCategory || 0);
  const itemsPerCategory = configuredItems > 0 ? Math.min(4, configuredItems) : personalized && supportLevel === "high" ? 2 : 4;
  const [items, setItems] = useState(() => createItems(normalized, itemsPerCategory));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Look at the item, then choose the group it belongs to.");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const binRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const comboRef = useRef(0);
  const { playHitSound, playMissSound, playFanfare } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high", delayMs: 6000, resetKey: index });

  useEffect(() => {
    setItems(createItems(normalized, itemsPerCategory));
    setIndex(0);
    setCorrect(0);
    setCombo(0);
    comboRef.current = 0;
    setFeedback("Look at the item, then choose the group it belongs to.");
    speak(`Sort each picture. Choose between ${categories.join(" or ")}.`);
    rec.mark();
  }, [categories, categoriesKey, itemsPerCategory, normalized, rec]);

  const current = items[index];

  useEffect(() => {
    rec.mark();
  }, [index, rec]);

  const advance = (choice: number) => {
    if (!current) return;
    onInteraction();
    const isCorrect = choice === current.categoryIndex;
    rec.trial({
      stimulus: current.emoji,
      correct: isCorrect,
      positionIndex: choice,
      choiceCount: categories.length,
      prompted: false,
    });
    const expectedLabel = categories[current.categoryIndex];
    const expectedKey = normalized[current.categoryIndex];
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextIndex = index + 1;

    if (isCorrect) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      playHitSound(comboRef.current);
      fireBurst(50, 42, current.emoji);
    } else {
      comboRef.current = 0;
      setCombo(0);
      wobble();
      playMissSound();
    }
    speak(isCorrect ? `Yes! It belongs with ${expectedLabel}.` : `Good try. This belongs with ${expectedLabel}.`);
    setFeedback(isCorrect ? `Yes. That belongs with ${expectedLabel}: ${categoryHints[expectedKey] || "it matches the rule"}.` : `Good try. This belongs with ${expectedLabel}: ${categoryHints[expectedKey] || "that is the matching rule"}.`);

    if (nextIndex >= items.length) {
playFanfare();
            onComplete(Math.round((nextCorrect / items.length) * 100), undefined, withTrace(rec, buildCompletionMetrics({
        trials: items.length,
        correctTrials: nextCorrect,
        errors: items.length - nextCorrect,
        masteryThreshold: masteryForSupport(supportLevel),
        attemptsBySkill: { categorization: items.length, "rule-use": nextCorrect },
        observations: [`Sorted ${items.length} items into ${categories.length} groups.`],
      })));
      return;
    }

    setCorrect(nextCorrect);
    setIndex(nextIndex);
  };

  if (!current) return null;

  return (
    <div className="max-w-lg mx-auto text-center">
      <div ref={boardRef} className="bg-muted rounded-2xl p-8 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Sort item {index + 1} of {items.length}</span>
          <TokenStrip earned={index} total={items.length} token="📦" />
        </div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Drag the picture to its group, or tap a group</p>
        <motion.div
          key={`${index}-${current.emoji}`}
          drag
          dragSnapToOrigin
          whileDrag={{ scale: 1.15, zIndex: 40 }}
          onDragEnd={(_, info) => {
            for (let choice = 0; choice < categories.length; choice += 1) {
              const bin = binRefs.current[choice];
              if (!bin) continue;
              const rect = bin.getBoundingClientRect();
              if (
                info.point.x >= rect.left - 16 &&
                info.point.x <= rect.right + 16 &&
                info.point.y >= rect.top - 16 &&
                info.point.y <= rect.bottom + 16
              ) {
                advance(choice);
                return;
              }
            }
          }}
          className="mx-auto mb-5 w-fit cursor-grab active:cursor-grabbing"
        >
          <motion.div animate={controls} className="text-7xl drop-shadow-md" aria-hidden="true">
            {current.emoji}
          </motion.div>
        </motion.div>
        <p className="mb-4 rounded-xl bg-card/70 p-3 text-sm text-muted-foreground">{feedback}</p>
        <div className={`relative grid gap-3 ${categories.length > 2 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
          <ComboBadge combo={combo} />
          <BurstLayer bursts={bursts} />
          {categories.map((label, categoryIndex) => (
            <button
              key={label}
              ref={(node) => {
                binRefs.current[categoryIndex] = node;
              }}
              onClick={() => advance(categoryIndex)}
              className={`bg-card border-2 rounded-xl p-4 font-semibold text-foreground touch-target hover:border-primary transition-colors ${
                hintVisible && categoryIndex === current.categoryIndex ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60" : "border-border"
              }`}
            >
              <span className="block">{label}</span>
              <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{categoryHints[normalized[categoryIndex]] || ""}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
