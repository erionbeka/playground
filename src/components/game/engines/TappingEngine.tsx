import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { clamp, getAdaptiveGameConfig } from "@/lib/gameProgression";
import { getThemeVisual } from "@/lib/gameAssets";
import { speak } from "@/lib/speech";
import { useSensory } from "@/lib/sensory";
import { BurstLayer, ComboBadge, pointFromEvent, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder, nowMs } from "@/lib/gameAnalytics";
import { praise } from "@/lib/praise";
import TracingEngine from "./TracingEngine";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

const themeBackgrounds: Record<string, string> = {
  butterflies: "from-fuchsia-200/70 via-pink-100/60 to-sky-100/60",
  bubbles: "from-cyan-100/70 via-sky-100/70 to-white/60",
  stars: "from-amber-100/80 via-yellow-100/70 to-orange-100/60",
  fish: "from-cyan-100/80 via-sky-100/70 to-emerald-100/60",
  balloons: "from-rose-100/80 via-orange-100/70 to-sky-100/60",
  fireflies: "from-amber-100/80 via-lime-100/60 to-emerald-100/60",
  leaves: "from-emerald-100/80 via-lime-100/70 to-yellow-100/60",
  snowflakes: "from-sky-100/80 via-cyan-50/80 to-white/70",
  raindrops: "from-sky-100/80 via-cyan-100/70 to-indigo-100/60",
  birds: "from-sky-100/80 via-white/70 to-emerald-100/60",
  ladybugs: "from-rose-100/80 via-red-100/70 to-amber-100/60",
  flowers: "from-pink-100/80 via-fuchsia-100/70 to-violet-100/60",
  jellyfish: "from-cyan-100/80 via-violet-100/70 to-fuchsia-100/60",
  rockets: "from-indigo-100/80 via-sky-100/70 to-slate-100/60",
  clouds: "from-slate-100/80 via-sky-100/70 to-white/70",
  fireworks: "from-indigo-100/80 via-fuchsia-100/60 to-amber-100/60",
  hearts: "from-rose-100/80 via-pink-100/70 to-white/70",
  snowman: "from-sky-100/80 via-white/80 to-cyan-100/60",
  acorn: "from-amber-100/80 via-orange-100/60 to-lime-100/50",
  default: "from-sky-100/80 via-white/70 to-fuchsia-100/60",
};

const FALL_THEMES = new Set(["raindrops", "snowflakes", "leaves"]);
const RISE_THEMES = new Set(["balloons", "rockets", "birds", "bubbles"]);
const TRACE_THEMES = new Set(["trace lines", "connect dots", "swipe patterns", "follow the path", "slow drag", "circle draw", "zig-zag trace", "spiral trace", "rainbow arc"]);

const DISTRACTOR_POOL = ["🍂", "🪨", "🍄", "🌰", "🪁"];

interface Target {
  id: number;
  x: number;
  y: number;
  label: string;
  size: number;
  rotation: number;
  kind: "target" | "distractor";
  gold?: boolean;
  spawnedAt: number;
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
  const speed = (game.config.speed as string) || "medium";

  if (TRACE_THEMES.has(theme)) {
    return <TracingEngine game={game} onInteraction={onInteraction} onComplete={onComplete} />;
  }

  return <TapPlay key={theme} game={game} theme={theme} speed={speed} onInteraction={onInteraction} onComplete={onComplete} />;
}

interface TapPlayProps extends Props {
  theme: string;
  speed: string;
}

function TapPlay({ game, theme, speed, onInteraction, onComplete }: TapPlayProps) {
  const visual = getThemeVisual(theme);
  const background = themeBackgrounds[theme] || themeBackgrounds.default;
  const { difficulty, supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const { calmMode } = useSensory();
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [missed, setMissed] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(calmMode ? 120 : 24);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const comboRef = useRef(0);
  const missTimeoutsRef = useRef<number[]>([]);
  const spawnLoopRef = useRef<number | null>(null);
  const timeLeftRef = useRef(timeLeft);
  const hitsRef = useRef(hits);
  const completedRef = useRef(false);
  const { playHitSound, playMissSound, playTone } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const goalBase = difficulty === "easy" ? 10 : difficulty === "medium" ? 14 : 18;
  const goal = supportLevel === "high" ? Math.max(8, goalBase - 3) : supportLevel === "light" ? goalBase + 2 : goalBase;
  const showDistractors = supportLevel !== "high" && difficulty !== "easy" && !calmMode;
  const calmPrompt = theme.includes("trace") || theme.includes("slow") || theme.includes("path") || theme.includes("connect");
  const baseSpawnInterval = speed === "slow" ? 1400 : speed === "medium" ? 950 : 650;
  const readinessAdjustment = readinessStage === "stabilize" ? 220 : readinessStage === "stretch" ? -120 : 0;
  const calmAdjustment = calmMode ? Math.round(baseSpawnInterval * 0.4) : 0;
  const spawnInterval = supportLevel === "high" ? baseSpawnInterval + 250 + readinessAdjustment + calmAdjustment : supportLevel === "light" ? Math.max(450, baseSpawnInterval - 120 + readinessAdjustment + calmAdjustment) : baseSpawnInterval + readinessAdjustment + calmAdjustment;

  const baseTargetLifetime = speed === "slow" ? 2400 : speed === "medium" ? 2000 : 1600;
  const targetLifetime = supportLevel === "high" ? baseTargetLifetime + 350 : supportLevel === "light" ? Math.max(1200, baseTargetLifetime - 180) : baseTargetLifetime;

  const travelMode = FALL_THEMES.has(theme) ? "fall" : RISE_THEMES.has(theme) ? "rise" : "float";

  const accuracy = useMemo(() => {
    const totalAttempts = hits + missed + wrongTaps;
    return totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 100;
  }, [hits, missed, wrongTaps]);

  const progress = useMemo(() => Math.round((hits / goal) * 100), [goal, hits]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    hitsRef.current = hits;
  }, [hits]);

  useEffect(() => {
    speak(calmPrompt ? `Tap gently through the ${theme}.` : `Catch ${goal} ${theme}. Ready?`);
  }, [calmPrompt, goal, theme]);

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
    if (completedRef.current) return;
    completedRef.current = true;
    const trials = hits + missed + wrongTaps;
    onComplete(clamp(Math.round((accuracy + progress) / 2), 35, 100), undefined, withTrace(rec, buildCompletionMetrics({
      trials,
      correctTrials: hits,
      errors: missed + wrongTaps,
      masteryThreshold: masteryForSupport(supportLevel, { high: 45, moderate: 55 }),
      attemptsBySkill: { "visual-attention": trials, "motor-response": hits, inhibition: wrongTaps },
      observations: [`Caught ${hits} of ${goal} targets before time ended.`],
    })));
  }, [accuracy, goal, hits, missed, onComplete, progress, supportLevel, timeLeft, wrongTaps]);

  useEffect(() => {
    if (hits < goal || timeLeft <= 0) return;

    missTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    missTimeoutsRef.current = [];
    if (completedRef.current) return;
    completedRef.current = true;
    speak(`${praise("finish", hits)} You caught ${hits} targets!`);
    const trials = hits + missed + wrongTaps;
    onComplete(clamp(Math.round((accuracy + progress) / 2), 60, 100), undefined, withTrace(rec, buildCompletionMetrics({
      trials,
      correctTrials: hits,
      errors: missed + wrongTaps,
      masteryThreshold: masteryForSupport(supportLevel, { high: 45, moderate: 55 }),
      attemptsBySkill: { "visual-attention": trials, "motor-response": hits, inhibition: wrongTaps },
      observations: [`Reached the target goal of ${goal} with ${missed} misses and ${wrongTaps} decoy taps.`],
    })));
  }, [accuracy, goal, hits, missed, onComplete, progress, supportLevel, timeLeft, wrongTaps]);

  const spawnTarget = useCallback(() => {
    if (timeLeftRef.current <= 0 || hitsRef.current >= goal) return;

    const id = idRef.current++;
    const spawnDistractor = showDistractors && Math.random() > (difficulty === "hard" || supportLevel === "light" ? 0.45 : 0.72);
    const kind: Target["kind"] = spawnDistractor ? "distractor" : "target";
    const gold = kind === "target" && !calmMode && Math.random() > 0.88;
    const timeoutId = window.setTimeout(() => {
      setTargets((currentTargets) => {
        const currentTarget = currentTargets.find((target) => target.id === id);
        if (currentTarget?.kind === "target") {
          setMissed((currentMissed) => currentMissed + 1);
          comboRef.current = 0;
          setCombo(0);
          rec.trial({
            stimulus: `${theme}:missed`,
            correct: false,
            latencyMs: targetLifetime,
          });
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
        label: kind === "target" ? visual : DISTRACTOR_POOL[id % DISTRACTOR_POOL.length],
        size: (54 + Math.round(Math.random() * 14)) + (gold ? 10 : 0),
        rotation: -12 + Math.round(Math.random() * 24),
        kind,
        gold,
        spawnedAt: nowMs(),
      },
    ]);
  }, [calmMode, difficulty, goal, rec, showDistractors, supportLevel, targetLifetime, theme, visual]);

  useEffect(() => {
    if (timeLeft <= 0 || hits >= goal) return;

    const runLoop = () => {
      spawnTarget();
      if (timeLeftRef.current <= 0 || hitsRef.current >= goal) return;
      spawnLoopRef.current = window.setTimeout(runLoop, spawnInterval);
    };

    runLoop();

    return () => {
      if (spawnLoopRef.current !== null) {
        window.clearTimeout(spawnLoopRef.current);
        spawnLoopRef.current = null;
      }
    };
  }, [goal, hits, spawnInterval, spawnTarget, timeLeft]);

  useEffect(() => {
    return () => {
      if (spawnLoopRef.current !== null) {
        window.clearTimeout(spawnLoopRef.current);
        spawnLoopRef.current = null;
      }
      missTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      missTimeoutsRef.current = [];
    };
  }, []);

  const handleTap = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    onInteraction();
    const point = pointFromEvent(event, fieldRef.current);
    const tapped = targets.find((target) => target.id === id);
    setTargets((currentTargets) => currentTargets.filter((target) => target.id !== id));

    if (!tapped) return;

    if (tapped.kind === "target") {
      rec.trial({
        stimulus: `${theme}:hit${tapped.gold ? ":gold" : ""}`,
        correct: true,
        latencyMs: nowMs() - tapped.spawnedAt,
        x: point.x,
        y: point.y,
      });
      comboRef.current += 1;
      setCombo(comboRef.current);
      playHitSound(comboRef.current);
      if (tapped.gold) playTone({ frequency: 1046.5, duration: 0.22, volume: 0.055, type: "triangle" });
      fireBurst(point.x, point.y, tapped.gold ? "🌟" : visual);
      setHits((currentScore) => currentScore + (tapped.gold ? 2 : 1));
    } else {
      rec.trial({
        stimulus: "decoy",
        correct: false,
        latencyMs: nowMs() - tapped.spawnedAt,
        x: point.x,
        y: point.y,
      });
      comboRef.current = 0;
      setCombo(0);
      setWrongTaps((currentWrongTaps) => currentWrongTaps + 1);
      wobble();
      playMissSound();
    }
  };

  const travelMotion =
    travelMode === "fall"
      ? { y: ["-8%", "108%"] }
      : travelMode === "rise"
        ? { y: ["108%", "-12%"] }
        : { y: [0, -10, 0] };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex justify-between text-sm text-muted-foreground">
        <span>Targets {hits}/{goal}</span>
        <span>{calmMode ? "Take your time 🌈" : `⏱ ${timeLeft}s`}</span>
      </div>
      <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <motion.div
        animate={controls}
        className={`relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br ${background} shadow-[0_18px_45px_rgba(15,23,42,0.12)]`}
        ref={fieldRef}
        style={{ height: "420px" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.48),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.3),_transparent_42%)]" />

        {showDistractors ? (
          <div className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold text-slate-700">
            Ignore the grey decoys
          </div>
        ) : null}
        <ComboBadge combo={combo} />
        <div className="absolute left-4 bottom-4 z-10 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {travelMode === "fall"
            ? `Catch the ${theme === "default" ? "targets" : theme} as they fall`
            : travelMode === "rise"
              ? `Tap them before they float away`
              : calmPrompt
                ? `Tap slowly through the ${theme}`
                : `Tap every ${theme === "default" ? "target" : theme.replace(/s$/, "")}!`}
        </div>

        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              initial={{ opacity: 0, scale: 0.4, y: travelMode === "float" ? 20 : travelMode === "rise" ? "104%" : "-8%" }}
              animate={{ opacity: 1, scale: 1, ...travelMotion }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={
                travelMode === "float"
                  ? { duration: 0.3 }
                  : { duration: targetLifetime / 1000, ease: "linear" }
              }
              onClick={(event) => handleTap(target.id, event)}
              className={`touch-target absolute flex items-center justify-center drop-shadow-[0_10px_18px_rgba(15,23,42,0.2)] ${
                target.gold ? "drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]" : ""
              }`}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size + (target.kind === "target" && visual === "🎈" ? 24 : 0)}px`,
                marginLeft: `-${target.size / 2}px`,
                marginTop: `-${target.size / 2}px`,
                transform: `rotate(${target.rotation}deg)`,
                fontSize: `${Math.max(26, target.size - 12)}px`,
                opacity: target.kind === "target" ? 1 : 0.72,
              }}
              aria-label={target.kind === "target" ? `${theme} target` : "decoy target"}
            >
              {target.kind === "target" && visual === "🎈" ? <BalloonTarget size={target.size} /> : (
                <span className="relative">
                  <span aria-hidden="true">{target.label}</span>
                  {target.gold ? <span aria-hidden="true" className="absolute -right-2 -top-2 text-base">⭐</span> : null}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>

        <BurstLayer bursts={bursts} />

        {timeLeft === 0 || hits >= goal ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-card/72 backdrop-blur-sm">
            <div className="text-center">
              <p className="mb-2 text-5xl">{hits >= goal ? "🏆" : "⏰"}</p>
              <p className="font-display text-xl font-bold text-foreground">You caught {hits} targets!</p>
              <p className="mt-1 text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Decoys tapped: {wrongTaps}</p>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
