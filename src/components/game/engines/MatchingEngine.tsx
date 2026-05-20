import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const emojiSets: Record<string, string[]> = {
  animals: ["🐶", "🐱", "🐰", "🐸", "🦊", "🐼", "🐨", "🦁"],
  food: ["🍎", "🍌", "🍕", "🍦", "🧁", "🍩", "🥕", "🍇"],
  vehicles: ["🚗", "🚌", "🚀", "✈️", "🚂", "🏍️", "🚲", "⛵"],
  emotions: ["😊", "😢", "😮", "😡", "🥰", "😴", "🤩", "😂"],
  nature: ["🌸", "🌻", "🌲", "🍂", "🌈", "⭐", "🌙", "☀️"],
  colors: ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "⬛", "⬜"],
  letters: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numbers: ["1", "2", "3", "4", "5", "6", "7", "8"],
  shapes: ["T", "S", "O", "D", "R", "H", "P", "C"],
  tools: ["Hammer", "Saw", "Wrench", "Brush", "Ruler", "Key", "Tape", "Nail"],
  textures: ["Soft", "Rough", "Smooth", "Bumpy", "Fuzzy", "Hard", "Wet", "Dry"],
  seasons: ["Spring", "Summer", "Fall", "Winter", "Rain", "Sun", "Snow", "Wind"],
  "body parts": ["Eye", "Ear", "Hand", "Foot", "Nose", "Mouth", "Arm", "Leg"],
  music: ["🎸", "🎹", "🎻", "🥁", "🎤", "🎧", "🎵", "🎼"],
  clothes: ["👕", "👖", "🧢", "🧤", "🧦", "👗", "👟", "🧥"],
  default: ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "⬛", "⬜"],
};

export default function MatchingEngine({ game, onInteraction, onComplete }: Props) {
  const { supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const pairs = (game.config.pairs as number) || 4;
  const theme = String(game.config.theme || "default");
  const emojis = emojiSets[theme] || emojiSets.default;

  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const picked = emojis.slice(0, pairs);
    const deck = shuffleItems(
      [...picked, ...picked].map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false }))
    );

    setCards(deck);
    setSelected([]);
    setMoves(0);
    setMatchedCount(0);
    setResolving(false);
  }, [emojis, pairs]);

  const handleTap = (index: number) => {
    if (resolving || selected.length >= 2) return;

    const card = cards[index];
    if (!card || card.flipped || card.matched) return;

    onInteraction();
    const nextCards = cards.map((entry, entryIndex) => (entryIndex === index ? { ...entry, flipped: true } : entry));
    const nextSelected = [...selected, index];

    setCards(nextCards);
    setSelected(nextSelected);

    if (nextSelected.length !== 2) return;

    setResolving(true);
    setMoves((currentMoves) => currentMoves + 1);

    const [firstIndex, secondIndex] = nextSelected;
    if (nextCards[firstIndex].emoji === nextCards[secondIndex].emoji) {
      window.setTimeout(() => {
        setCards((currentCards) =>
          currentCards.map((entry, entryIndex) =>
            entryIndex === firstIndex || entryIndex === secondIndex ? { ...entry, matched: true } : entry
          )
        );
        setMatchedCount((currentMatchedCount) => {
          const updatedMatchedCount = currentMatchedCount + 1;
          if (updatedMatchedCount >= pairs) {
            const score = Math.max(20, 100 - Math.max(0, moves + 1 - pairs) * 5);
            onComplete(Math.min(100, score));
          }
          return updatedMatchedCount;
        });
        setSelected([]);
        setResolving(false);
      }, supportLevel === "high" ? 650 : 500);
      return;
    }

    window.setTimeout(() => {
      setCards((currentCards) =>
        currentCards.map((entry, entryIndex) =>
          entryIndex === firstIndex || entryIndex === secondIndex ? { ...entry, flipped: false } : entry
        )
      );
      setSelected([]);
      setResolving(false);
    }, supportLevel === "high" ? 1000 : 800);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 text-center">
        <p className="text-sm text-muted-foreground">
          Matched: {matchedCount}/{pairs} · Moves: {moves} · Support: {supportLevel} · Stage: {readinessStage}
        </p>
      </div>

      <div style={{ gridTemplateColumns: "repeat(4, 1fr)" }} className="grid gap-3">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleTap(index)}
            disabled={resolving}
            className={`touch-target aspect-square rounded-2xl border-2 text-4xl transition-all ${
              card.matched
                ? "border-secondary bg-secondary/30"
                : card.flipped
                  ? "border-primary bg-card shadow-lg"
                  : "border-border bg-primary/10"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
