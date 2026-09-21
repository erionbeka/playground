import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { emojiFor, LetterMedal } from "@/lib/gameAssets";
import { speak } from "@/lib/speech";
import { useHintLadder } from "@/hooks/useHintLadder";
import TokenStrip from "../TokenStrip";
import { BurstLayer, ComboBadge, pointFromEvent, useBursts, useWobble } from "../Juice";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

type MatchVariant = "flip" | "open" | "shadow";

type MatchItem = {
  key: string;
  label: string;
  cue: string;
};

interface Card {
  id: number;
  item: MatchItem;
  silhouette: boolean;
  flipped: boolean;
  matched: boolean;
}

const makeItems = (theme: string, labels: string[]): MatchItem[] =>
  labels.map((label) => ({
    key: `${theme}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    cue: `${label} belongs with ${theme}`,
  }));

const itemSets: Record<string, MatchItem[]> = {
  animals: makeItems("animals", ["Dog", "Cat", "Rabbit", "Frog", "Fox", "Bear", "Koala", "Lion"]),
  food: makeItems("food", ["Apple", "Banana", "Pizza", "Ice Cream", "Cake", "Donut", "Carrot", "Grapes"]),
  vehicles: makeItems("vehicles", ["Car", "Bus", "Rocket", "Plane", "Train", "Motorbike", "Bike", "Boat"]),
  emotions: makeItems("emotions", ["Happy", "Sad", "Surprised", "Angry", "Loved", "Tired", "Excited", "Laughing"]),
  nature: makeItems("nature", ["Flower", "Sunflower", "Tree", "Leaf", "Rainbow", "Star", "Moon", "Sun"]),
  clothes: makeItems("clothes", ["Shirt", "Pants", "Socks", "Coat", "Scarf", "Dress", "Shoes", "Hat"]),
  tools: makeItems("tools", ["Hammer", "Brush", "Wrench", "Ruler", "Spoon", "Pencil", "Scissors", "Tape"]),
  music: makeItems("music", ["Guitar", "Piano", "Violin", "Drum", "Voice", "Headphones", "Note", "Bell"]),
  shapes: makeItems("shapes", ["Circle", "Square", "Triangle", "Star", "Diamond", "Oval", "Rectangle", "Heart"]),
  letters: makeItems("letters", ["A", "B", "C", "D", "E", "F", "G", "H"]),
  numbers: makeItems("numbers", ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"]),
  colors: makeItems("colors", ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Black", "White"]),
  textures: makeItems("textures", ["Soft", "Rough", "Smooth", "Bumpy", "Sticky", "Fuzzy", "Hard", "Wet"]),
  seasons: makeItems("seasons", ["Spring", "Summer", "Autumn", "Winter", "Rain", "Snow", "Wind", "Sun"]),
  "body parts": makeItems("body parts", ["Hand", "Foot", "Eye", "Ear", "Nose", "Mouth", "Knee", "Arm"]),
  "sea life": makeItems("sea life", ["Whale", "Crab", "Octopus", "Shark", "Dolphin", "Turtle", "Fish", "Starfish"]),
  bugs: makeItems("bugs", ["Bee", "Butterfly", "Ant", "Caterpillar", "Snail", "Ladybug", "Spider", "Grasshopper"]),
  weather: makeItems("weather", ["Sun", "Rain", "Storm", "Rainbow", "Snow", "Tornado", "Fog", "Lightning"]),
  space: makeItems("space", ["Rocket", "Planet", "Earth", "Star", "Moon", "Comet", "Astronaut", "Telescope"]),
  sports: makeItems("sports", ["Soccer", "Basketball", "Football", "Tennis", "Volleyball", "Pingpong", "Golf", "Archery"]),
  school: makeItems("school", ["Pencil", "Book", "Backpack", "Ruler", "Crayon", "Notebook", "Microscope", "Schoolhouse"]),
  house: makeItems("house", ["Couch", "Bed", "Shower", "Stove", "Window", "Door", "Chair", "Table"]),
  garden: makeItems("garden", ["Flower", "Sunflower", "Bee", "Leaf", "Tulip", "Snail", "Tree", "Pottedplant"]),
  dinosaur: makeItems("dinosaur", ["Dinosaur", "T-Rex", "Egg", "Footprint", "Volcano", "Fern", "Bone", "Meteor"]),
  farm: makeItems("farm", ["Cow", "Pig", "Horse", "Chicken", "Sheep", "Tractor", "Hay", "Corn"]),
  "fairy tale": makeItems("fairy tale", ["Dragon", "Fairy", "Castle", "Crown", "Wand", "Knight", "Frog", "Star"]),
  "winter clothes": makeItems("winter clothes", ["Mittens", "Scarf", "Coat", "Boots", "Hat", "Socks", "Sweater", "Snowman"]),
  circus: makeItems("circus", ["Tent", "Juggler", "Ticket", "Popcorn", "Clown", "Balloon", "Drum", "Star"]),
  bathroom: makeItems("bathroom", ["Bathtub", "Soap", "Toothbrush", "Shower", "Sponge", "Bucket", "Toilet", "Towel"]),
  kitchen: makeItems("kitchen", ["Stove", "Spoon", "Plate", "Salt", "Coffee", "Teapot", "Pot", "Cup"]),
  fruits: makeItems("fruits", ["Pineapple", "Cherry", "Lemon", "Apple", "Banana", "Grapes", "Strawberry", "Orange"]),
  vegetables: makeItems("vegetables", ["Carrot", "Broccoli", "Corn", "Tomato", "Lettuce", "Chili", "Garlic", "Onion"]),
  zoo: makeItems("zoo", ["Elephant", "Giraffe", "Lion", "Zebra", "Monkey", "Bear", "Penguin", "Owl"]),
  birds: makeItems("birds", ["Duck", "Parrot", "Penguin", "Eagle", "Swan", "Chick", "Bird", "Owl"]),
  pets: makeItems("pets", ["Dog", "Cat", "Rabbit", "Hamster", "Fish", "Bird", "Mouse", "Turtle"]),
  default: makeItems("matching", ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Black", "White"]),
};

function resolveVariant(game: GameConfig): MatchVariant {
  const configured = String(game.config.variant || "") as MatchVariant;
  if (["flip", "open", "shadow"].includes(configured)) return configured;
  const difficulty = (game.config.assignedDifficulty as string | undefined) || game.difficulty;
  if (difficulty === "easy") return "open";
  return "flip";
}

export default function MatchingEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel } = getAdaptiveGameConfig(game);
  const pairs = (game.config.pairs as number) || 4;
  const theme = String(game.config.theme || "default");
  const items = itemSets[theme] || itemSets.default;
  const variant = useMemo(() => resolveVariant(game), [game]);
  const startOpen = variant !== "flip";

  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState(`Look for two cards with the same ${theme} word.`);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high", delayMs: 6000, resetKey: moves });

  useEffect(() => {
    const picked = items.slice(0, pairs);
    const seenKeys = new Set<string>();
    const deck = shuffleItems([...picked, ...picked]).map((item, index) => {
      const silhouette = variant === "shadow" && !seenKeys.has(item.key);
      seenKeys.add(item.key);
      return { id: index, item, silhouette, flipped: startOpen, matched: false };
    });

    setCards(deck);
    setSelected([]);
    setMoves(0);
    setMatchedCount(0);
    setErrors(0);
    setCombo(0);
    setResolving(false);
    setFeedback(`Look, say the word, then find the matching ${theme} pair.`);
    rec.mark();
  }, [items, pairs, theme, variant, startOpen, rec]);

  useEffect(() => {
    speak(`Find the matching pairs. Theme: ${theme}.`);
  }, [theme]);

  const hintKeys = useMemo(() => {
    if (!hintVisible || resolving) return new Set<string>();
    const unmatched = cards.find((card) => !card.matched);
    return unmatched ? new Set([unmatched.item.key]) : new Set<string>();
  }, [cards, hintVisible, resolving]);

  const handleTap = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (resolving) return;

    const card = cards[index];
    if (!card || card.matched || selected.includes(index)) return;

    onInteraction();
    speak(card.item.label);
    const nextCards = cards.map((entry, entryIndex) => (entryIndex === index ? { ...entry, flipped: true } : entry));
    const nextSelected = [...selected, index];

    setCards(nextCards);
    setSelected(nextSelected);
    setFeedback(`You found ${card.item.label}. Now look for its twin.`);

    if (nextSelected.length !== 2) return;

    setResolving(true);
    setMoves((currentMoves) => currentMoves + 1);

    const [firstIndex, secondIndex] = nextSelected;
    const isPairMatch = nextCards[firstIndex].item.key === nextCards[secondIndex].item.key;
    rec.trial({
      stimulus: `${nextCards[firstIndex].item.label}+${nextCards[secondIndex].item.label}`,
      correct: isPairMatch,
      positionIndex: secondIndex,
      choiceCount: cards.length,
      prompted: hintVisible && isPairMatch,
      promptLevel: hintVisible ? "visual" : "independent",
    });
    if (isPairMatch) {
      const label = nextCards[firstIndex].item.label;
      setCombo((currentCombo) => currentCombo + 1);
      speak(`${label} and ${label} match.`);
      const point = pointFromEvent(event, boardRef.current);
      fireBurst(point.x, point.y, emojiFor(label) || "✨");
      setFeedback(`${nextCards[firstIndex].item.label} and ${nextCards[secondIndex].item.label} match. Same word, same idea.`);
      window.setTimeout(() => {
        setCards((currentCards) =>
          currentCards.map((entry, entryIndex) =>
            entryIndex === firstIndex || entryIndex === secondIndex ? { ...entry, matched: true } : entry
          )
        );
        setMatchedCount((currentMatchedCount) => {
          const updatedMatchedCount = currentMatchedCount + 1;
          if (updatedMatchedCount >= pairs) {
            const trials = moves + 1;
            const extraFlips = Math.max(0, trials - pairs);
            const score = Math.max(60, 100 - extraFlips * 4);
            onComplete(score, undefined, withTrace(rec, buildCompletionMetrics({
              trials: pairs,
              correctTrials: pairs,
              errors: 0,
              promptsNeeded: extraFlips,
              masteryThreshold: masteryForSupport(supportLevel),
              attemptsBySkill: { memory: trials, "visual-discrimination": pairs },
              observations: [
                `Completed all ${pairs} matching pairs in ${trials} flips (${extraFlips} extra exploration flips).`,
                errors > 0 ?                  `Made ${errors} mismatched flip${errors === 1 ? "" : "s"} that were self-corrected.` : "Matched without mismatched flips.",
              ],
            })));
          }
          return updatedMatchedCount;
        });
        setSelected([]);
        setResolving(false);
      }, supportLevel === "high" ? 650 : 500);
      return;
    }

    setErrors((currentErrors) => currentErrors + 1);
    setCombo(0);
    wobble();
    speak(`Different. Try again calmly.`);
    setFeedback(`${nextCards[firstIndex].item.label} and ${nextCards[secondIndex].item.label} are different. Try again calmly.`);
    window.setTimeout(() => {
      setCards((currentCards) =>
        currentCards.map((entry, entryIndex) =>
          entryIndex === firstIndex || entryIndex === secondIndex
            ? { ...entry, flipped: startOpen }
            : entry
        )
      );
      setSelected([]);
      setResolving(false);
    }, supportLevel === "high" ? 1000 : 800);
  };

  const renderFace = (card: Card, isVisible: boolean) => {
    if (!isVisible) {
      return <span className="flex h-full items-center justify-center text-4xl font-black text-primary">?</span>;
    }
    const emoji = emojiFor(card.item.label);
    return (
      <span className="flex h-full flex-col items-center justify-center gap-1">
        {emoji ? (
          <span
            aria-hidden="true"
            className={`text-3xl leading-none drop-shadow-sm ${card.silhouette ? "brightness-0 opacity-45" : ""}`}
          >
            {emoji}
          </span>
        ) : (
          <LetterMedal label={card.item.label} className={`h-9 w-9 text-lg ${card.silhouette ? "opacity-40 grayscale" : ""}`} />
        )}
        <span className="text-xs font-black uppercase tracking-wide text-foreground">{card.item.label}</span>
        <span className="sr-only">{card.item.cue}</span>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 rounded-2xl bg-muted/70 p-4 text-center">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Vocabulary matching</span>
          <TokenStrip earned={matchedCount} total={pairs} token="🧩" />
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">{feedback}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Matched {matchedCount} of {pairs} pairs{hintVisible ? " · Hint ready" : ""}
        </p>
      </div>

      <div className="relative">
        <ComboBadge combo={combo} />
        <motion.div
          animate={controls}
          ref={boardRef}
          style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
          className="relative grid gap-3 rounded-3xl p-1"
        >
          {cards.map((card, index) => {
            const isVisible = card.flipped || card.matched;
            const hinted = hintKeys.has(card.item.key) && !card.matched;
            return (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.92 }}
                onClick={(event) => handleTap(index, event)}
                disabled={resolving}
                aria-label={isVisible ? `${card.item.label} card` : "hidden matching card"}
                className={`touch-target aspect-square rounded-2xl border-2 p-2 text-center transition-all ${
                  card.matched
                    ? "border-secondary bg-secondary/30"
                    : card.flipped
                      ? "border-primary bg-card shadow-lg"
                      : "border-border bg-primary/10"
                } ${hinted ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60" : ""}`}
              >
                {renderFace(card, isVisible)}
                {card.matched ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    aria-hidden="true"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-black text-white shadow"
                  >
                    ✓
                  </motion.span>
                ) : null}
              </motion.button>
            );
          })}
          <BurstLayer bursts={bursts} />
        </motion.div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => speak(`Find the matching pairs. Look, say the word, then find the twin.`)}
          className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          🔊 Say it again
        </button>
      </div>
    </div>
  );
}
