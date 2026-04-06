import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number) => void;
}

const themeVisuals: Record<string, { emoji: string; background: string; renderAs?: "emoji" | "balloon" }> = {
  butterflies: { emoji: "🦋", background: "from-fuchsia-200/70 via-pink-100/60 to-sky-100/60" },
  bubbles: { emoji: "🫧", background: "from-cyan-100/70 via-sky-100/70 to-white/60" },
  stars: { emoji: "⭐", background: "from-amber-100/80 via-yellow-100/70 to-orange-100/60" },
  fish: { emoji: "🐠", background: "from-cyan-100/80 via-sky-100/70 to-emerald-100/60" },
  balloons: { emoji: "🎈", background: "from-rose-100/80 via-orange-100/70 to-sky-100/60", renderAs: "balloon" },
  fireflies: { emoji: "✨", background: "from-amber-100/80 via-lime-100/60 to-emerald-100/60" },
  leaves: { emoji: "🍃", background: "from-emerald-100/80 via-lime-100/70 to-yellow-100/60" },
  snowflakes: { emoji: "❄️", background: "from-sky-100/80 via-cyan-50/80 to-white/70" },
  raindrops: { emoji: "💧", background: "from-sky-100/80 via-cyan-100/70 to-indigo-100/60" },
  birds: { emoji: "🐦", background: "from-sky-100/80 via-white/70 to-emerald-100/60" },
  ladybugs: { emoji: "🐞", background: "from-rose-100/80 via-red-100/70 to-amber-100/60" },
  flowers: { emoji: "🌸", background: "from-pink-100/80 via-fuchsia-100/70 to-lavender-100/60" },
  jellyfish: { emoji: "🪼", background: "from-cyan-100/80 via-violet-100/70 to-fuchsia-100/60" },
  rockets: { emoji: "🚀", background: "from-indigo-100/80 via-sky-100/70 to-slate-100/60" },
  clouds: { emoji: "☁️", background: "from-slate-100/80 via-sky-100/70 to-white/70" },
  "trace lines": { emoji: "✏️", background: "from-amber-100/80 via-orange-100/70 to-white/70" },
  "connect dots": { emoji: "🔵", background: "from-sky-100/80 via-indigo-100/70 to-white/70" },
  "drag & drop": { emoji: "🧲", background: "from-fuchsia-100/80 via-rose-100/70 to-sky-100/60" },
  "pinch & zoom": { emoji: "🤏", background: "from-lime-100/80 via-emerald-100/70 to-sky-100/60" },
  "swipe patterns": { emoji: "〰️", background: "from-violet-100/80 via-fuchsia-100/70 to-cyan-100/60" },
  "follow the path": { emoji: "🛤️", background: "from-amber-100/80 via-lime-100/70 to-sky-100/60" },
  "catch the ball": { emoji: "⚽", background: "from-lime-100/80 via-emerald-100/70 to-yellow-100/60" },
  "pop & hold": { emoji: "🫧", background: "from-cyan-100/80 via-sky-100/70 to-violet-100/60" },
  "slow drag": { emoji: "🖐️", background: "from-rose-100/80 via-orange-100/70 to-amber-100/60" },
  "circle draw": { emoji: "⭕", background: "from-fuchsia-100/80 via-pink-100/70 to-orange-100/60" },
  "zig-zag trace": { emoji: "⚡", background: "from-yellow-100/80 via-amber-100/70 to-orange-100/60" },
  "target aim": { emoji: "🎯", background: "from-rose-100/80 via-orange-100/70 to-yellow-100/60" },
  default: { emoji: "⭐", background: "from-sky-100/80 via-white/70 to-fuchsia-100/60" },
};

interface Target {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  rotation: number;
}

function BalloonTarget({ size }: { size: number }) {
  return (
    <span className="relative flex items-start justify-center" style={{ width: `${size}px`, height: `${size + 24}px` }}>
      <span className="absolute top-0 h-[78%] w-[72%] rounded-[50%_50%_48%_48%] bg-gradient-to-b from-rose-400 via-pink-500 to-orange-400 shadow-[inset_-8px_-12px_18px_rgba(255,255,255,0.28),0_14px_18px_rgba(244,114,182,0.26)]" />
      <span className="absolute top-[22%] left-[22%] h-[20%] w-[12%] rounded-full bg-white/45 blur-[1px]" />
      <span className="absolute bottom-[18%] h-2.5 w-2.5 rotate-45 bg-orange-400" />
      <span className="absolute bottom-0 h-[24%] w-[2px] rounded-full bg-slate-500/75" />
    </span>
  );
}

export default function TappingEngine({ game, onInteraction, onComplete }: Props) {
  const theme = ((game.config.theme as string) || "default").toLowerCase();
  const visual = themeVisuals[theme] || themeVisuals.default;
  const speed = (game.config.speed as string) || "medium";
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const idRef = useRef(0);
  const missTimeoutsRef = useRef<number[]>([]);

  const spawnInterval = speed === "slow" ? 1400 : speed === "medium" ? 950 : 650;
  const targetLifetime = speed === "slow" ? 2400 : speed === "medium" ? 2000 : 1600;

  const accuracy = useMemo(() => {
    const totalAttempts = score + missed;
    return totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 100;
  }, [missed, score]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft !== 0) return;

    missTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    missTimeoutsRef.current = [];

    onComplete(accuracy);
  }, [accuracy, onComplete, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const spawner = window.setInterval(() => {
      const id = idRef.current++;
      const timeoutId = window.setTimeout(() => {
        setTargets((currentTargets) => {
          const stillVisible = currentTargets.some((target) => target.id === id);
          if (stillVisible) {
            setMissed((currentMissed) => currentMissed + 1);
          }
          return currentTargets.filter((target) => target.id !== id);
        });
      }, targetLifetime);

      missTimeoutsRef.current.push(timeoutId);

      setTargets((currentTargets) => [
        ...currentTargets,
        {
          id,
          x: 8 + Math.random() * 76,
          y: 12 + Math.random() * 62,
          emoji: visual.emoji,
          size: 54 + Math.round(Math.random() * 14),
          rotation: -12 + Math.round(Math.random() * 24),
        },
      ]);
    }, spawnInterval);

    return () => window.clearInterval(spawner);
  }, [spawnInterval, targetLifetime, timeLeft, visual.emoji]);

  useEffect(() => {
    return () => {
      missTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      missTimeoutsRef.current = [];
    };
  }, []);

  const handleTap = (id: number) => {
    onInteraction();
    setScore((currentScore) => currentScore + 1);
    setTargets((currentTargets) => currentTargets.filter((target) => target.id !== id));
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex justify-between text-sm text-muted-foreground">
        <span>Time {timeLeft}s</span>
        <span>Score {score}</span>
        <span>Accuracy {accuracy}%</span>
      </div>

      <div
        className={`relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br ${visual.background} shadow-[0_18px_45px_rgba(15,23,42,0.12)]`}
        style={{ height: "420px" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.48),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.3),_transparent_42%)]" />

        <div className="absolute left-4 top-4 rounded-full bg-white/65 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          Tap the {theme === "default" ? "targets" : theme}
        </div>

        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              initial={{ opacity: 0, scale: 0.4, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleTap(target.id)}
              className="touch-target absolute flex items-center justify-center drop-shadow-[0_10px_18px_rgba(15,23,42,0.2)]"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size + (visual.renderAs === "balloon" ? 24 : 0)}px`,
                marginLeft: `-${target.size / 2}px`,
                marginTop: `-${target.size / 2}px`,
                transform: `rotate(${target.rotation}deg)`,
                fontSize: `${Math.max(34, target.size - 10)}px`,
              }}
            >
              {visual.renderAs === "balloon" ? <BalloonTarget size={target.size} /> : target.emoji}
            </motion.button>
          ))}
        </AnimatePresence>

        {timeLeft === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-card/72 backdrop-blur-sm">
            <div className="text-center">
              <p className="mb-2 text-5xl">🎉</p>
              <p className="font-display text-xl font-bold text-foreground">You caught {score}!</p>
              <p className="mt-1 text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
