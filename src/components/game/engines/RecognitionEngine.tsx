import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { emojiFor, LetterMedal } from "@/lib/gameAssets";
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

interface RecognitionContent {
  target: string;
  teachingPoint: string;
  items: string[];
  correctItems: string[];
}

const themeTargets: Record<string, RecognitionContent> = {
  "red things": { target: "Pick the red things", teachingPoint: "Color recognition: red can appear on fruit, vehicles, and flowers.", items: ["apple", "red car", "strawberry", "blue dot", "rose", "green dot"], correctItems: ["apple", "red car", "strawberry", "rose"] },
  "blue things": { target: "Pick the blue things", teachingPoint: "Color recognition: choose items that share the same blue color.", items: ["blue block", "fish", "blue dot", "lemon", "apple", "yellow dot"], correctItems: ["blue block", "fish", "blue dot"] },
  "round objects": { target: "Pick the round objects", teachingPoint: "Shape recognition: round objects have curved edges and no corners.", items: ["ball", "circle", "cookie", "book", "brick", "triangle"], correctItems: ["ball", "circle", "cookie"] },
  "square objects": { target: "Pick the square objects", teachingPoint: "Shape recognition: squares have four equal sides and corners.", items: ["square", "tile", "box", "ball", "orange", "moon"], correctItems: ["square", "tile", "box"] },
  "rainbow sort": { target: "Pick the color items", teachingPoint: "Color recognition: find the words that belong in a rainbow.", items: ["red", "blue", "green", "yellow", "book", "car"], correctItems: ["red", "blue", "green", "yellow"] },
  "shape shadows": { target: "Pick the shape shadows", teachingPoint: "Visual discrimination: match objects by outline, not by color.", items: ["circle", "square", "triangle", "star", "apple", "chair"], correctItems: ["circle", "square", "triangle", "star"] },
  "color mixing": { target: "Pick colors that can mix", teachingPoint: "Color knowledge: colors combine to make new colors.", items: ["red", "blue", "yellow", "white", "dog", "shoe"], correctItems: ["red", "blue", "yellow", "white"] },
  "pattern fill": { target: "Pick the repeating pattern pieces", teachingPoint: "Pattern recognition: notice what repeats and fill the missing part.", items: ["A", "B", "A", "B", "Z", "Q"], correctItems: ["A", "B"] },
  "shape puzzle": { target: "Pick puzzle shapes", teachingPoint: "Visual-motor planning: choose pieces that can build a picture.", items: ["circle", "square", "triangle", "diamond", "song", "run"], correctItems: ["circle", "square", "triangle", "diamond"] },
  "color match": { target: "Pick the matching colors", teachingPoint: "Matching: group items that share the same color label.", items: ["red", "red", "blue", "blue", "table", "jump"], correctItems: ["red", "blue"] },
  "triangle hunt": { target: "Pick triangles", teachingPoint: "Generalization: triangles can appear in many real-world objects.", items: ["triangle", "roof", "mountain", "slice", "circle", "square"], correctItems: ["triangle", "roof", "mountain", "slice"] },
  "symmetry mirror": { target: "Pick things with two matching sides", teachingPoint: "Symmetry: both sides look balanced or mirrored.", items: ["butterfly", "heart", "face", "leaf", "scribble", "cloud"], correctItems: ["butterfly", "heart", "face", "leaf"] },
  "learn animals": { target: "Tap the animals", teachingPoint: "Vocabulary: identify animals among other objects.", items: ["dog", "car", "cat", "frog", "balloon", "rabbit"], correctItems: ["dog", "cat", "frog", "rabbit"] },
  "learn emotions": { target: "Tap the faces showing emotions", teachingPoint: "Emotional awareness: faces can show happy, surprised, sad, or angry feelings.", items: ["happy", "surprised", "book", "sad", "puzzle", "angry"], correctItems: ["happy", "surprised", "sad", "angry"] },
  "learn colors": { target: "Tap the color circles", teachingPoint: "Color vocabulary: name and choose color marks.", items: ["red", "blue", "green", "apple", "car", "flower"], correctItems: ["red", "blue", "green"] },
  "learn shapes": { target: "Tap the shapes", teachingPoint: "Shape vocabulary: choose named forms.", items: ["triangle", "square", "star", "apple", "car", "flower"], correctItems: ["triangle", "square", "star"] },
  "soft things": { target: "Tap the soft things", teachingPoint: "Texture recognition: soft things are gentle to touch.", items: ["teddy", "pillow", "cloud", "rock", "brick", "spoon"], correctItems: ["teddy", "pillow", "cloud"] },
  "things that fly": { target: "Tap the things that fly", teachingPoint: "Movement recognition: flying things travel through the sky.", items: ["butterfly", "bee", "plane", "cow", "brick", "spoon"], correctItems: ["butterfly", "bee", "plane"] },
  fruits: { target: "Tap the fruits", teachingPoint: "Fruit recognition: fruits grow on plants and trees.", items: ["strawberry", "orange", "grapes", "carrot", "potato", "cheese"], correctItems: ["strawberry", "orange", "grapes"] },
  "animals that swim": { target: "Tap the animals that swim", teachingPoint: "Habitat recognition: these friends live in water.", items: ["fish", "dolphin", "shark", "cat", "dog", "bird"], correctItems: ["fish", "dolphin", "shark"] },
  "big animals": { target: "Tap the big animals", teachingPoint: "Size discrimination: choose the very large animals.", items: ["elephant", "giraffe", "whale", "mouse", "bee", "ant"], correctItems: ["elephant", "giraffe", "whale"] },
  "yellow things": { target: "Tap the yellow things", teachingPoint: "Color recognition: find everything yellow.", items: ["banana", "lemon", "sunflower", "apple", "blueberry", "car"], correctItems: ["banana", "lemon", "sunflower"] },
  "things that roll": { target: "Tap the things that roll", teachingPoint: "Movement discrimination: rolling things turn as they travel.", items: ["ball", "orange", "car", "book", "tree", "house"], correctItems: ["ball", "orange", "car"] },
  "things we wear": { target: "Tap the things we wear", teachingPoint: "Category recognition: clothing goes on our bodies.", items: ["shirt", "shoes", "socks", "table", "chair", "cup"], correctItems: ["shirt", "shoes", "socks"] },
  "bathroom things": { target: "Tap the bathroom things", teachingPoint: "Daily-living recognition: find bathroom objects.", items: ["soap", "toothbrush", "towel", "sofa", "car", "pizza"], correctItems: ["soap", "toothbrush", "towel"] },
  "school supplies": { target: "Tap the school supplies", teachingPoint: "Category recognition: tools we use for learning.", items: ["pencil", "backpack", "notebook", "dog", "cake", "moon"], correctItems: ["pencil", "backpack", "notebook"] },
  default: { target: "Pick the matching items", teachingPoint: "Matching: choose items that belong with the target rule.", items: ["star", "star", "balloon", "puzzle", "star", "paint"], correctItems: ["star"] },
};

export default function RecognitionEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.theme || "default");
  const data = themeTargets[theme] || themeTargets.default;
  const { personalized, supportLevel } = getAdaptiveGameConfig(game);
  const correctItems = useMemo(() => {
    if (personalized && supportLevel === "high") return data.correctItems.slice(0, Math.min(2, data.correctItems.length));
    return data.correctItems;
  }, [data.correctItems, personalized, supportLevel]);
  const correctSet = useMemo(() => new Set(correctItems), [correctItems]);
  const pool = useMemo(() => {
    const wrongItems = data.items.filter((item) => !data.correctItems.includes(item));
    const wrongLimit = personalized && supportLevel === "high" ? 2 : wrongItems.length;
    return shuffleItems([...correctItems, ...wrongItems.slice(0, wrongLimit)]);
  }, [correctItems, data.correctItems, data.items, personalized, supportLevel]);
  const totalCorrect = correctItems.length;
  const [selected, setSelected] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("Choose every item that matches the rule.");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { playHitSound, playMissSound } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  useEffect(() => {
    rec.mark();
  }, [pool, rec]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high" && mistakes >= 1, delayMs: 4000, resetKey: mistakes });

  useEffect(() => {
    speak(`${data.target}. ${data.teachingPoint}`);
  }, [data.target, data.teachingPoint]);

  const handlePick = (index: number, value: string) => {
    if (selected.includes(index)) return;

    onInteraction();
    const isCorrect = correctSet.has(value);
    rec.trial({
      stimulus: value,
      correct: isCorrect,
      positionIndex: index,
      choiceCount: pool.length,
      options: pool,
      prompted: hintVisible && isCorrect,
      promptLevel: hintVisible ? "visual" : "independent",
    });
    const nextSelected = [...selected, index];
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextMistakes = mistakes + (isCorrect ? 0 : 1);

    if (isCorrect) {
      playHitSound(nextCorrect);
      fireBurst(50, 45, emojiFor(value) || "✨");
      speak(`${value} matches!`);
    } else {
      wobble();
      playMissSound();
      speak(`${value} does not match.`);
    }
    setSelected(nextSelected);
    setCorrect(nextCorrect);
    setMistakes(nextMistakes);
    setFeedback(isCorrect ? `${value} matches. Keep scanning.` : `${value} does not match this rule. Look again.`);

    if (nextCorrect >= totalCorrect) {
      const score = Math.max(55, 100 - nextMistakes * 15);
      onComplete(score, undefined, withTrace(rec, buildCompletionMetrics({
        trials: totalCorrect,
        correctTrials: totalCorrect,
        errors: nextMistakes,
        promptsNeeded: nextMistakes,
        masteryThreshold: masteryForSupport(supportLevel),
        attemptsBySkill: { recognition: nextSelected.length, "visual-discrimination": nextCorrect },
        observations: [
          `Found all ${nextCorrect} of ${totalCorrect} target items for "${data.target}".`,
          nextMistakes > 0 ? `Needed ${nextMistakes} correction${nextMistakes === 1 ? "" : "s"} while scanning.` : "Scanned without selecting off-rule items.",
        ],
      })));
    }
  };

  const hintTexts = useMemo(() => {
    if (!hintVisible) return new Set<string>();
    const remaining = pool.filter((value, index) => correctSet.has(value) && !selected.includes(index));
    if (!remaining.length) return new Set<string>();
    return new Set([remaining[0]]);
  }, [correctSet, hintVisible, pool, selected]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-2 text-lg font-bold text-foreground">{data.target}</p>
      <p className="sr-only">{data.teachingPoint}</p>
      <p className="mb-4 text-sm font-semibold text-muted-foreground">
        Find {totalCorrect} correct item{totalCorrect === 1 ? "" : "s"}. {feedback}
      </p>
      <motion.div animate={controls} ref={boardRef} className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pool.map((item, index) => {
          const emoji = emojiFor(item);
          const picked = selected.includes(index);
          return (
            <button
              key={`${item}-${index}`}
              onClick={() => handlePick(index, item)}
              className={`touch-target rounded-2xl border-2 p-5 text-base font-black transition-colors ${
                hintTexts.has(item) && !picked
                  ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60"
                  : picked
                    ? "border-secondary bg-secondary/20"
                    : "border-border bg-card hover:border-primary"
              }`}
            >
              {emoji ? (
                <span aria-hidden="true" className="mb-2 block text-4xl leading-none drop-shadow-sm">{emoji}</span>
              ) : (
                <LetterMedal label={item} className="mx-auto mb-2 h-9 w-9 text-lg" />
              )}
              {item}
            </button>
          );
        })}
        <BurstLayer bursts={bursts} />
      </motion.div>
    </div>
  );
}
