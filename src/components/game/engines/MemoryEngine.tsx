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

type MemoryItem = {
  key: string;
  label: string;
  clue: string;
};

const makeMemory = (theme: string, entries: [string, string][]): MemoryItem[] =>
  entries.map(([label, clue]) => ({ key: `${theme}-${label.toLowerCase().replace(/\s+/g, "-")}`, label, clue }));

const memoryThemes: Record<string, MemoryItem[]> = {
  faces: makeMemory("faces", [["Happy", "smiling face"], ["Calm", "quiet face"], ["Loved", "warm face"], ["Thinking", "thinking face"], ["Excited", "big smile"]]),
  objects: makeMemory("objects", [["Table", "furniture"], ["Ball", "toy"], ["Book", "reading"], ["Puzzle", "pieces"], ["Cup", "drink"]]),
  words: makeMemory("words", [["CAT", "animal word"], ["SUN", "sky word"], ["TREE", "nature word"], ["BALL", "play word"], ["BIRD", "animal word"]]),
  sounds: makeMemory("sounds", [["na", "mouth sound"], ["ta", "tongue tap"], ["ba", "lip sound"], ["ma", "hum sound"], ["va", "voice sound"]]),
  positions: makeMemory("positions", [["Up", "above"], ["Right", "side"], ["Down", "below"], ["Left", "side"], ["Center", "middle"]]),
  stories: makeMemory("stories", [["Beginning", "start"], ["Problem", "something happens"], ["Try", "first action"], ["Help", "support"], ["Solve", "ending"]]),
  sequences: makeMemory("sequences", [["First", "step 1"], ["Next", "step 2"], ["Then", "step 3"], ["After", "step 4"], ["Last", "finish"]]),
  colors: makeMemory("colors", [["Red", "warm color"], ["Blue", "cool color"], ["Green", "nature color"], ["Yellow", "sun color"], ["Purple", "mixed color"]]),
  shapes: makeMemory("shapes", [["Triangle", "3 sides"], ["Square", "4 equal sides"], ["Star", "points"], ["Circle", "round"], ["Diamond", "tilted square"]]),
  animals: makeMemory("animals", [["Dog", "barks"], ["Cat", "meows"], ["Frog", "jumps"], ["Rabbit", "hops"], ["Bird", "flies"]]),
  vehicles: makeMemory("vehicles", [["Car", "drives"], ["Bus", "big and long"], ["Train", "on tracks"], ["Boat", "floats"], ["Plane", "flies"]]),
  food: makeMemory("food", [["Apple", "crunchy"], ["Banana", "yellow peel"], ["Grapes", "tiny and round"], ["Carrot", "orange"], ["Cheese", "from milk"]]),
  toys: makeMemory("toys", [["Ball", "bounces"], ["Bear", "soft friend"], ["Kite", "flies on string"], ["Blocks", "stack up"], ["Drum", "tap tap"]]),
  weather: makeMemory("weather", [["Sun", "bright day"], ["Rain", "pitter patter"], ["Snow", "cold white"], ["Wind", "whoosh"], ["Rainbow", "after rain"]]),
  sea: makeMemory("sea", [["Fish", "swims"], ["Crab", "walks sideways"], ["Octopus", "eight arms"], ["Dolphin", "jumps waves"], ["Turtle", "slow shell"]]),
  music: makeMemory("music", [["Drum", "boom boom"], ["Bell", "ding ding"], ["Flute", "soft toot"], ["Guitar", "strum strum"], ["Piano", "black and white keys"]]),
  school: makeMemory("school", [["Pencil", "writes"], ["Book", "pages"], ["Backpack", "carries things"], ["Crayons", "colors"], ["Glue", "sticky"]]),
  garden: makeMemory("garden", [["Flower", "smells sweet"], ["Bee", "makes honey"], ["Snail", "slow shell"], ["Leaf", "green"], ["Watering can", "pour pour"]]),
  emotions: makeMemory("emotions", [["Happy", "big smile"], ["Sad", "down face"], ["Angry", "red cheeks"], ["Surprised", "wide eyes"], ["Calm", "slow breath"]]),
  circus: makeMemory("circus", [["Tent", "big top"], ["Popcorn", "crunchy"], ["Clown", "red nose"], ["Ticket", "one entry"], ["Drum", "boom boom"]]),
  fruits: makeMemory("fruits", [["Apple", "red round"], ["Banana", "yellow peel"], ["Grapes", "a bunch"], ["Strawberry", "tiny seeds"], ["Orange", "citrus"]]),
  vegetables: makeMemory("vegetables", [["Carrot", "orange stick"], ["Corn", "yellow kernels"], ["Tomato", "red and round"], ["Broccoli", "little trees"], ["Onion", "makes you cry"]]),
  bugs: makeMemory("bugs", [["Bee", "buzz buzz"], ["Ant", "marches line"], ["Ladybug", "red spots"], ["Butterfly", "flutter wings"], ["Spider", "spins web"]]),
  space: makeMemory("space", [["Rocket", "blast off"], ["Moon", "night sky"], ["Star", "twinkle"], ["Planet", "orbits sun"], ["Astronaut", "space suit"]]),
  default: makeMemory("memory", [["Star", "bright"], ["Circle", "round"], ["Block", "build"], ["Letter", "symbol"], ["House", "place"]]),
};

function ordinal(index: number) {
  const labels = ["first", "second", "third", "fourth", "fifth"];
  return labels[index] || `${index + 1}th`;
}

export default function MemoryEngine({ game, onInteraction, onComplete }: Props) {
  const { difficulty, supportLevel } = getAdaptiveGameConfig(game);
  const theme = String(game.config.theme || "default");
  const items = useMemo(() => memoryThemes[theme] || memoryThemes.default, [theme]);
  const itemCount = difficulty === "easy" || supportLevel === "high" ? 3 : difficulty === "medium" ? 4 : 5;
  const visibleItems = useMemo(() => items.slice(0, itemCount), [itemCount, items]);
  const answerIndex = difficulty === "hard" && supportLevel === "light" ? visibleItems.length - 1 : Math.min(2, visibleItems.length - 1);
  const answer = visibleItems[answerIndex];
  const [phase, setPhase] = useState<"show" | "quiz">("show");
  const [feedback, setFeedback] = useState("Look at each card. Say the name quietly if it helps.");
  const [completed, setCompleted] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { playHitSound, playMissSound, playFanfare } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const hintVisible = useHintLadder({ enabled: supportLevel === "high" && phase === "quiz", delayMs: 5000 });

  const shuffledQuiz = useMemo(() => shuffleItems(visibleItems), [visibleItems]);
  const speechTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const pending = speechTimersRef.current;
    return () => {
      pending.forEach((timerId) => window.clearTimeout(timerId));
      speechTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    setPhase("show");
    setCompleted(false);
    setFeedback("Look at each card. Say the name quietly if it helps.");

    speechTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    speechTimersRef.current = visibleItems.map((item, index) =>
      window.setTimeout(() => speak(`${ordinal(index)}: ${item.label}`), index * 700)
    );

    const timer = window.setTimeout(() => {
      setPhase("quiz");
      setFeedback(`Which card was ${ordinal(answerIndex)}? Use the clue if you need it.`);
      speak(`Which card was ${ordinal(answerIndex)}?`);
      rec.mark();
    }, supportLevel === "high" ? 2400 : supportLevel === "light" ? 1400 : 1800);
    return () => window.clearTimeout(timer);
  }, [answerIndex, rec, supportLevel, theme, visibleItems]);

  const handleSelect = (item: MemoryItem) => {
    if (phase !== "quiz" || completed) return;
    onInteraction();
    const correct = item.key === answer.key;
    rec.trial({
      stimulus: answer.key,
      correct,
      positionIndex: shuffledQuiz.findIndex((entry) => entry.key === item.key),
      choiceCount: shuffledQuiz.length,
      prompted: !correct,
      promptLevel: correct ? "independent" : "model",
    });
    setCompleted(true);
    if (correct) {
      playHitSound(2);
      fireBurst(50, 42, emojiFor(answer.label) || "🌟");
      speak(`Yes! ${answer.label} was ${ordinal(answerIndex)}.`);
    } else {
      wobble();
      playMissSound();
      speak(`Good try. The ${ordinal(answerIndex)} card was ${answer.label}.`);
    }
    setFeedback(correct ? `Yes. ${answer.label} was ${ordinal(answerIndex)}.` : `${item.label} is a good try. The ${ordinal(answerIndex)} card was ${answer.label}.`);
    if (correct) playFanfare();
    onComplete(correct ? 100 : 70, undefined, withTrace(rec, buildCompletionMetrics({
      trials: 1,
      correctTrials: 1,
      errors: correct ? 0 : 0,
      promptsNeeded: correct ? 0 : 1,
      masteryThreshold: masteryForSupport(supportLevel),
      attemptsBySkill: { "working-memory": 1, recall: 1 },
      observations: correct
        ? [`Recalled the ${ordinal(answerIndex)} item from ${visibleItems.length} cards without help.`]
        : [`Needed one guiding prompt to find the ${ordinal(answerIndex)} of ${visibleItems.length} cards; answer shown warmly.`],
    })));
  };

  const renderCardFace = (item: MemoryItem) => {
    const emoji = emojiFor(item.label);
    return (
      <>
        {emoji ? (
          <span aria-hidden="true" className="block text-3xl leading-none">{emoji}</span>
        ) : (
          <LetterMedal label={item.label} className="mx-auto h-9 w-9 text-lg" />
        )}
        <span className="block text-lg font-black text-foreground">{item.label}</span>
        <span className="block text-xs text-muted-foreground">{item.clue}</span>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div ref={boardRef} className="rounded-2xl bg-muted p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Working memory</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{feedback}</p>

        {phase === "show" ? (
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            {visibleItems.map((item, index) => (
              <motion.span
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className="min-w-24 rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-sm"
              >
                <span className="block text-xs font-bold text-muted-foreground">{ordinal(index)}</span>
                {renderCardFace(item)}
              </motion.span>
            ))}
          </div>
        ) : (
          <motion.div animate={controls} className="relative mt-5 grid grid-cols-2 gap-3">
            {shuffledQuiz.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item)}
                className={`touch-target rounded-xl border-2 bg-card p-4 transition-colors hover:border-primary ${
                  hintVisible && item.key === answer.key && !completed
                    ? "animate-pulse border-amber-400 ring-4 ring-amber-300/60"
                    : completed
                      ? "border-border opacity-70"
                      : "border-border"
                }`}
              >
                {renderCardFace(item)}
              </button>
            ))}
            <BurstLayer bursts={bursts} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
