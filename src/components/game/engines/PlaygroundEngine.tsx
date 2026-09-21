import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { speak } from "@/lib/speech";
import { BurstLayer, useBursts } from "../Juice";
import { buildCompletionMetrics, GameCompletionMetrics, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

const playgroundThemes: Record<string, { token: string; emoji: string; prompt: string; block: string; axis: string }[]> = {
  sandbox: [
    { token: "bucket", emoji: "🪣", prompt: "Fill the cube bucket with sand", block: "cube", axis: "volume" },
    { token: "plane", emoji: "🧹", prompt: "Smooth the wide sand plane", block: "plank", axis: "surface" },
    { token: "tower", emoji: "🏰", prompt: "Stack a castle tower", block: "column", axis: "height" },
    { token: "shell", emoji: "🐚", prompt: "Add a round shell to finish", block: "sphere", axis: "detail" },
  ],
  slide: [
    { token: "steps", emoji: "🪜", prompt: "Climb the block steps", block: "cube", axis: "up" },
    { token: "platform", emoji: "🟫", prompt: "Pause on the top platform", block: "plank", axis: "balance" },
    { token: "slope", emoji: "🛝", prompt: "Slide down the prism slope", block: "prism", axis: "down" },
    { token: "landing", emoji: "🌊", prompt: "Land softly on the mat", block: "sphere", axis: "finish" },
  ],
  bench: [
    { token: "seat", emoji: "🪑", prompt: "Place yourself beside a friend", block: "plank", axis: "together" },
    { token: "hello", emoji: "👋", prompt: "Turn toward them and say hello", block: "sphere", axis: "connection" },
    { token: "chat", emoji: "💬", prompt: "Build a short conversation bridge", block: "arch", axis: "language" },
    { token: "share", emoji: "🧸", prompt: "Take turns and keep balance", block: "cube", axis: "turns" },
  ],
  default: [
    { token: "path", emoji: "👣", prompt: "Explore the garden path", block: "plank", axis: "path" },
    { token: "shape", emoji: "🔷", prompt: "Try the next shape", block: "cube", axis: "choice" },
    { token: "turn", emoji: "🔄", prompt: "Rotate and notice what changes", block: "prism", axis: "turn" },
    { token: "finish", emoji: "🏁", prompt: "Complete the play routine", block: "sphere", axis: "whole" },
  ],
  picnic: [
    { token: "blanket", emoji: "🧺", prompt: "Spread the picnic blanket flat", block: "plank", axis: "space" },
    { token: "basket", emoji: "🍇", prompt: "Open the basket of snacks", block: "cube", axis: "share" },
    { token: "plates", emoji: "🍽️", prompt: "Hand out a plate to each friend", block: "sphere", axis: "kindness" },
    { token: "finish", emoji: "🌤️", prompt: "Enjoy the sunshine together", block: "arch", axis: "calm" },
  ],
  beach: [
    { token: "towel", emoji: "🏖️", prompt: "Lay your towel on the sand", block: "plank", axis: "spot" },
    { token: "castle", emoji: "🏰", prompt: "Build a sand castle with buckets", block: "column", axis: "build" },
    { token: "waves", emoji: "🌊", prompt: "Listen to the waves roll in", block: "prism", axis: "rhythm" },
    { token: "shell", emoji: "🐚", prompt: "Collect one shell as a treasure", block: "sphere", axis: "collect" },
  ],
  spacewalk: [
    { token: "suit", emoji: "👨‍🚀", prompt: "Zip up your space suit", block: "cube", axis: "ready" },
    { token: "float", emoji: "🌌", prompt: "Float slowly past the planets", block: "sphere", axis: "slow" },
    { token: "grip", emoji: "🪐", prompt: "Hold the ring of Saturn gently", block: "arch", axis: "gentle" },
    { token: "home", emoji: "🌍", prompt: "Wave goodbye and head home", block: "plank", axis: "finish" },
  ],
  farmchores: [
    { token: "feed", emoji: "🌾", prompt: "Feed the hungry animals", block: "cube", axis: "care" },
    { token: "eggs", emoji: "🥚", prompt: "Collect eggs from the coop", block: "sphere", axis: "gather" },
    { token: "water", emoji: "💧", prompt: "Water the vegetable patch", block: "cylinder", axis: "grow" },
    { token: "gate", emoji: "🚪", prompt: "Close the gate nice and tight", block: "plank", axis: "safe" },
  ],
  library: [
    { token: "quiet", emoji: "🤫", prompt: "Use your quiet library voice", block: "sphere", axis: "calm" },
    { token: "choose", emoji: "📖", prompt: "Choose one book that looks fun", block: "cube", axis: "choice" },
    { token: "read", emoji: "👀", prompt: "Look at the pictures page by page", block: "prism", axis: "order" },
    { token: "return", emoji: "↩️", prompt: "Return the book to its spot", block: "plank", axis: "tidy" },
  ],
  busride: [
    { token: "stop", emoji: "🚌", prompt: "Wait for the bus at the stop", block: "plank", axis: "wait" },
    { token: "board", emoji: "🪜", prompt: "Step up carefully onto the bus", block: "cube", axis: "careful" },
    { token: "seat", emoji: "🪑", prompt: "Find a seat and sit snugly", block: "column", axis: "safe" },
    { token: "bell", emoji: "🔔", prompt: "Ring the bell for your stop", block: "sphere", axis: "signal" },
  ],
  artclass: [
    { token: "smock", emoji: "👕", prompt: "Put on your art smock", block: "plank", axis: "ready" },
    { token: "paint", emoji: "🎨", prompt: "Mix two colors and see what appears", block: "prism", axis: "mix" },
    { token: "brush", emoji: "🖌️", prompt: "Paint slow, long brush strokes", block: "column", axis: "slow" },
    { token: "dry", emoji: "🌬️", prompt: "Set your painting somewhere to dry", block: "sphere", axis: "patience" },
  ],
  petcare: [
    { token: "bowl", emoji: "🍽️", prompt: "Fill your pet's water bowl", block: "cylinder", axis: "care" },
    { token: "brush", emoji: "🧽", prompt: "Brush your pet very softly", block: "plank", axis: "soft" },
    { token: "play", emoji: "🎾", prompt: "Play a short game together", block: "sphere", axis: "fun" },
    { token: "rest", emoji: "😌", prompt: "Let your pet rest when they are tired", block: "cube", axis: "notice" },
  ],
  rainyday: [
    { token: "window", emoji: "🌧️", prompt: "Watch the raindrops race down the window", block: "prism", axis: "watch" },
    { token: "fort", emoji: "🛋️", prompt: "Build a cozy blanket fort", block: "cube", axis: "build" },
    { token: "story", emoji: "📖", prompt: "Read a story inside your fort", block: "plank", axis: "quiet" },
    { token: "cocoa", emoji: "☕", prompt: "Finish with a warm cup of cocoa", block: "sphere", axis: "warm" },
  ],
};

const blockClass: Record<string, string> = {
  cube: "froebel-cube",
  prism: "froebel-prism",
  plank: "froebel-plank",
  column: "froebel-column",
  sphere: "froebel-sphere",
  arch: "froebel-arch",
};

export default function PlaygroundEngine({ game, onInteraction, onComplete }: Props) {
  const themeKey = String(game.config.theme || "") || game.engine;
  const steps = useMemo(
    () => playgroundThemes[themeKey] || playgroundThemes[game.engine] || playgroundThemes.default,
    [game.engine, themeKey]
  );
  const [current, setCurrent] = useState(0);
  const [trail, setTrail] = useState<number[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { bursts, fireBurst } = useBursts();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  useEffect(() => {
    speak(`${game.name}. ${steps[0]?.prompt || ""}`);
  }, [game.name, steps]);

  const handleNext = () => {
    onInteraction();
    rec.event("step", `${current + 1}:${steps[current]?.token || ""}`);
    setTrail((value) => [...value, current]);
    if (current + 1 >= steps.length) {
      fireBurst(50, 40, "🎉");
      speak("You finished the whole garden. Amazing!");
      onComplete(100, undefined, withTrace(rec, buildCompletionMetrics({
        trials: steps.length,
        correctTrials: steps.length,
        errors: 0,
        masteryThreshold: 80,
        attemptsBySkill: { "guided-play": steps.length, imitation: steps.length },
        observations: [`Completed all ${steps.length} guided play steps in order.`],
      })));
      return;
    }
    speak(steps[current + 1]?.prompt || "");
    setCurrent((value) => value + 1);
  };

  const step = steps[current];

  return (
    <div ref={boardRef} className="relative mx-auto max-w-4xl px-2 py-4 text-center">
      <div className="mb-5 rounded-[2rem] border border-emerald-900/10 bg-[linear-gradient(145deg,rgba(246,238,214,0.96),rgba(197,226,207,0.78))] p-5 shadow-[0_24px_80px_rgba(42,85,62,0.16)]">
        <h2 className="font-display text-2xl font-black text-emerald-950">{game.name}</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-950/70">Follow the garden path, one step at a time.</p>
      </div>

      <div className="playground-3d-scene mb-5">
        <div className="playground-horizon" />
        <div className="playground-grid-floor">
          {steps.map((item, index) => {
            const isDone = trail.includes(index);
            const isCurrent = index === current;
            return (
              <motion.div
                key={`${item.token}-${index}`}
                initial={{ opacity: 0, y: 20, rotateX: 45 }}
                animate={{ opacity: 1, y: isCurrent ? -20 : 0, rotateX: isCurrent ? 0 : 18, scale: isCurrent ? 1.08 : 0.92 }}
                transition={{ type: "spring", stiffness: 180, damping: 18, delay: index * 0.05 }}
                className={`playground-step-card ${isCurrent ? "playground-step-current" : ""} ${isDone ? "playground-step-done" : ""}`}
              >
                <span aria-hidden="true" className="block text-2xl leading-none">{item.emoji}</span>
                <div className={`froebel-object ${blockClass[item.block] || "froebel-cube"} mt-2 scale-75`} />
                <p className="mt-2 text-xs font-black text-emerald-950">{index + 1}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        key={current}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-4 max-w-xl rounded-[2rem] border border-border bg-card/90 p-6 shadow-[0_18px_60px_rgba(38,68,50,0.12)]"
      >
        <p aria-hidden="true" className="mb-3 text-5xl">{step.emoji}</p>
        <p className="text-sm font-bold text-muted-foreground">Step {current + 1} of {steps.length}</p>
        <p className="mt-2 font-display text-2xl font-black text-foreground">{step.prompt}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -3, scale: 1.02 }}
          onClick={handleNext}
          className="mt-5 touch-target rounded-2xl bg-primary px-7 py-3 font-display text-lg font-black text-primary-foreground shadow-[0_14px_34px_rgba(38,142,184,0.28)]"
        >
          {current + 1 >= steps.length ? "Finish the garden" : "Build the next move"}
        </motion.button>
      </motion.div>

      <div className="mx-auto h-3 max-w-xl rounded-full bg-muted shadow-inner">
        <div className="h-3 rounded-full bg-[linear-gradient(90deg,hsl(var(--secondary)),hsl(var(--primary)),hsl(var(--accent)))] transition-all" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>

      <BurstLayer bursts={bursts} />
    </div>
  );
}
